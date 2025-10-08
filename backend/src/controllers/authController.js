import { parseJsonBody } from '../utils/parser.js';
import { sendJson, badRequest } from '../utils/response.js';
import {
  createUser,
  authenticateUser,
  createEmailVerificationToken,
  verifyEmailToken
} from '../services/userService.js';
import { validateEmail, validatePassword } from '../utils/validator.js';
import { signJwt } from '../utils/token.js';
import { config } from '../config.js';
import { sendVerificationEmail } from '../services/emailService.js';

export async function registerController(req, res) {
  try {
    const body = await parseJsonBody(req);
    if (!validateEmail(body.email) || !validatePassword(body.password)) {
      return badRequest(res, 'Email hoặc mật khẩu không hợp lệ');
    }
    const user = await createUser(body);
    const accessToken = signJwt({ sub: user.id, role: user.role }, config.jwtSecret, config.accessTokenTtl);
    sendJson(res, 201, { user, accessToken });
  } catch (error) {
    badRequest(res, error.message);
  }
}

export async function loginController(req, res) {
  try {
    const body = await parseJsonBody(req);
    if (!validateEmail(body.email) || !validatePassword(body.password)) {
      return badRequest(res, 'Email hoặc mật khẩu không hợp lệ');
    }
    const user = await authenticateUser(body);
    const accessToken = signJwt({ sub: user.id, role: user.role }, config.jwtSecret, config.accessTokenTtl);
    sendJson(res, 200, { user, accessToken });
  } catch (error) {
    badRequest(res, error.message);
  }
}

export async function verifyEmailController(req, res) {
  try {
    const body = await parseJsonBody(req);
    if (!body.token) {
      return badRequest(res, 'Thiếu mã xác thực');
    }
    const user = await verifyEmailToken(body.token);
    sendJson(res, 200, { user });
  } catch (error) {
    badRequest(res, error.message);
  }
}

export async function requestVerificationController(req, res) {
  try {
    if (!req.user) {
      return badRequest(res, 'Bạn cần đăng nhập để yêu cầu xác thực lại');
    }
    const { token } = await createEmailVerificationToken(req.user.id);
    await sendVerificationEmail({ to: req.user.email, token });
    sendJson(res, 200, { message: 'Đã gửi email xác thực' });
  } catch (error) {
    badRequest(res, error.message);
  }
}
