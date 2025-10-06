import { readFileSync, existsSync } from 'node:fs';
import { logInfo } from './utils/logger.js';

const ENV_PATH = new URL('../.env', import.meta.url);
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000'];

function loadEnv() {
  if (!existsSync(ENV_PATH)) {
    return;
  }
  const raw = readFileSync(ENV_PATH, 'utf8');
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      return;
    }
    const key = trimmed.slice(0, eqIndex).trim();
    if (!key || key in process.env) {
      return;
    }
    const value = trimmed
      .slice(eqIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
    process.env[key] = value;
  });
}

loadEnv();

const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toArray = (value) =>
  value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean) || [];

const toOrigin = (value) => {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
};

const allowedOrigins = (() => {
  const explicit = toArray(process.env.ALLOWED_ORIGINS);
  const origins = explicit.length ? explicit : DEFAULT_ALLOWED_ORIGINS;
  const baseOrigin = toOrigin(process.env.BASE_URL);
  if (baseOrigin) {
    origins.push(baseOrigin);
  }
  return Array.from(new Set(origins));
})();

const deepFreeze = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.getOwnPropertyNames(value).forEach((prop) => deepFreeze(value[prop]));
    Object.freeze(value);
  }
  return value;
};

const nodeEnv = process.env.NODE_ENV || 'development';

const configShape = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: toNumber(process.env.PORT, 3000),
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  allowedOrigins,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  accessTokenTtl: toNumber(process.env.ACCESS_TOKEN_TTL, 900),
  refreshTokenTtl: toNumber(process.env.REFRESH_TOKEN_TTL, 604800),
  payos: {
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY,
    baseUrl: process.env.PAYOS_API_BASE || 'https://api.payos.vn',
    returnUrl: process.env.RETURN_URL,
    cancelUrl: process.env.CANCEL_URL
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY,
    fromName: process.env.MAIL_FROM_NAME,
    fromEmail: process.env.MAIL_FROM_EMAIL,
    replyTo: process.env.MAIL_REPLY_TO,
    verificationTemplateId: process.env.BREVO_VERIFICATION_TEMPLATE_ID
  },
  webhookSecret: process.env.WEBHOOK_SECRET || 'webhook-secret'
};

const config = deepFreeze(configShape);

if (config.isProduction) {
  const missingKeys = [
    ['ADMIN_EMAIL', config.adminEmail],
    ['ADMIN_PASSWORD', config.adminPassword],
    ['JWT_SECRET', config.jwtSecret && config.jwtSecret !== 'change-me' ? config.jwtSecret : null],
    ['PAYOS_CLIENT_ID', config.payos.clientId],
    ['PAYOS_API_KEY', config.payos.apiKey],
    ['PAYOS_CHECKSUM_KEY', config.payos.checksumKey],
    ['BREVO_API_KEY', config.brevo.apiKey]
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length) {
    throw new Error(`Thiếu biến môi trường bắt buộc cho production: ${missingKeys.join(', ')}`);
  }
}

if (!config.isProduction) {
  logInfo('Config loaded', { env: config.nodeEnv });
}

export { config };
