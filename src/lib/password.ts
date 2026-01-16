/**
 * PrismKey Password Generation Library
 * 
 * Implements cryptographically secure password generation using rejection sampling
 * to eliminate modulo bias (per Lemire, 2019).
 */

export interface PasswordOptions {
  upper: boolean;
  lower: boolean;
  nums: boolean;
  syms: boolean;
}

const CHARSET_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CHARSET_LOWER = "abcdefghijklmnopqrstuvwxyz";
const CHARSET_NUMS = "0123456789";
const CHARSET_SYMS = "!@#$%^&*()-_+=.,:;?";

/**
 * Builds the character set based on provided options.
 */
export function buildCharset(options: PasswordOptions): string {
  let charset = "";
  if (options.upper) charset += CHARSET_UPPER;
  if (options.lower) charset += CHARSET_LOWER;
  if (options.nums) charset += CHARSET_NUMS;
  if (options.syms) charset += CHARSET_SYMS;
  return charset;
}

/**
 * Calculates the rejection limit for uniform random sampling.
 * This is the largest multiple of charsetLength that fits in a u32.
 */
export function calculateRejectionLimit(charsetLength: number): number {
  return Math.floor(0xFFFFFFFF / charsetLength) * charsetLength;
}

/**
 * Generates a cryptographically secure password using rejection sampling.
 * 
 * @param length - Desired password length
 * @param options - Character set options
 * @returns Generated password string
 */
export function generatePassword(length: number, options: PasswordOptions): string {
  const charset = buildCharset(options);
  if (!charset) return "";

  const charsetLength = charset.length;
  const limit = calculateRejectionLimit(charsetLength);

  let pass = "";
  while (pass.length < length) {
    const array = new Uint32Array(length - pass.length);
    
    // Use window.crypto in browser, crypto in Node
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else if (typeof crypto !== 'undefined') {
      crypto.getRandomValues(array);
    } else {
      throw new Error('No crypto API available');
    }
    
    for (let i = 0; i < array.length && pass.length < length; i++) {
      if (array[i] < limit) {
        pass += charset[array[i] % charsetLength];
      }
      // Values >= limit are rejected to eliminate modulo bias
    }
  }
  return pass;
}

/**
 * Calculates password strength based on entropy.
 */
export function calculatePasswordStrength(password: string): {
  level: 'Weak' | 'Medium' | 'Strong';
  score: number;
} {
  if (!password) return { level: 'Weak', score: 0 };
  
  let score = 0;
  
  // Length score
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (password.length >= 20) score += 1;
  
  // Character variety score
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  
  let level: 'Weak' | 'Medium' | 'Strong';
  if (score >= 7) {
    level = 'Strong';
  } else if (score >= 4) {
    level = 'Medium';
  } else {
    level = 'Weak';
  }
  
  return { level, score };
}
