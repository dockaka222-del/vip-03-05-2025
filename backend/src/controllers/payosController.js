import { parseJsonBody } from '../utils/parser.js';
import { sendJson, badRequest, forbidden } from '../utils/response.js';
import { verifyWebhookSignature } from '../services/payosService.js';
import { markOrderPaid, markOrderCancelled, setVerificationRequired } from '../services/orderService.js';
import { createEmailVerificationToken } from '../services/userService.js';
import { sendVerificationEmail } from '../services/emailService.js';
import { config } from '../config.js';
import { logInfo } from '../utils/logger.js';

export async function webhookController(req, res) {
  try {
    const body = await parseJsonBody(req);
    const signature = req.headers['x-payos-signature'] || req.headers['x-signature'];
    if (!verifyWebhookSignature(body, signature)) {
      return forbidden(res, 'Chữ ký không hợp lệ');
    }
    const event = body.event || body.type;
    if (event === 'payment.success') {
      const order = await markOrderPaid(body.data?.orderCode || body.orderCode);
      if (order) {
        const { token } = await createEmailVerificationToken(order.userId);
        await setVerificationRequired(order.id, true);
        const email = order.customerEmail || config.adminEmail;
        await sendVerificationEmail({ to: email, token });
        logInfo('Đã gửi email xác thực sau thanh toán', { orderId: order.id, email });
      }
    } else if (event === 'payment.cancelled') {
      await markOrderCancelled(body.data?.orderCode || body.orderCode);
    }
    sendJson(res, 200, { received: true });
  } catch (error) {
    badRequest(res, error.message);
  }
}
