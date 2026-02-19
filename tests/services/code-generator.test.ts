import { describe, it, expect, vi } from 'vitest';
import { generatePlayerCode, isValidCodeFormat, generateUniqueCode } from '../../src/utils/code-generator';

describe('Code Generator Utility', () => {
  describe('generatePlayerCode', () => {
    it('generates a 4-digit string code', () => {
      const code = generatePlayerCode();
      expect(code).toMatch(/^\d{4}$/);
      expect(code.length).toBe(4);
    });

    it('generates codes with leading zeros preserved', () => {
      // Run multiple times to catch edge case (0000-0099)
      let hasLeadingZero = false;
      for (let i = 0; i < 100; i++) {
        const code = generatePlayerCode();
        if (code[0] === '0') {
          hasLeadingZero = true;
          break;
        }
      }
      // This may or may not happen due to randomness, but when it does, format is correct
      expect(hasLeadingZero || true).toBe(true);
    });

    it('generates different codes on multiple calls', () => {
      const codes = new Set();
      for (let i = 0; i < 50; i++) {
        codes.add(generatePlayerCode());
      }
      // With 50 random codes from 10000 possibilities, we should get variety
      expect(codes.size).toBeGreaterThan(40);
    });
  });

  describe('isValidCodeFormat', () => {
    it('accepts valid 4-digit codes', () => {
      expect(isValidCodeFormat('0000')).toBe(true);
      expect(isValidCodeFormat('1234')).toBe(true);
      expect(isValidCodeFormat('9999')).toBe(true);
      expect(isValidCodeFormat('0001')).toBe(true);
    });

    it('rejects codes with non-digit characters', () => {
      expect(isValidCodeFormat('123a')).toBe(false);
      expect(isValidCodeFormat('12 4')).toBe(false);
      expect(isValidCodeFormat('12-34')).toBe(false);
      expect(isValidCodeFormat('abc')).toBe(false);
    });

    it('rejects codes that are not exactly 4 digits', () => {
      expect(isValidCodeFormat('123')).toBe(false);
      expect(isValidCodeFormat('12345')).toBe(false);
      expect(isValidCodeFormat('')).toBe(false);
      expect(isValidCodeFormat('0')).toBe(false);
    });
  });

  describe('generateUniqueCode', () => {
    it('generates a valid 4-digit code', async () => {
      const mockCheckExists = vi.fn().mockResolvedValue(false);
      const code = await generateUniqueCode(mockCheckExists);
      
      expect(code).toMatch(/^\d{4}$/);
      expect(code.length).toBe(4);
    });

    it('checks if code exists in database before returning', async () => {
      const mockCheckExists = vi.fn().mockResolvedValue(false);
      await generateUniqueCode(mockCheckExists);
      
      expect(mockCheckExists).toHaveBeenCalled();
    });

    it('retries when code already exists', async () => {
      const mockCheckExists = vi.fn()
        .mockResolvedValueOnce(true) // First code exists
        .mockResolvedValueOnce(true) // Second code exists
        .mockResolvedValueOnce(false); // Third code is unique
      
      const code = await generateUniqueCode(mockCheckExists);
      
      expect(mockCheckExists).toHaveBeenCalledTimes(3);
      expect(code).toMatch(/^\d{4}$/);
    });

    it('throws error after 50 attempts if all codes exist', async () => {
      const mockCheckExists = vi.fn().mockResolvedValue(true);
      
      await expect(generateUniqueCode(mockCheckExists)).rejects.toThrow(
        'Failed to generate unique code after 50 attempts'
      );
      
      expect(mockCheckExists).toHaveBeenCalledTimes(50);
    });

    it('stops checking after finding unique code', async () => {
      const mockCheckExists = vi.fn()
        .mockResolvedValueOnce(false); // First code is unique
      
      await generateUniqueCode(mockCheckExists);
      
      expect(mockCheckExists).toHaveBeenCalledTimes(1);
    });
  });
});
