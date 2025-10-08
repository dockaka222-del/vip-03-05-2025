import { parseJsonBody } from '../utils/parser.js';
import { sendJson, badRequest, unauthorized } from '../utils/response.js';
import {
  createOrder,
  attachPaymentInfo,
  listOrdersByUser,
  incrementCouponUsage,
  setVerificationRequired
} from '../services/orderService.js';
import { createPaymentRequest } from '../services/payosService.js';

export async function createOrderController(req, res) {
  if (!req.user) {
    return unauthorized(res);
  }
  try {
    const body = await parseJsonBody(req);
    const order = await createOrder({
      userId: req.user.id,
      customerEmail: req.user.email,
      customerName: req.user.name,
      items: body.items || [],
      coupon: body.coupon
    });
    const payment = await createPaymentRequest(order);
    await attachPaymentInfo(order.id, {
      payOsOrderId: payment.data?.orderCode || payment.code || order.id,
      paymentLink: payment.data?.checkoutUrl || payment.checkoutUrl
    });
    if (order.couponCode) {
      await incrementCouponUsage(order.couponCode);
    }
    sendJson(res, 201, {
      orderId: order.id,
      paymentLink: payment.data?.checkoutUrl || payment.checkoutUrl,
      payOsOrderId: payment.data?.orderCode || payment.code || order.id
    });
  } catch (error) {
    badRequest(res, error.message);
  }
}

export async function listOrdersController(req, res) {
  if (!req.user) {
    return unauthorized(res);
  }
  try {
    const orders = await listOrdersByUser(req.user.id);
    sendJson(res, 200, { orders });
  } catch (error) {
    badRequest(res, error.message);
  }
}

