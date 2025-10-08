import { getCart, removeFromCart, clearCart } from './cart.js';
import { highlightActiveLink, formatCurrency, renderAlert } from './ui.js';
import { getAuth } from './auth.js';
import { apiCreateOrder } from './api.js';

highlightActiveLink();

const cartTable = document.querySelector('#cart-table');
const cartSummary = document.querySelector('#cart-summary');
const checkoutButton = document.querySelector('#checkout-button');
const feedback = document.querySelector('#feedback');

function renderCart() {
  const items = getCart();
  if (!cartTable) return;
  if (items.length === 0) {
    cartTable.innerHTML = '<p>Giỏ hàng của bạn đang trống. Hãy chọn sản phẩm để tiếp tục.</p>';
    cartSummary.textContent = '';
    return;
  }
  let total = 0;
  cartTable.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Sản phẩm</th>
          <th>Số lượng</th>
          <th>Đơn giá</th>
          <th>Thành tiền</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map((item) => {
            const lineTotal = item.price * item.quantity;
            total += lineTotal;
            return `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(lineTotal)}</td>
                <td><button data-remove="${item.productId}">Xoá</button></td>
              </tr>`;
          })
          .join('')}
      </tbody>
    </table>`;
  cartSummary.textContent = `Tổng cộng: ${formatCurrency(total)}`;
}

if (cartTable) {
  cartTable.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-remove]');
    if (!button) return;
    removeFromCart(button.getAttribute('data-remove'));
    renderCart();
  });
}

if (checkoutButton) {
  checkoutButton.addEventListener('click', async () => {
    const auth = getAuth();
    if (!auth) {
      renderAlert(feedback, 'Vui lòng đăng nhập trước khi thanh toán.', 'error');
      return;
    }
    const items = getCart();
    if (items.length === 0) {
      renderAlert(feedback, 'Giỏ hàng trống.', 'error');
      return;
    }
    try {
      const order = await apiCreateOrder({ items }, auth.accessToken);
      renderAlert(
        feedback,
        'Đã tạo đơn hàng. Vui lòng thanh toán qua PayOS để hoàn tất. Chúng tôi sẽ gửi email xác thực nếu cần.',
        'success'
      );
      clearCart();
      if (order.paymentLink) {
        window.open(order.paymentLink, '_blank');
      }
    } catch (error) {
      renderAlert(feedback, error.message, 'error');
    }
  });
}

renderCart();
