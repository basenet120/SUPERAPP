const crypto = require('crypto');
const config = require('../config');

const ENCRYPTION_KEY = Buffer.from(config.encryption.key.padEnd(32).slice(0, 32));
const IV_LENGTH = 16;

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param {string} text - Data to encrypt
 * @returns {string} Encrypted data as base64 string
 */
const encrypt = (text) => {
  if (!text) return null;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV + authTag + encrypted data
  return iv.toString('base64') + ':' + authTag.toString('base64') + ':' + encrypted;
};

/**
 * Decrypt data encrypted with encrypt()
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @returns {string} Decrypted text
 */
const decrypt = (encryptedData) => {
  if (!encryptedData) return null;
  
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) return null;
    
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

/**
 * Hash data using SHA-256
 * @param {string} data - Data to hash
 * @returns {string} SHA-256 hash
 */
const hash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes
 * @returns {string} Hex encoded token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash password using bcrypt (wrapper for consistency)
 * Uses bcryptjs in actual implementation
 */
const hashPassword = async (password) => {
  const bcrypt = require('bcryptjs');
  return bcrypt.hash(password, 12);
};

const comparePassword = async (password, hash) => {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(password, hash);
};

module.exports = {
  encrypt,
  decrypt,
  hash,
  generateToken,
  hashPassword,
  comparePassword
};
