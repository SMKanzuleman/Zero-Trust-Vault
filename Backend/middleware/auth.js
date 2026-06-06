const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  // ── Step 1: Extract the token from header or query string ───────────────
  let token;
  const authHeader = req.headers['authorization'];

  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    }
  }

  // Fallback to query string (e.g. for native browser downloads)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No valid token present.',
    });
  }

  // ── Step 3: Verify cryptographic signature via JWT_SECRET ─────────────────
  // jwt.verify uses the HMAC-SHA256 algorithm by default (HS256).
  // JWT_SECRET should be a long, random string stored in .env — never hardcoded.
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Bind the full decoded payload to the request object for downstream use
    req.user = decoded;

    // Pass control to the next middleware or route handler
    next();
  } catch (err) {
    // Distinguish between expiry and forgery for detailed client feedback
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
    }

    // JsonWebTokenError covers malformed tokens, invalid signatures, etc.
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Authentication failed.',
    });
  }
};
module.exports = { authenticateJWT };
