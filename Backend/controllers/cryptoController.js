const crypto = require('crypto');
const { execSync, spawn } = require('child_process');
const path = require('path');

const hashPassword = (password) => {
  const SALT_BYTES = 16;
  const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
  const output = execSync('openssl dgst -sha256', {
    input: password + salt,
    encoding: 'utf-8'
  });
  let hashHex = output;
  if (output.includes('=')) {
    hashHex = output.split('=')[1].trim();
  } else {
    hashHex = output.trim();
  }
  return `${salt}:${hashHex}`;
};

const verifyPassword = (storedPassword, loginPassword) => {
  const [salt, storedHash] = storedPassword.split(':');
  if (!salt || !storedHash) {
    throw new Error('Stored credential format is invalid. Expected "salt:hash".');
  }
  const output = execSync('openssl dgst -sha256', {
    input: loginPassword + salt,
    encoding: 'utf-8'
  });
  let attemptHash = output;
  if (output.includes('=')) {
    attemptHash = output.split('=')[1].trim();
  } else {
    attemptHash = output.trim();
  }
  return attemptHash === storedHash;
};

const encryptFileCLI = (inputPath, outputPath, key) => {
  const safeInput = `"${inputPath}"`;
  const safeOutput = `"${outputPath}"`;
  const safeKey = `"${key.replace(/"/g, '\\"')}"`;
  const command = `openssl enc -aes-256-cbc -salt -pbkdf2 -in ${safeInput} -out ${safeOutput} -k ${safeKey}`;
  try {
    execSync(command, { stdio: 'pipe' });
    console.log(`🔐 [Crypto] File encrypted successfully → ${path.basename(outputPath)}`);
  } catch (err) {
    const detail = err.stderr ? err.stderr.toString().trim() : err.message;
    throw new Error(`[encryptFileCLI] OpenSSL encryption failed: ${detail}`);
  }
};

const decryptFileCLI = (inputPath, outputPath, key) => {
  const safeInput = `"${inputPath}"`;
  const safeOutput = `"${outputPath}"`;
  const safeKey = `"${key.replace(/"/g, '\\"')}"`;
  const command = `openssl enc -d -aes-256-cbc -pbkdf2 -in ${safeInput} -out ${safeOutput} -k ${safeKey}`;
  try {
    execSync(command, { stdio: 'pipe' });
    console.log(`🔓 [Crypto] File decrypted successfully → ${path.basename(outputPath)}`);
  } catch (err) {
    const detail = err.stderr ? err.stderr.toString().trim() : err.message;
    throw new Error(`[decryptFileCLI] OpenSSL decryption failed: ${detail}`);
  }
};

const streamDecryptFile = (fileBuffer, res, key) => {
  return new Promise((resolve, reject) => {
    const openssl = spawn('openssl', [
      'enc', '-d', '-aes-256-cbc', '-pbkdf2', '-k', key
    ]);
    let errorData = '';
    openssl.stderr.on('data', (data) => {
      errorData += data.toString();
    });
    openssl.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`OpenSSL stream decryption failed: ${errorData || 'Unknown error'}`));
      } else {
        resolve();
      }
    });
    openssl.on('error', (err) => {
      reject(new Error(`Failed to spawn OpenSSL: ${err.message}`));
    });
    openssl.stdout.pipe(res);
    openssl.stdin.write(fileBuffer);
    openssl.stdin.end();
  });
};

const hashFileCLI = (filePath) => {
  const safePath = `"${filePath}"`;
  const command = `openssl dgst -sha256 ${safePath}`;
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    let hashHex = output;
    if (output.includes('=')) {
      hashHex = output.split('=')[1].trim();
    } else {
      hashHex = output.trim();
    }
    return hashHex;
  } catch (err) {
    const detail = err.stderr ? err.stderr.toString().trim() : err.message;
    throw new Error(`[hashFileCLI] OpenSSL hashing failed: ${detail}`);
  }
};

module.exports = {
  hashPassword,
  verifyPassword,
  encryptFileCLI,
  decryptFileCLI,
  streamDecryptFile,
  hashFileCLI,
};
