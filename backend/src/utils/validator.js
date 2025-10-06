const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  return emailRegex.test(String(email).toLowerCase());
}

export function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

export function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
  return missing;
}

export function parseNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function sanitizeString(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>]/g, '').trim();
}

export function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}
