import { apiRegister } from './api.js';
import { highlightActiveLink, renderAlert } from './ui.js';
import { saveAuth } from './auth.js';

highlightActiveLink();

const form = document.querySelector('#register-form');
const feedback = document.querySelector('#feedback');

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    try {
      const data = await apiRegister(payload);
      saveAuth(data);
      renderAlert(
        feedback,
        'Tạo tài khoản thành công. Bạn có thể mua hàng và xác thực email sau khi thanh toán.',
        'success'
      );
      setTimeout(() => {
        window.location.href = '/frontend/';
      }, 1200);
    } catch (error) {
      renderAlert(feedback, error.message, 'error');
    }
  });
}
