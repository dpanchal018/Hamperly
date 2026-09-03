import { parsePhoneNumberWithError, CountryCode, ParseError, isValidPhoneNumber as isValidCore } from 'libphonenumber-js';

/**
 * Centralized phone number validation and normalization utility.
 * 
 * @param phone - The raw phone number input (preferably E.164 if coming from frontend UI)
 * @param defaultCountry - Fallback country code if not provided in E.164 format (defaults to 'IN')
 * @returns Object containing isValid flag, normalized E.164 string, and an error message if invalid.
 */
export function validatePhoneNumber(phone: string, defaultCountry: CountryCode = 'IN'): { isValid: boolean; normalized: string | null; error?: string } {
  if (!phone || phone.trim() === '') {
    return { isValid: false, normalized: null, error: 'Phone number is required.' };
  }

  try {
    const phoneNumber = parsePhoneNumberWithError(phone, defaultCountry);
    
    if (phoneNumber.isValid()) {
      return { 
        isValid: true, 
        normalized: phoneNumber.format('E.164'), // standardizes to +919876543210
        error: undefined
      };
    } else {
      return { 
        isValid: false, 
        normalized: null, 
        error: 'Please enter a valid mobile number for the selected country.' 
      };
    }
  } catch (error) {
    if (error instanceof ParseError) {
      // Provide meaningful, user-friendly error messages
      let errorMessage = 'Invalid phone number format.';
      switch (error.message) {
        case 'INVALID_COUNTRY':
          errorMessage = 'Invalid country code selected.';
          break;
        case 'NOT_A_NUMBER':
          errorMessage = 'Phone number must contain digits.';
          break;
        case 'TOO_SHORT':
        case 'TOO_SHORT_NSN':
          errorMessage = 'Phone number is too short.';
          break;
        case 'TOO_LONG':
          errorMessage = 'Phone number is too long.';
          break;
      }
      return { isValid: false, normalized: null, error: errorMessage };
    }
    return { isValid: false, normalized: null, error: 'Invalid phone number.' };
  }
}

/**
 * Convenience wrapper for simple boolean checks.
 */
export function isValidPhone(phone: string, defaultCountry: CountryCode = 'IN'): boolean {
  if (!phone) return false;
  return isValidCore(phone, defaultCountry);
}

/**
 * Normalizes a given phone number to E.164 format. 
 * Returns null if invalid.
 */
export function normalizePhoneNumber(phone: string, defaultCountry: CountryCode = 'IN'): string | null {
  const result = validatePhoneNumber(phone, defaultCountry);
  return result.normalized;
}
