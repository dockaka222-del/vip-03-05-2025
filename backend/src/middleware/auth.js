import { verifyJwt } from '../utils/token.js';
import { sendJson } from '../utils/response.js';
import { readDatabase } from '../utils/fileStore.js';

export function createAuthMiddleware(config) {
  return async function authenticate(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.substring('Bearer '.length);
    const payload = verifyJwt(token, config.jwtSecret);
    if (!payload) {
      return null;
    }
    const db = await readDatabase();
    const user = db.users.find((item) => item.id === payload.sub);
    if (!user) {
      return null;
    }
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      verified: user.verified
    };
    return req.user;
  };
}

export function requireAuth(req, res) {
  if (!req.user) {
    sendJson(res, 401, { message: 'Vui lòng đăng nhập để tiếp tục' });
    return false;
  }
  return true;
}

export function requireAdmin(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    sendJson(res, 403, { message: 'Chỉ quản trị viên mới được truy cập' });
    return false;
  }
  return true;
}
