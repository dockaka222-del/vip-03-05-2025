export function logInfo(message, meta = {}) {
  console.log(`[INFO] ${new Date().toISOString()} ${message}`, Object.keys(meta).length ? meta : '');
}

export function logError(message, meta = {}) {
  console.error(`[ERROR] ${new Date().toISOString()} ${message}`, meta);
}

export function logSecurity(message, meta = {}) {
  console.warn(`[SECURITY] ${new Date().toISOString()} ${message}`, meta);
}
