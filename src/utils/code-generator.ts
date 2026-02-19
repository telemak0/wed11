/**
 * Generate a random 4-digit numeric code as a string
 * Example: "0142", "9999", "0000"
 * @returns A 4-digit numeric code with leading zeros preserved
 */
export const generatePlayerCode = (): string => {
  const randomNum = Math.floor(Math.random() * 10000);
  return String(randomNum).padStart(4, '0');
};

/**
 * Validate that a code is exactly 4 digits
 * @param code The code string to validate
 * @returns True if the code is exactly 4 digits, false otherwise
 */
export const isValidCodeFormat = (code: string): boolean => {
  return /^\d{4}$/.test(code);
};

/**
 * Generate a unique 4-digit code by checking for existing codes
 * @param checkCodeExists Function that returns true if code already exists in database
 * @returns A unique 4-digit code that doesn't exist in the database
 * @throws Error if unable to generate unique code after 50 attempts
 */
export const generateUniqueCode = async (
  checkCodeExists: (code: string) => Promise<boolean>
): Promise<string> => {
  const maxAttempts = 50;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const code = generatePlayerCode();
    const exists = await checkCodeExists(code);

    if (!exists) {
      return code; // Code is unique
    }
    attempts++;
  }

  throw new Error('Failed to generate unique code after 50 attempts');
};
