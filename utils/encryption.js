const bcrypt = require('bcrypt');
const crypto = require('crypto');

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Generate a random salt
 * @param {number} length - Length of salt in bytes
 * @returns {string} Hex string salt
 */
const generateSalt = (length = 16) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Encrypt data using AES-256-CBC
 * @param {string} text - Text to encrypt
 * @param {string} key - Encryption key (32 bytes for AES-256)
 * @returns {string} Encrypted text in hex
 */
const encrypt = (text, key) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt data using AES-256-CBC
 * @param {string} encryptedText - Encrypted text (iv:encrypted)
 * @param {string} key - Decryption key
 * @returns {string} Decrypted text
 */
const decrypt = (encryptedText, key) => {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = parts.join(':');
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

/**
 * Generate a secure random token
 * @param {number} length - Length in bytes
 * @returns {string} Hex token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

module.exports = {
  hashPassword,
  comparePassword,
  generateSalt,
  encrypt,
  decrypt,
  generateToken,
};