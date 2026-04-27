const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AUTH_VALIDATION = {
  EMAIL_MAX_LENGTH: 128,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 32,
} as const;

export function validateAuthEmail(email: string): string | null {
  const normalized = email.trim();
  if (!normalized) {
    return "Adres e-mail jest wymagany.";
  }
  if (normalized.length > AUTH_VALIDATION.EMAIL_MAX_LENGTH) {
    return `Adres e-mail może mieć maksymalnie ${AUTH_VALIDATION.EMAIL_MAX_LENGTH} znaków.`;
  }
  if (!SIMPLE_EMAIL_REGEX.test(normalized)) {
    return "Podaj poprawny adres e-mail.";
  }
  return null;
}

export function validateAuthPassword(password: string): string | null {
  if (!password) {
    return "Hasło jest wymagane.";
  }
  if (password.length < AUTH_VALIDATION.PASSWORD_MIN_LENGTH) {
    return `Hasło musi mieć co najmniej ${AUTH_VALIDATION.PASSWORD_MIN_LENGTH} znaków.`;
  }
  if (password.length > AUTH_VALIDATION.PASSWORD_MAX_LENGTH) {
    return `Hasło może mieć maksymalnie ${AUTH_VALIDATION.PASSWORD_MAX_LENGTH} znaków.`;
  }
  return null;
}

export function validateSignUpCredentials(email: string, password: string): string | null {
  return validateAuthEmail(email) ?? validateAuthPassword(password);
}
