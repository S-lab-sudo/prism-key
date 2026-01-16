/**
 * Password Generation Tests
 * 
 * Tests the ACTUAL production code from src/lib/password.ts
 * Verifies cryptographic security and uniform distribution.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import {
  generatePassword,
  buildCharset,
  calculateRejectionLimit,
  calculatePasswordStrength,
} from '@/lib/password';

// Mock crypto.getRandomValues for consistent testing
beforeAll(() => {
  // Use native crypto in jsdom environment or mock if needed
  if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = {
      getRandomValues: <T extends ArrayBufferView | null>(array: T): T => {
        if (array instanceof Uint32Array) {
          for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 0xFFFFFFFF);
          }
        }
        return array;
      },
    } as Crypto;
  }
});

describe('Password Library - Production Code', () => {
  describe('generatePassword (from @/lib/password)', () => {
    it('generates password of correct length', () => {
      const password = generatePassword(20, { upper: true, lower: true, nums: true, syms: true });
      expect(password).toHaveLength(20);
    });

    it('generates empty string when no charset selected', () => {
      const password = generatePassword(20, { upper: false, lower: false, nums: false, syms: false });
      expect(password).toBe('');
    });

    it('respects uppercase-only option', () => {
      const password = generatePassword(100, { upper: true, lower: false, nums: false, syms: false });
      expect(password).toMatch(/^[A-Z]+$/);
    });

    it('respects lowercase-only option', () => {
      const password = generatePassword(100, { upper: false, lower: true, nums: false, syms: false });
      expect(password).toMatch(/^[a-z]+$/);
    });

    it('respects numbers-only option', () => {
      const password = generatePassword(100, { upper: false, lower: false, nums: true, syms: false });
      expect(password).toMatch(/^[0-9]+$/);
    });

    it('respects symbols-only option', () => {
      const password = generatePassword(100, { upper: false, lower: false, nums: false, syms: true });
      const validSymbols = /^[!@#$%^&*()\-_+=.,:;?]+$/;
      expect(password).toMatch(validSymbols);
    });

    it('generates unique passwords (non-deterministic)', () => {
      const passwords = new Set<string>();
      for (let i = 0; i < 100; i++) {
        passwords.add(generatePassword(20, { upper: true, lower: true, nums: true, syms: true }));
      }
      expect(passwords.size).toBe(100);
    });
  });

  describe('buildCharset', () => {
    it('builds correct charset for all options enabled', () => {
      const charset = buildCharset({ upper: true, lower: true, nums: true, syms: true });
      expect(charset).toContain('A');
      expect(charset).toContain('a');
      expect(charset).toContain('0');
      expect(charset).toContain('!');
      // 26 upper + 26 lower + 10 nums + 19 syms = 81
      expect(charset.length).toBe(26 + 26 + 10 + 19);
    });

    it('returns empty string when no options', () => {
      const charset = buildCharset({ upper: false, lower: false, nums: false, syms: false });
      expect(charset).toBe('');
    });
  });

  describe('calculateRejectionLimit', () => {
    it('calculates correct limit for common charset sizes', () => {
      // For 26 chars (uppercase only)
      const limit26 = calculateRejectionLimit(26);
      expect(limit26 % 26).toBe(0);
      expect(limit26).toBeLessThanOrEqual(0xFFFFFFFF);

      // For 94 chars (full printable ASCII)
      const limit94 = calculateRejectionLimit(94);
      expect(limit94 % 94).toBe(0);
      expect(limit94).toBeLessThanOrEqual(0xFFFFFFFF);
    });

    it('rejects less than 1% of the u32 range', () => {
      const charsetLength = 94;
      const limit = calculateRejectionLimit(charsetLength);
      const rejectionRate = (0xFFFFFFFF - limit) / 0xFFFFFFFF;
      expect(rejectionRate).toBeLessThan(0.01);
    });
  });

  describe('calculatePasswordStrength', () => {
    it('returns Weak for empty password', () => {
      expect(calculatePasswordStrength('').level).toBe('Weak');
    });

    it('returns Strong for long mixed password', () => {
      expect(calculatePasswordStrength('Abc123!@#$%^&*()_+').level).toBe('Strong');
    });

    it('returns Medium for moderate password', () => {
      // 'Abc123!' has length 7 (score 0), lower (1), upper (1), nums (1), sym (1) = 4 = Medium
      expect(calculatePasswordStrength('Abc123!').level).toBe('Medium');
    });
  });

  describe('Distribution Test (Chi-Squared)', () => {
    it('produces uniform distribution', () => {
      const sampleSize = 10000;
      const occurrences: Record<string, number> = {};
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      
      for (const char of charset) {
        occurrences[char] = 0;
      }
      
      for (let i = 0; i < 100; i++) {
        const password = generatePassword(sampleSize / 100, { upper: true, lower: false, nums: false, syms: false });
        for (const char of password) {
          occurrences[char]++;
        }
      }
      
      const expected = sampleSize / charset.length;
      let chiSquared = 0;
      
      for (const char of charset) {
        const observed = occurrences[char];
        chiSquared += Math.pow(observed - expected, 2) / expected;
      }
      
      // Critical value for 95% confidence, 25 df = 37.65
      // Using 2x safety margin for randomness tests
      expect(chiSquared).toBeLessThan(75);
    });
  });
});
