const crypto = require('crypto');

/**
 * ChaCha20-Poly1305 (RFC 8439) Authenticated Encryption with Associated Data (AEAD)
 * 256-bit key, 96-bit nonce, 128-bit authentication tag.
 * Superior for mobile laboratory tablets (ARM/Wasm) with constant-time execution.
 */

const ALGORITHM = 'chacha20-poly1305';
const NONCE_BYTES = 12; // 96 bits
const TAG_BYTES = 16;   // 128 bits

/**
 * Derives a 256-bit encryption key from a secret string and tenant salt using scrypt.
 * @param {string} secret 
 * @param {string} salt 
 * @returns {Buffer} 32-byte key
 */
function deriveKey(secret, salt = 'hrgen-gia-lims-default-salt') {
  if (!secret) throw new Error('Secret is required for key derivation');
  return crypto.scryptSync(secret, salt, 32, { N: 16384, r: 8, p: 1 });
}

/**
 * Encrypts arbitrary plaintext (string or object) using ChaCha20-Poly1305.
 * @param {string|object} data Plaintext payload
 * @param {Buffer|string} key 32-byte Buffer or secret string
 * @param {string} aad Optional Additional Authenticated Data (e.g. tenantId or patientId)
 * @returns {{ ciphertext: string, nonce: string, tag: string, aad: string }}
 */
function encryptChaCha20(data, key, aad = '') {
  const encKey = Buffer.isBuffer(key) ? key : deriveKey(key);
  if (encKey.length !== 32) throw new Error('ChaCha20 key must be 32 bytes');

  const nonce = crypto.randomBytes(NONCE_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, encKey, nonce, { authTagLength: TAG_BYTES });

  if (aad) {
    cipher.setAAD(Buffer.from(aad, 'utf8'));
  }

  const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString('base64'),
    nonce: nonce.toString('base64'),
    tag: tag.toString('base64'),
    aad: aad || undefined
  };
}

/**
 * Decrypts a ChaCha20-Poly1305 payload with authentication tag validation.
 * @param {{ ciphertext: string, nonce: string, tag: string, aad?: string }} payload
 * @param {Buffer|string} key 32-byte Buffer or secret string
 * @returns {string|object} Decrypted plaintext (parsed JSON if applicable)
 */
function decryptChaCha20(payload, key) {
  if (!payload || !payload.ciphertext || !payload.nonce || !payload.tag) {
    throw new Error('Malformed ChaCha20 payload: ciphertext, nonce, and tag required');
  }

  const decKey = Buffer.isBuffer(key) ? key : deriveKey(key);
  if (decKey.length !== 32) throw new Error('ChaCha20 key must be 32 bytes');

  const nonce = Buffer.from(payload.nonce, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const ciphertext = Buffer.from(payload.ciphertext, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, decKey, nonce, { authTagLength: TAG_BYTES });

  if (payload.aad) {
    decipher.setAAD(Buffer.from(payload.aad, 'utf8'));
  }
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
}

/**
 * Timing-safe comparison of cryptographic digests.
 */
function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = {
  deriveKey,
  encryptChaCha20,
  decryptChaCha20,
  timingSafeEqualHex,
  ALGORITHM
};
