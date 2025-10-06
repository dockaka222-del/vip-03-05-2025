import { config } from '../config.js';
import { logError, logInfo } from '../utils/logger.js';

export async function sendVerificationEmail({ to, token }) {
  if (!config.brevo.apiKey) {
    logInfo('Brevo API key không được cấu hình, bỏ qua gửi email xác thực', { to });
    return { skipped: true };
  }
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.brevo.apiKey
      },
      body: JSON.stringify({
        to: [{ email: to }],
        sender: {
          name: config.brevo.fromName || 'Vipdayne.net',
          email: config.brevo.fromEmail || 'no-reply@vipdayne.net'
        },
        replyTo: {
          email: config.brevo.replyTo || config.brevo.fromEmail || 'support@vipdayne.net'
        },
        templateId: Number(config.brevo.verificationTemplateId) || undefined,
        subject: 'Xác thực email đơn hàng Vipdayne.net',
        htmlContent: `<!doctype html><html lang="vi"><body><p>Xin chào,</p><p>Bạn vừa thực hiện đơn hàng tại Vipdayne.net. Vui lòng xác thực email để nhận link tải sản phẩm số.</p><p>Nhấn vào liên kết sau: <a href="${config.baseUrl}/verify-email.html?token=${token}">Xác thực email</a></p><p>Liên kết có hiệu lực trong 24 giờ.</p><p>Trân trọng,<br/>Đội ngũ Vipdayne.net</p></body></html>`
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || 'Không thể gửi email xác thực');
    }
    logInfo('Đã gửi email xác thực', { to });
    return result;
  } catch (error) {
    logError('Gửi email xác thực thất bại', { error: error.message });
    throw error;
  }
}
