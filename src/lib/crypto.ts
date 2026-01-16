/**
 * PrismKey Crypto Utilities
 * 
 * Implements AES-GCM client-side encryption for vault data.
 * The master password is never stored - it's used to derive a key via PBKDF2.
 */

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;
const ITERATIONS = 100000;

/**
 * Derives an AES-GCM key from a master password using PBKDF2.
 */
export async function deriveKey(password: string, salt: BufferSource): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts plaintext using AES-GCM.
 * Returns a base64 string containing: salt (16 bytes) + iv (12 bytes) + ciphertext
 */
export async function encrypt(plaintext: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  // Combine salt + iv + ciphertext into a single buffer
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  // Convert to base64 for storage
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a base64-encoded ciphertext using AES-GCM.
 */
export async function decrypt(encryptedData: string, password: string): Promise<string> {
  const decoder = new TextDecoder();
  
  // Decode from base64
  const combined = new Uint8Array(
    atob(encryptedData)
      .split('')
      .map((c) => c.charCodeAt(0))
  );

  // Extract salt, iv, and ciphertext - create new arrays to fix type compatibility
  const salt = new Uint8Array(combined.buffer, 0, SALT_LENGTH);
  const iv = new Uint8Array(combined.buffer, SALT_LENGTH, IV_LENGTH);
  const ciphertext = new Uint8Array(combined.buffer, SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(password, salt);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return decoder.decode(plaintext);
}

/**
 * Validates if a string is encrypted (base64 with expected structure).
 * This is a heuristic check, not cryptographic validation.
 */
export function isEncrypted(value: string): boolean {
  try {
    const decoded = atob(value);
    // Minimum length: salt (16) + iv (12) + at least 1 byte ciphertext + 16 byte auth tag
    return decoded.length >= SALT_LENGTH + IV_LENGTH + 17;
  } catch {
    return false;
  }
}
