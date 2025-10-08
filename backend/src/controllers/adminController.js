import { parseJsonBody, parseUrl } from '../utils/parser.js';
import { sendJson, badRequest, notFound } from '../utils/response.js';
import { listUsers, updateUser } from '../services/userService.js';
import { listAllOrders } from '../services/orderService.js';
import { createCoupon, listCoupons, deleteCoupon } from '../services/couponService.js';
import { createPost, updatePost } from '../services/postService.js';
import { getDashboardStats } from '../services/statsService.js';

export async function listUsersController(req, res) {
  const { searchParams } = parseUrl(req);
  const search = searchParams.get('search') || '';
  const page = Number(searchParams.get('page') || 1);
  const pageSize = Number(searchParams.get('pageSize') || 20);
  const data = await listUsers({ search, page, pageSize });
  sendJson(res, 200, data);
}

export async function updateUserController(req, res) {
  try {
    const { pathname } = parseUrl(req);
    const userId = pathname.split('/').pop();
    const body = await parseJsonBody(req);
    const user = await updateUser(userId, body);
    sendJson(res, 200, { user });
  } catch (error) {
    badRequest(res, error.message);
  }
}

export async function listOrdersControllerAdmin(req, res) {
  const orders = await listAllOrders();
  sendJson(res, 200, { orders });
}

export async function createCouponController(req, res) {
  try {
    const body = await parseJsonBody(req);
    const coupon = await createCoupon(body);
    sendJson(res, 201, { coupon });
  } catch (error) {
    badRequest(res, error.message);
  }
}

export async function listCouponsController(req, res) {
  const coupons = await listCoupons();
  sendJson(res, 200, { coupons });
}

export async function deleteCouponController(req, res) {
  try {
    const { pathname } = parseUrl(req);
    const code = pathname.split('/').pop();
    await deleteCoupon(code);
    sendJson(res, 200, { message: 'Đã xoá mã giảm giá' });
  } catch (error) {
    badRequest(res, error.message);
  }
}

export async function createPostController(req, res) {
  try {
    const body = await parseJsonBody(req);
    const post = await createPost(body, req.user?.id);
    sendJson(res, 201, { post });
  } catch (error) {
    badRequest(res, error.message);
  }
}

export async function updatePostController(req, res) {
  try {
    const { pathname } = parseUrl(req);
    const slug = pathname.split('/').pop();
    const body = await parseJsonBody(req);
    const post = await updatePost(slug, body);
    sendJson(res, 200, { post });
  } catch (error) {
    badRequest(res, error.message);
  }
}

export async function statsController(req, res) {
  const stats = await getDashboardStats();
  sendJson(res, 200, { stats });
}
