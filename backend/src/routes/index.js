import { notFound, methodNotAllowed } from '../utils/response.js';
import {
  registerController,
  loginController,
  verifyEmailController,
  requestVerificationController
} from '../controllers/authController.js';
import { listProductsController, listPostsController, postDetailController } from '../controllers/productController.js';
import { createOrderController, listOrdersController } from '../controllers/orderController.js';
import {
  listUsersController,
  updateUserController,
  listOrdersControllerAdmin,
  createCouponController,
  listCouponsController,
  deleteCouponController,
  createPostController,
  updatePostController,
  statsController
} from '../controllers/adminController.js';
import { webhookController } from '../controllers/payosController.js';
import { parseUrl } from '../utils/parser.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const routes = [
  { method: 'POST', path: /^\/api\/auth\/register$/, handler: registerController },
  { method: 'POST', path: /^\/api\/auth\/login$/, handler: loginController },
  { method: 'POST', path: /^\/api\/auth\/verify-email$/, handler: verifyEmailController },
  { method: 'POST', path: /^\/api\/auth\/request-verification$/, handler: requestVerificationController, auth: true },
  { method: 'GET', path: /^\/api\/products$/, handler: listProductsController },
  { method: 'GET', path: /^\/api\/posts$/, handler: listPostsController },
  { method: 'GET', path: /^\/api\/posts\/[a-z0-9-]+$/, handler: postDetailController },
  { method: 'POST', path: /^\/api\/orders$/, handler: createOrderController, auth: true },
  { method: 'GET', path: /^\/api\/orders$/, handler: listOrdersController, auth: true },
  { method: 'POST', path: /^\/api\/admin\/coupons$/, handler: createCouponController, admin: true },
  { method: 'GET', path: /^\/api\/admin\/coupons$/, handler: listCouponsController, admin: true },
  { method: 'DELETE', path: /^\/api\/admin\/coupons\/[A-Z0-9-]+$/, handler: deleteCouponController, admin: true },
  { method: 'GET', path: /^\/api\/admin\/users$/, handler: listUsersController, admin: true },
  { method: 'PATCH', path: /^\/api\/admin\/users\/[a-zA-Z0-9_\-]+$/, handler: updateUserController, admin: true },
  { method: 'GET', path: /^\/api\/admin\/orders$/, handler: listOrdersControllerAdmin, admin: true },
  { method: 'POST', path: /^\/api\/admin\/posts$/, handler: createPostController, admin: true },
  { method: 'PATCH', path: /^\/api\/admin\/posts\/[a-z0-9-]+$/, handler: updatePostController, admin: true },
  { method: 'GET', path: /^\/api\/admin\/stats$/, handler: statsController, admin: true },
  { method: 'POST', path: /^\/api\/payos\/webhook$/, handler: webhookController }
];

export function resolveRoute(req, res) {
  const { pathname } = parseUrl(req);
  const route = routes.find((item) => item.method === req.method && item.path.test(pathname));
  if (!route) {
    return notFound(res);
  }
  if (route.method !== req.method) {
    return methodNotAllowed(res);
  }
  if (route.auth && !requireAuth(req, res)) {
    return;
  }
  if (route.admin && !requireAdmin(req, res)) {
    return;
  }
  return route.handler(req, res);
}
