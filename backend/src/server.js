import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { config } from './config.js';
import { resolveRoute } from './routes/index.js';
import { createCorsMiddleware } from './middleware/cors.js';
import { createRateLimiter } from './middleware/rateLimit.js';
import { createAuthMiddleware } from './middleware/auth.js';
import { sendJson } from './utils/response.js';
import { logError, logInfo } from './utils/logger.js';
import { ensureAdminAccount } from './services/userService.js';

const cors = createCorsMiddleware(config.allowedOrigins.length ? config.allowedOrigins : ['*']);
const rateLimiter = createRateLimiter();
const authenticate = createAuthMiddleware(config);

function setSecurityHeaders(res) {
  const cspDirectives = [
    "default-src 'self'",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self' https: http:"
  ];
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  if (config.baseUrl.startsWith('https://')) {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
}

export const server = http.createServer(async (req, res) => {
  setSecurityHeaders(res);
  if (!cors(req, res)) {
    return;
  }
  if (!rateLimiter(req, res)) {
    return;
  }
  if (['POST', 'PUT', 'PATCH'].includes(req.method || '') && (req.headers['content-type'] || '').includes('multipart')) {
    sendJson(res, 415, { message: 'Loại nội dung không được hỗ trợ' });
    return;
  }
  try {
    await authenticate(req, res);
    await resolveRoute(req, res);
  } catch (error) {
    logError('Unhandled server error', { error: error.message });
    sendJson(res, 500, { message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
});

server.on('clientError', (err, socket) => {
  logError('Client connection error', { error: err.message });
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

export async function startServer(port = config.port) {
  await ensureAdminAccount(config.adminEmail, config.adminPassword);
  return new Promise((resolve) => {
    server.listen(port, () => {
      logInfo(`API server đang chạy tại cổng ${server.address().port}`);
      resolve(server);
    });
  });
}

export async function stopServer() {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

const isCliExecution = (() => {
  if (!process.argv[1]) {
    return false;
  }
  try {
    return pathToFileURL(process.argv[1]).href === import.meta.url;
  } catch {
    return false;
  }
})();

if (isCliExecution) {
  startServer();
}
