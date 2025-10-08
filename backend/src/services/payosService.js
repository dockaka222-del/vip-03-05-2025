import crypto from 'node:crypto';
import { config } from '../config.js';
import { logError, logInfo } from '../utils/logger.js';

function signData(data) {
  const json = JSON.stringify(data);
  return crypto.createHmac('sha256', config.payos.checksumKey || '').update(json).digest('hex');
}

export async function createPaymentRequest(order) {
  if (!config.payos.clientId || !config.payos.apiKey || !config.payos.checksumKey) {
    throw new Error('PayOS chưa được cấu hình đầy đủ');
  }
  const payload = {
    orderCode: order.id,
    amount: order.finalTotal,
    description: `Thanh toan don hang ${order.id}`,
    cancelUrl: config.payos.cancelUrl || `${config.baseUrl}/cancel.html`,
    returnUrl: config.payos.returnUrl || `${config.baseUrl}/thanks.html`,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price
    }))
  };
  const signature = signData(payload);
  try {
    const response = await fetch(`${config.payos.baseUrl || 'https://api.payos.vn'}/v2/payment-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': config.payos.clientId,
        'x-api-key': config.payos.apiKey
      },
      body: JSON.stringify({ ...payload, signature })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Không thể tạo lệnh thanh toán PayOS');
    }
    logInfo('Đã tạo lệnh thanh toán PayOS', { orderId: order.id });
    return data;
  } catch (error) {
    logError('Tạo lệnh thanh toán PayOS thất bại', { error: error.message });
    throw error;
  }
}

export function verifyWebhookSignature(payload, providedSignature) {
  const expected = signData(payload);
  if (!providedSignature) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(providedSignature));
}
