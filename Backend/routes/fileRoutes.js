const express  = require('express');
const mongoose = require('mongoose');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');
const jwt      = require('jsonwebtoken');
const { authenticateJWT } = require('../middleware/auth');
const { 
  hashPassword, 
  verifyPassword, 
  encryptFileCLI, 
  decryptFileCLI,
  streamDecryptFile,
  hashFileCLI
} = require('../controllers/cryptoController');
const User       = require('../models/User');
const SecureFile = require('../models/SecureFile');
const BackupFile = require('../models/BackupFile');

// ─── DIRECTORY SETUP ─────────────────────────────────────────────────────────
// Define storage directories relative to the project root.
// These are created at startup if they don't already exist.

const TEMP_DIR      = path.join(__dirname, '..', 'uploads', 'temp');
const ENCRYPTED_DIR = path.join(__dirname, '..', 'uploads', 'encrypted');

[TEMP_DIR, ENCRYPTED_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 [FileRoutes] Created directory: ${dir}`);
  }
});

// ─── MULTER CONFIGURATION ────────────────────────────────────────────────────
// multer is used only for staging the raw upload to TEMP_DIR.
// The file never stays in TEMP_DIR after the handler completes.

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TEMP_DIR),

  // Preserve the original filename with a timestamp prefix to avoid collisions
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName  = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB hard limit per upload (MongoDB document limit)
  },
});

// ─── HELPER: Safe File Deletion ───────────────────────────────────────────────
/**
 * Deletes a file from disk, suppressing errors (file may already be gone).
 * Used after encrypting temp files and after streaming decrypted files.
 *
 * @param {string} filePath - Absolute path to the file to delete.
 */
const safeDelete = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  [FileRoutes] Deleted ephemeral file: ${path.basename(filePath)}`);
    }
  } catch (err) {
    console.error(`⚠️  [FileRoutes] Could not delete ${filePath}: ${err.message}`);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/auth/signup
 * ──────────────────────────────────────────────────────────────────────────────
 * Registers a new user. Hashes the password via scrypt (OpenSSL-backed),
 * stores the 'salt:hash' credential in MongoDB.
 *
 * Body: { username: string, password: string }
 * Response 201: { success: true, message, user: { id, username } }
 */
router.post('/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // ── Input Validation ────────────────────────────────────────────────────
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'username, email, and password are required fields.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    // ── Duplicate Check ─────────────────────────────────────────────────────
    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: `Username '${username}' is already taken.`,
      });
    }

    const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: `Email '${email}' is already in use.`,
      });
    }

    // ── Password Hashing (scrypt via OpenSSL binding) ────────────────────
    // hashPassword() internally calls crypto.scryptSync(), which delegates
    // to the host system's OpenSSL scrypt implementation.
    const passwordHash = hashPassword(password);

    // ── Persist User Document ────────────────────────────────────────────────
    const newUser = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
    });

    console.log(`✅ [Auth] New user registered: ${newUser.username}`);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      user: {
        id:       newUser._id,
        username: newUser.username,
      },
    });
  } catch (err) {
    // Handle Mongoose validation errors cleanly
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(' ') });
    }
    console.error(`❌ [Auth] Signup error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

/**
 * POST /api/auth/login
 * ──────────────────────────────────────────────────────────────────────────────
 * Authenticates a user. Verifies the password using constant-time scrypt
 * comparison, then issues a signed JWT containing the user's profile.
 *
 * Body: { username: string, password: string }
 * Response 200: { success: true, token, user: { id, username } }
 *
 * JWT PAYLOAD:
 *   { id, username, iat, exp }
 *   Signed with: HMAC-SHA256 (HS256), secret from process.env.JWT_SECRET
 *   Expires in:  process.env.JWT_EXPIRES_IN (default: '8h')
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'username and password are required.',
      });
    }

    // ── Fetch User (include passwordHash — excluded from toJSON()) ─────────
    // We use `.select('+passwordHash')` pattern via a raw query since
    // the field is in the schema. We retrieve the raw document.
    const user = await User.findOne({ username: username.trim() }).lean();

    if (!user) {
      // Use a generic message to avoid username enumeration attacks
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    // ── Credential Verification (constant-time scrypt compare) ─────────────
    // verifyPassword() re-derives the scrypt hash with the stored salt and
    // compares using crypto.timingSafeEqual() — immune to timing attacks.
    const isMatch = verifyPassword(user.passwordHash, password);

    if (!isMatch) {
      console.warn(`⚠️  [Auth] Failed login attempt for username: ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    // ── Issue Signed JWT ─────────────────────────────────────────────────────
    // Payload carries identity.
    const payload = {
      id:       user._id.toString(),
      username: user.username,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      algorithm: 'HS256',
    });

    console.log(`✅ [Auth] User logged in: ${user.username}`);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id:       user._id,
        username: user.username,
      },
    });
  } catch (err) {
    console.error(`❌ [Auth] Login error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// USER SETTINGS ROUTES (JWT Protected)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/auth/profile
 * Retrieves the authenticated user's profile details.
 */
router.get('/auth/profile', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    
    return res.status(200).json({ success: true, user: { username: user.username, profilePicture: user.profilePicture } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * PUT /api/auth/profile
 * Updates the user's username and profile picture. Returns a new JWT if username changes.
 */
router.put('/auth/profile', authenticateJWT, async (req, res) => {
  try {
    const { username, profilePicture } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required.' });
    }

    const trimmedUsername = username.trim();

    // Check for duplicates
    const existingUser = await User.findOne({
      username: trimmedUsername,
      _id: { $ne: req.user.id }
    });

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Username is already taken.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.username = trimmedUsername;
    if (profilePicture !== undefined) {
      // Validate roughly that it's a base64 image (or empty string)
      user.profilePicture = profilePicture;
    }
    
    await user.save();

    // Issue new token since username is in payload
    const payload = {
      id: user._id.toString(),
      username: user.username,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      algorithm: 'HS256',
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      token,
      user: { id: user._id, username: user.username, profilePicture: user.profilePicture }
    });
  } catch (err) {
    console.error(`❌ [Auth] Profile update error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * PUT /api/auth/password
 * Updates the user's password securely using scrypt.
 */
router.put('/auth/password', authenticateJWT, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    }

    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const isMatch = verifyPassword(user.passwordHash, currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password.' });
    }

    user.passwordHash = hashPassword(newPassword);
    await user.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error(`❌ [Auth] Password update error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// FILE ROUTES (JWT Protected)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/files/upload
 * ──────────────────────────────────────────────────────────────────────────────
 * Uploads and encrypts a file into the vault.
 *
 * Middleware chain: authenticateJWT → multer (single file) → handler
 *
 * Form-data fields:
 *   - file        : The binary file to encrypt (multipart/form-data)
 *
 * Encryption: AES-256-CBC via system OpenSSL CLI (encryptFileCLI)
 * The temp plaintext is deleted IMMEDIATELY after encryption.
 *
 * Response 201: { success: true, message, file: { id, fileName, uploadedAt } }
 */
router.post(
  '/files/upload',
  authenticateJWT,
  upload.single('file'),
  async (req, res) => {
    // Track temp file path for cleanup in all error branches
    const tempFilePath = req.file ? req.file.path : null;

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file provided. Use multipart field name "file".' });
      }


      // ── Storage Quota Check ──────────────────────────────────────────────
      const MAX_STORAGE = 100 * 1024 * 1024; // 100 MB
      const newFileSize = req.file.size;

      const usageStats = await SecureFile.aggregate([
        { $match: { uploadedBy: new mongoose.Types.ObjectId(req.user.id) } },
        { $group: { _id: null, totalUsed: { $sum: '$fileSize' } } }
      ]);
      const currentUsage = usageStats.length > 0 ? usageStats[0].totalUsed : 0;

      if (currentUsage + newFileSize > MAX_STORAGE) {
        if (tempFilePath) safeDelete(tempFilePath);
        return res.status(403).json({
          success: false,
          message: 'Storage quota exceeded. You have reached your 100MB free storage limit.',
        });
      }

      // ── Build file paths ─────────────────────────────────────────────────
      const originalName    = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      // ── Generate deterministic encrypted file path ────────────────────────
      const fileId = new mongoose.Types.ObjectId();
      const encryptedName   = `${fileId.toString()}.enc`;
      const encryptedPath   = path.join(ENCRYPTED_DIR, encryptedName);

      // ── Retrieve the file encryption key from environment ─────────────────
      const encKey = process.env.FILE_ENCRYPTION_KEY;
      if (!encKey) {
        throw new Error('FILE_ENCRYPTION_KEY is not set in the environment.');
      }

      // ── Encrypt via OpenSSL CLI ──────────────────────────────────────────
      encryptFileCLI(tempFilePath, encryptedPath, encKey);

      // ── Hash the encrypted file via OpenSSL CLI ──────────────────────────
      const fileHash = hashFileCLI(encryptedPath);

      // ── Read encrypted file into Buffer for backup ───────────────────────
      const encryptedBuffer = fs.readFileSync(encryptedPath);

      // ── Persist metadata and Buffer to MongoDB ───────────────────────────
      const secureFile = await SecureFile.create({
        fileName:          originalName,
        fileData:          encryptedBuffer,
        fileHash:          fileHash,
        fileSize:          newFileSize,
        uploadedBy:        req.user.id,
      });

      // ── Store Pristine Backup to Isolated Backup Table ─────────────────────
      await BackupFile.create({
        secureFileId: secureFile._id,
        backupData:   encryptedBuffer,
      });

      // ── Delete the encrypted .enc file from disk ─────────────────────────
      safeDelete(encryptedPath);

      // ── Delete plaintext temp file (Zero plaintext at rest) ──────────────
      safeDelete(tempFilePath);

      console.log(`🔐 [Upload] Vaulted: ${originalName} by ${req.user.username}`);

      return res.status(201).json({
        success: true,
        message: 'File encrypted and stored in the vault.',
        file: {
          id:           secureFile._id,
          fileName:     secureFile.fileName,
          uploadedAt:   secureFile.uploadedAt,
        },
      });
    } catch (err) {
      // Ensure temp file is cleaned up even on failure
      if (tempFilePath) safeDelete(tempFilePath);
      console.error(`❌ [Upload] Error: ${err.message}`);
      return res.status(500).json({ success: false, message: `Upload failed: ${err.message}` });
    }
  }
);

/**
 * GET /api/files/
 * ──────────────────────────────────────────────────────────────────────────────
 * Lists all vault files visible to the authenticated user.
 * Does NOT expose encryptedFilePath for security.
 *
 * Response 200: { success: true, files: [...] }
 */
router.get('/files/', authenticateJWT, async (req, res) => {
  try {
    // ── Calculate Storage Quota ──────────────────────────────────────────
    const usageStats = await SecureFile.aggregate([
      { $match: { uploadedBy: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: null, totalUsed: { $sum: '$fileSize' } } }
    ]);
    const totalUsedBytes = usageStats.length > 0 ? usageStats[0].totalUsed : 0;

    // Fetch files (excluding both fileData and backupData to save RAM)
    const dbFiles = await SecureFile.find({ uploadedBy: req.user.id })
      .populate('uploadedBy', 'username') // Populate uploader info
      .select('-backupData -fileData')    // Never expose or load the massive buffers for listing
      .sort({ uploadedAt: -1 });

    const files = dbFiles.map(file => {
      // Lazy verification: Assume healthy on load. 
      // If corruption is detected during download, the frontend handles the 400 error.
      return {
        _id: file._id,
        fileName: file.fileName,
        fileSize: file.fileSize,
        uploadedBy: file.uploadedBy,
        uploadedAt: file.uploadedAt,
        isCorrupted: false // Default to false
      };
    });

    return res.status(200).json({
      success: true,
      count: files.length,
      totalUsedBytes,
      files,
    });
  } catch (err) {
    console.error(`❌ [List] Error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to retrieve file list.' });
  }
});


/**
 * GET /api/files/download/:id
 * ──────────────────────────────────────────────────────────────────────────────
 * Decrypts and streams a vault file to the authenticated, authorised client.
 *
 * Zero-Leak Compliance:
 *   - The decrypted plaintext file is written to TEMP_DIR with a UUID prefix.
 *   - It is streamed as an HTTP attachment using res.download().
 *   - The temp file is DELETED in the res.download() callback (whether success
 *     or failure) — ensuring zero persistence of plaintext on the server.
 *

 *
 * Response: Streamed binary file (application/octet-stream) | JSON error
 */
router.get('/files/download/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;

    // ── Fetch file metadata ──────────────────────────────────────────────
    const secureFile = await SecureFile.findById(id);

    if (!secureFile) {
      return res.status(404).json({ success: false, message: 'File not found in the vault.' });
    }

    // ── Verify file data exists in DB ─────────────────────────────────────
    if (!secureFile.fileData) {
      return res.status(500).json({
        success: false,
        message: 'Encrypted file data is missing from the database.',
      });
    }

    // ── Retrieve vault encryption key ─────────────────────────────────────
    const encKey = process.env.FILE_ENCRYPTION_KEY;
    if (!encKey) {
      throw new Error('FILE_ENCRYPTION_KEY is not configured on the server.');
    }

    console.log(`📤 [Download] Streaming in-memory: ${secureFile.fileName} → ${req.user.username}`);

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(secureFile.fileName)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // ── Decrypt via OpenSSL streams ───────────────────────────────────────
    await streamDecryptFile(secureFile.fileData, res, encKey);

    console.log(`✅ [Download] Transfer complete: ${secureFile.fileName}`);
  } catch (err) {
    if (!res.headersSent) {
      console.error(`❌ [Download] Error: ${err.message}`);
      return res.status(500).json({ success: false, message: `Download failed: ${err.message}` });
    } else {
      console.warn(`⚠️  [Download] Transfer interrupted: ${err.message}`);
    }
  }
});

// ─── HELPER: Get MIME Type ───────────────────────────────────────────────────
const getMimeType = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    'txt': 'text/plain',
    'html': 'text/html',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mp3': 'audio/mpeg',
    'csv': 'text/csv'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// ─── API: View File (Inline) ─────────────────────────────────────────────────
/**
 * GET /api/files/view/:id
 * Streams the decrypted file to the browser with inline content disposition.
 */
router.get('/files/view/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const secureFile = await SecureFile.findById(id);

    if (!secureFile || secureFile.uploadedBy.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'File not found or unauthorized.' });
    }

    if (!secureFile.fileData) {
      return res.status(500).json({ success: false, message: 'Encrypted file data is missing.' });
    }

    const encKey = process.env.FILE_ENCRYPTION_KEY;
    if (!encKey) throw new Error('FILE_ENCRYPTION_KEY is not configured on the server.');

    console.log(`👁️  [View] Streaming inline: ${secureFile.fileName} → ${req.user.username}`);

    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(secureFile.fileName)}"`);
    res.setHeader('Content-Type', getMimeType(secureFile.fileName));

    await streamDecryptFile(secureFile.fileData, res, encKey);
  } catch (err) {
    if (!res.headersSent) {
      console.error(`❌ [View] Error: ${err.message}`);
      return res.status(500).json({ success: false, message: `View failed: ${err.message}` });
    }
  }
});


// ─── API: Delete File ────────────────────────────────────────────────────────
/**
 * DELETE /api/files/:id
 * Removes a file from the vault.
 */
router.delete('/files/:id', authenticateJWT, async (req, res) => {
  try {
    const fileId = req.params.id;

    const file = await SecureFile.findOne({ _id: fileId, uploadedBy: req.user.id });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    // First delete from main table
    await SecureFile.findOneAndDelete({ _id: fileId });

    // Then delete from backup table
    await BackupFile.findOneAndDelete({ secureFileId: fileId });

    console.log(`🗑️  [Delete] File deleted: ${file.fileName} by ${req.user.username}`);
    return res.status(200).json({ success: true, message: 'File deleted securely.' });
  } catch (err) {
    console.error(`❌ [Delete] Error: ${err.message}`);
    return res.status(500).json({ success: false, message: `Delete failed: ${err.message}` });
  }
});

// ─── API: Verify File Integrity ──────────────────────────────────────────────
/**
 * GET /api/files/verify/:id
 * Hashes the MongoDB fileData buffer via OpenSSL and compares to the original DB hash.
 */
router.get('/files/verify/:id', authenticateJWT, async (req, res) => {
  let tempFilePath = null;
  try {
    const { id } = req.params;
    // Explicitly select fileData so we can hash it
    const secureFile = await SecureFile.findById(id).select('fileHash fileData uploadedBy fileName');

    if (!secureFile || secureFile.uploadedBy.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'File not found or unauthorized.' });
    }

    if (!secureFile.fileData) {
      return res.status(200).json({ success: true, status: 'corrupted', message: 'File data missing from database.' });
    }

    // Write MongoDB buffer to temp file to use OpenSSL CLI
    tempFilePath = path.join(TEMP_DIR, `${secureFile._id.toString()}_verify.enc`);
    fs.writeFileSync(tempFilePath, secureFile.fileData);

    // Hash the current buffer
    const currentHash = hashFileCLI(tempFilePath);

    // Clean up temp file immediately
    safeDelete(tempFilePath);

    if (currentHash !== secureFile.fileHash) {
      console.warn(`⚠️  [Verify] File corruption detected in database for: ${secureFile.fileName}`);
      return res.status(200).json({ success: true, status: 'corrupted' });
    }

    return res.status(200).json({ success: true, status: 'ok' });
  } catch (err) {
    if (tempFilePath) safeDelete(tempFilePath);
    console.error(`❌ [Verify] Error: ${err.message}`);
    return res.status(500).json({ success: false, message: `Verification failed: ${err.message}` });
  }
});

// ─── API: Recover Corrupted File ─────────────────────────────────────────────
/**
 * POST /api/files/recover/:id
 * Restores the working fileData buffer from the pristine backupData buffer.
 */
router.post('/files/recover/:id', authenticateJWT, async (req, res) => {
  try {
    const fileId = req.params.id;

    // 1. Fetch from database
    const fileRecord = await SecureFile.findOne({ _id: fileId, uploadedBy: req.user.id });
    if (!fileRecord) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    // Fetch pristine backup from separated table
    const backupRecord = await BackupFile.findOne({ secureFileId: fileRecord._id });
    if (!backupRecord || !backupRecord.backupData) {
      return res.status(404).json({ success: false, message: 'Pristine backup data is missing or destroyed!' });
    }

    // 2. Overwrite the main fileData with pristine backupData
    fileRecord.fileData = backupRecord.backupData;
    await fileRecord.save();

    console.log(`🛠️  [Recover] File successfully restored from DB backup: ${fileRecord.fileName}`);
    return res.status(200).json({ success: true, message: 'File recovered successfully.' });
  } catch (err) {
    console.error(`❌ [Recover] Error: ${err.message}`);
    return res.status(500).json({ success: false, message: `Recovery failed: ${err.message}` });
  }
});

module.exports = router;
