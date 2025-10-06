import { highlightActiveLink, formatCurrency } from './ui.js';
import { requireAuthOrRedirect } from './auth.js';
import { apiGetOrders } from './api.js';

highlightActiveLink();

const table = document.querySelector('#orders-table');
const auth = requireAuthOrRedirect();

async function loadOrders() {
  if (!auth || !table) return;
  const { orders } = await apiGetOrders(auth.accessToken);
  if (!orders.length) {
    table.innerHTML = '<p>Bạn chưa có đơn hàng nào.</p>';
    return;
  }
  table.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Mã đơn</th>
          <th>Trạng thái</th>
          <th>Thanh toán</th>
          <th>Tổng tiền</th>
          <th>Ngày tạo</th>
        </tr>
      </thead>
      <tbody>
        ${orders
          .map(
            (order) => `
              <tr>
                <td>${order.id}</td>
                <td>${order.status}</td>
                <td>${order.paymentLink ? `<a href="${order.paymentLink}" target="_blank">Thanh toán</a>` : '---'}</td>
                <td>${formatCurrency(order.finalTotal)}</td>
                <td>${new Date(order.createdAt).toLocaleString('vi-VN')}</td>
              </tr>`
          )
          .join('')}
      </tbody>
    </table>`;
}

loadOrders().catch((error) => {
  table.innerHTML = `<p>${error.message}</p>`;
});
