import { apiVerifyEmail } from './api.js';
import { renderAlert } from './ui.js';

const feedback = document.querySelector('#feedback');

async function verify() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (!token) {
    renderAlert(feedback, 'Mã xác thực không hợp lệ.', 'error');
    return;
  }
  try {
    await apiVerifyEmail(token);
    renderAlert(feedback, 'Email đã được xác thực thành công. Bạn có thể tải sản phẩm sau khi thanh toán.', 'success');
  } catch (error) {
    renderAlert(feedback, error.message, 'error');
  }
}

verify();
