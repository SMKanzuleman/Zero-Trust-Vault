/**
 * @file server.js
 * @description Main entry point for the Zero-Trust Vault backend server.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * STARTUP SEQUENCE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *   1. Load environment variables from .env via 'dotenv'.
 *   2. Validate that all critical environment variables are present.
 *   3. Establish MongoDB connection via connectDB().
 *   4. Configure Express middleware stack (CORS, JSON body parser, etc.).
 *   5. Mount application routes under their respective prefixes.
 *   6. Attach a global error handler for unhandled route exceptions.
 *   7. Start HTTP listener on process.env.PORT.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * ENVIRONMENT VARIABLES REQUIRED (.env)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *   PORT                  → TCP port for the HTTP server (default: 5000)
 *   MONGO_URI             → MongoDB connection string (e.g. mongodb://localhost:27017/zerotrust)
 *   JWT_SECRET            → Long random string for HMAC-SHA256 JWT signing
 *   JWT_EXPIRES_IN        → JWT lifespan (e.g. '8h', '1d') — default: '8h'
 *   FILE_ENCRYPTION_KEY   → Passphrase for OpenSSL AES-256-CBC file encryption
 *   ALLOWED_ORIGINS       → Comma-separated list of allowed CORS origins
 *                           (e.g. 'http://localhost:3000,https://yourdomain.com')
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

// ── Step 1: Load environment variables (MUST be first) ───────────────────────
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const connectDB  = require('./config/db');
const fileRoutes = require('./routes/fileRoutes');

// ─── CRITICAL ENV VALIDATION ──────────────────────────────────────────────────
// Fail fast at startup if essential secrets are missing.
// Prevents the server from running in an insecure state.
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET', 'FILE_ENCRYPTION_KEY'];

const missingVars = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  console.error(
    `❌ [Server] Missing required environment variables: ${missingVars.join(', ')}\n` +
    '   Please populate your .env file before starting the server.'
  );
  process.exit(1);
}

// ─── APPLICATION INIT ─────────────────────────────────────────────────────────
const app  = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

// ─── CORS CONFIGURATION ───────────────────────────────────────────────────────
// Parse ALLOWED_ORIGINS from env (comma-separated list).
// Falls back to localhost:3000 for local development.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 [CORS] Blocked request from origin: ${origin}`);
      callback(new Error(`CORS policy violation: origin '${origin}' is not allowed.`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'Content-Disposition'], // Crucial for Axios download progress bar
  credentials: true,         // Allow cookies/auth headers cross-origin
  optionsSuccessStatus: 200, // Some browsers (IE11) choke on 204 for preflight
};

app.use(cors(corsOptions));

// ─── BODY PARSERS ─────────────────────────────────────────────────────────────
// Parse incoming JSON payloads (for login/signup request bodies)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded form bodies (standard HTML form submissions)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── SECURITY HEADERS ─────────────────────────────────────────────────────────
// Minimal hardening without helmet — keeps zero external dependency for core security.
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By'); // Don't advertise Express
  next();
});

// ─── REQUEST LOGGING ──────────────────────────────────────────────────────────
// Lightweight inline logger (no morgan dependency).
app.use((req, _res, next) => {
  const ts = new Date().toISOString();
  console.log(`📨 [${ts}] ${req.method} ${req.originalUrl} — IP: ${req.ip}`);
  next();
});

// ─── ROUTE MOUNTING ───────────────────────────────────────────────────────────
// All auth and file routes are exposed under the '/api' prefix.
// Route map:
//   /api/auth/signup          → POST  (public)
//   /api/auth/login           → POST  (public)
//   /api/files/upload         → POST  (JWT protected)
//   /api/files/               → GET   (JWT protected)
//   /api/files/download/:id   → GET   (JWT protected + RBAC)
app.use('/api', fileRoutes);

// ─── HEALTH CHECK ENDPOINT ────────────────────────────────────────────────────
// Useful for load balancers, container health probes, and uptime monitoring.
app.get('/health', (_req, res) => {
  res.status(200).json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    service:   'Zero-Trust Vault API',
    version:   process.env.npm_package_version || '1.0.0',
  });
});

// ─── 404 HANDLER ──────────────────────────────────────────────────────────────
// Catch all unmatched routes and return a structured 404 response.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
// Express calls this 4-argument function when next(err) is invoked anywhere
// in the middleware/route chain. Provides a centralised error response.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error(`❌ [Server] Unhandled error on ${req.method} ${req.originalUrl}: ${err.message}`);
  console.error(err.stack);

  // CORS errors from the origin check
  if (err.message && err.message.includes('CORS policy')) {
    return res.status(403).json({ success: false, message: err.message });
  }

  return res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred.',
    ...(process.env.NODE_ENV === 'development' && { detail: err.message }),
  });
});

// ─── PROCESS SIGNAL HANDLERS ──────────────────────────────────────────────────
// Graceful shutdown on SIGTERM (Docker/Kubernetes) and SIGINT (Ctrl+C).
const gracefulShutdown = (signal) => {
  console.log(`\n⚡ [Server] ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ [Server] HTTP server closed. Exiting.');
    process.exit(0);
  });

  // Force-kill if graceful shutdown takes too long
  setTimeout(() => {
    console.error('❌ [Server] Graceful shutdown timed out. Force-exiting.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('❌ [Server] Unhandled Promise Rejection:', reason);
});

// ─── STARTUP ──────────────────────────────────────────────────────────────────
/**
 * Bootstraps the server:
 *   1. Connects to MongoDB
 *   2. Starts HTTP listener
 */
const bootstrap = async () => {
  // Connect to MongoDB before accepting traffic
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║      🔒  ZERO-TRUST VAULT API ONLINE  🔒      ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(`   ➜  Listening on   : http://localhost:${PORT}`);
    console.log(`   ➜  Environment    : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   ➜  Health check   : http://localhost:${PORT}/health`);
    console.log(`   ➜  Allowed origins: ${allowedOrigins.join(', ')}`);
    console.log('──────────────────────────────────────────────\n');
  });

  // Expose server reference for graceful shutdown handler
  global.server = server;
  return server;
};

// Kick off the bootstrap sequence
bootstrap().catch((err) => {
  console.error(`❌ [Server] Fatal startup error: ${err.message}`);
  process.exit(1);
});
