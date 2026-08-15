/**
 * Strict Input Validation Schemas and Helpers
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates Email Address format and length constraints.
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Email address is required.' };
  }
  if (trimmed.length > 255) {
    return { isValid: false, error: 'Email address cannot exceed 255 characters.' };
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. user@example.com).' };
  }
  return { isValid: true };
}

/**
 * Validates Password strength and length.
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required.' };
  }
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long.' };
  }
  if (password.length > 128) {
    return { isValid: false, error: 'Password cannot exceed 128 characters.' };
  }
  return { isValid: true };
}

/**
 * Validates Name fields (Worker name, custom role, user names).
 */
export function validateName(name: string, fieldName = 'Name', maxLength = 100): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: `${fieldName} is required.` };
  }
  if (trimmed.length > maxLength) {
    return { isValid: false, error: `${fieldName} cannot exceed ${maxLength} characters.` };
  }
  // Disallow control characters or HTML tags
  if (/[<>]/.test(trimmed)) {
    return { isValid: false, error: `${fieldName} contains invalid characters.` };
  }
  return { isValid: true };
}

/**
 * Validates ISO Date format (YYYY-MM-DD).
 */
export function validateIsoDate(dateStr: string, fieldName = 'Date'): ValidationResult {
  if (!dateStr) {
    return { isValid: false, error: `${fieldName} is required.` };
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return { isValid: false, error: `${fieldName} must be in YYYY-MM-DD format.` };
  }
  const timestamp = Date.parse(dateStr);
  if (isNaN(timestamp)) {
    return { isValid: false, error: `${fieldName} is not a valid date.` };
  }
  return { isValid: true };
}

/**
 * Validates Date Range (startDate <= endDate).
 */
export function validateDateRange(startDateStr: string, endDateStr: string): ValidationResult {
  const startVal = validateIsoDate(startDateStr, 'Start Date');
  if (!startVal.isValid) return startVal;

  const endVal = validateIsoDate(endDateStr, 'End Date');
  if (!endVal.isValid) return endVal;

  if (endDateStr < startDateStr) {
    return { isValid: false, error: 'End date cannot be before start date.' };
  }
  return { isValid: true };
}

/**
 * Validates numeric input values with strict min and max bounds.
 */
export function validateNumericInput(
  value: string | number,
  options: {
    fieldName: string;
    min?: number;
    max?: number;
    allowZero?: boolean;
    integerOnly?: boolean;
  }
): ValidationResult {
  const { fieldName, min = 0, max = 1000000, allowZero = true, integerOnly = false } = options;

  if (value === '' || value === null || value === undefined) {
    return { isValid: false, error: `${fieldName} is required.` };
  }

  const num = Number(value);

  if (isNaN(num) || !isFinite(num)) {
    return { isValid: false, error: `Please enter a valid numeric value for ${fieldName}.` };
  }

  if (!allowZero && num === 0) {
    return { isValid: false, error: `${fieldName} must be greater than 0.` };
  }

  if (num < min) {
    return { isValid: false, error: `${fieldName} cannot be less than ${min}.` };
  }

  if (num > max) {
    return { isValid: false, error: `${fieldName} cannot exceed ${max.toLocaleString('en-IN')}.` };
  }

  if (integerOnly && !Number.isInteger(num)) {
    return { isValid: false, error: `${fieldName} must be a whole number.` };
  }

  return { isValid: true };
}

/**
 * Validates text notes / notes comments.
 */
export function validateNoteText(note: string, maxLength = 255): ValidationResult {
  if (!note) return { isValid: true }; // optional
  const trimmed = note.trim();
  if (trimmed.length > maxLength) {
    return { isValid: false, error: `Note cannot exceed ${maxLength} characters.` };
  }
  if (/[<>]/.test(trimmed)) {
    return { isValid: false, error: 'Note contains invalid characters.' };
  }
  return { isValid: true };
}
