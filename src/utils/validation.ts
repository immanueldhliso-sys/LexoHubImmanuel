// Reusable validation utilities for forms across the application
// Follow LexoHub constitution: strong typing, no 'any', pure functions

export type EmailValidation = { isValid: boolean; message?: string; warning?: string };
export type PasswordValidation = { isValid: boolean; message?: string; strength?: number };
export type NameValidation = { isValid: boolean; message?: string };

// Validate email format and optionally warn on personal domains
export const validateEmail = (email: string): EmailValidation => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return { isValid: false, message: 'Email is required' };
  if (!emailRegex.test(email)) return { isValid: false, message: 'Please enter a valid email address' };

  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
  const domain = email.split('@')[1];
  if (personalDomains.includes(domain)) {
    return { isValid: true, warning: 'For best results, consider using your professional email.' };
  }
  return { isValid: true };
};

// Validate password strength with simple heuristic
export const validatePassword = (password: string): PasswordValidation => {
  if (!password) return { isValid: false, message: 'Password is required', strength: 0 };
  if (password.length < 12) return { isValid: false, message: 'Password must be at least 12 characters', strength: 1 };

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const errors: string[] = [];
  if (!hasUpper) errors.push('uppercase letter');
  if (!hasLower) errors.push('lowercase letter');
  if (!hasDigit) errors.push('number');
  if (!hasSpecial) errors.push('special character');

  let strength = 0;
  if (password.length >= 12) strength++;
  if (hasUpper) strength++;
  if (hasLower) strength++;
  if (hasDigit) strength++;
  if (hasSpecial) strength++;

  if (errors.length > 0) {
    return {
      isValid: false,
      message: `Password must contain: ${errors.join(', ')}`,
      strength
    };
  }

  return { isValid: true, strength };
};

// Validate a user's full name
export const validateName = (name: string): NameValidation => {
  if (!name) return { isValid: false, message: 'Full name is required' };
  if (name.trim().length < 2) return { isValid: false, message: 'Please enter your full name' };
  return { isValid: true };
};