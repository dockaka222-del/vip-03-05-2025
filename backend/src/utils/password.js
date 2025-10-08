import crypto from 'node:crypto';

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const COST = 16384; // scrypt cost parameter

export function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const derived = crypto.scryptSync(password, salt, KEY_LENGTH, { N: COST });
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const derived = crypto.scryptSync(password, salt, KEY_LENGTH, { N: COST });
  const stored = Buffer.from(hashHex, 'hex');
  return crypto.timingSafeEqual(derived, stored);
}
