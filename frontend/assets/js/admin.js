import {
  apiAdminStats,
  apiAdminUsers,
  apiAdminOrders,
  apiAdminCreateCoupon,
  apiAdminListCoupons,
  apiAdminDeleteCoupon,
  apiAdminCreatePost
} from './api.js';
import { requireAuthOrRedirect } from './auth.js';
import { renderAlert, formatCurrency } from './ui.js';

const auth = requireAuthOrRedirect();

if (auth && auth.user.role !== 'admin') {
  window.location.href = '/frontend/';
}

const statsContainer = document.querySelector('#stats');
const usersContainer = document.querySelector('#users');
const ordersContainer = document.querySelector('#orders');
const couponForm = document.querySelector('#coupon-form');
const couponList = document.querySelector('#coupon-list');
const postForm = document.querySelector('#post-form');
const feedback = document.querySelector('#feedback');

async function loadStats() {
  if (!statsContainer) return;
  const { stats } = await apiAdminStats(auth.accessToken);
  statsContainer.innerHTML = `
    <div class="grid grid-3">
      <div class="card"><h3>Người dùng</h3><strong>${stats.totalUsers}</strong></div>
      <div class="card"><h3>Đơn hàng</h3><strong>${stats.totalOrders}</strong></div>
      <div class="card"><h3>Doanh thu</h3><strong>${formatCurrency(stats.totalRevenue)}</strong></div>
    </div>`;
}

async function loadUsers(query = {}) {
  if (!usersContainer) return;
  const { items } = await apiAdminUsers(query, auth.accessToken);
  usersContainer.innerHTML = `
    <table class="table">
      <thead><tr><th>Email</th><th>Họ tên</th><th>Vai trò</th><th>Xác thực</th></tr></thead>
      <tbody>
        ${items
          .map(
            (user) => `
              <tr>
                <td>${user.email}</td>
                <td>${user.name}</td>
                <td>${user.role}</td>
                <td>${user.verified ? 'Đã xác thực' : 'Chưa xác thực'}</td>
              </tr>`
          )
          .join('')}
      </tbody>
    </table>`;
}

async function loadOrders() {
  if (!ordersContainer) return;
  const { orders } = await apiAdminOrders(auth.accessToken);
  ordersContainer.innerHTML = `
    <table class="table">
      <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Trạng thái</th><th>Tổng tiền</th></tr></thead>
      <tbody>
        ${orders
          .map(
            (order) => `
              <tr>
                <td>${order.id}</td>
                <td>${order.customerEmail || 'Ẩn'}</td>
                <td>${order.status}</td>
                <td>${formatCurrency(order.finalTotal)}</td>
              </tr>`
          )
          .join('')}
      </tbody>
    </table>`;
}

async function loadCoupons() {
  if (!couponList) return;
  const { coupons } = await apiAdminListCoupons(auth.accessToken);
  couponList.innerHTML = `
    <table class="table">
      <thead><tr><th>Mã</th><th>Loại</th><th>Giá trị</th><th>Số lần còn lại</th><th>Hạn</th><th></th></tr></thead>
      <tbody>
        ${coupons
          .map(
            (coupon) => `
              <tr>
                <td>${coupon.code}</td>
                <td>${coupon.type}</td>
                <td>${coupon.type === 'percent' ? coupon.value + '%' : formatCurrency(coupon.value)}</td>
                <td>${coupon.maxUsage === 0 ? 'Không giới hạn' : coupon.maxUsage - coupon.usedCount}</td>
                <td>${coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('vi-VN') : '---'}</td>
                <td><button data-delete="${coupon.code}">Xoá</button></td>
              </tr>`
          )
          .join('')}
      </tbody>
    </table>`;
}

if (couponForm) {
  couponForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(couponForm);
    const payload = Object.fromEntries(formData.entries());
    payload.value = Number(payload.value);
    payload.maxUsage = Number(payload.maxUsage);
    try {
      await apiAdminCreateCoupon(payload, auth.accessToken);
      renderAlert(feedback, 'Đã tạo mã giảm giá.', 'success');
      couponForm.reset();
      loadCoupons();
    } catch (error) {
      renderAlert(feedback, error.message, 'error');
    }
  });
}

if (couponList) {
  couponList.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-delete]');
    if (!button) return;
    await apiAdminDeleteCoupon(button.getAttribute('data-delete'), auth.accessToken);
    loadCoupons();
  });
}

if (postForm) {
  postForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(postForm);
    const payload = Object.fromEntries(formData.entries());
    payload.downloadLinks = payload.downloadLinks
      ? payload.downloadLinks.split('\n').map((line) => {
          const [label, url] = line.split('|');
          return { label: label?.trim(), url: url?.trim() };
        })
      : [];
    try {
      await apiAdminCreatePost(payload, auth.accessToken);
      renderAlert(feedback, 'Đã tạo bài viết mới.', 'success');
      postForm.reset();
    } catch (error) {
      renderAlert(feedback, error.message, 'error');
    }
  });
}

Promise.all([loadStats(), loadUsers(), loadOrders(), loadCoupons()]).catch((error) => {
  renderAlert(feedback, error.message, 'error');
});
