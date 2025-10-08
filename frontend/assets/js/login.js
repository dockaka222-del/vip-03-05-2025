import { apiLogin } from './api.js';
import { highlightActiveLink, renderAlert } from './ui.js';
import { saveAuth } from './auth.js';

highlightActiveLink();

const form = document.querySelector('#login-form');
const feedback = document.querySelector('#feedback');

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    try {
      const data = await apiLogin(payload);
      saveAuth(data);
      renderAlert(feedback, 'Đăng nhập thành công, đang chuyển hướng...', 'success');
      setTimeout(() => {
        window.location.href = '/frontend/lich-su.html';
      }, 900);
    } catch (error) {
      renderAlert(feedback, error.message, 'error');
    }
  });
}
