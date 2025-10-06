import { apiGetProducts, apiGetPosts } from './api.js';
import { addToCart } from './cart.js';
import { highlightActiveLink, formatCurrency } from './ui.js';

highlightActiveLink();

const productGrid = document.querySelector('#product-grid');
const postGrid = document.querySelector('#post-grid');
const toast = document.querySelector('#toast');

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2400);
}

async function loadProducts() {
  if (!productGrid) return;
  const { products } = await apiGetProducts();
  productGrid.innerHTML = products
    .map(
      (product) => `
        <div class="card">
          <span class="badge">${product.tags?.join(', ') || 'Sản phẩm số'}</span>
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <strong>${formatCurrency(product.price)}</strong>
          <button class="btn btn-primary" data-product='${JSON.stringify({
            productId: product.id,
            quantity: 1,
            name: product.name,
            price: product.price
          })}'>Thêm vào giỏ</button>
        </div>`
    )
    .join('');
}

async function loadPosts() {
  if (!postGrid) return;
  const { posts } = await apiGetPosts();
  postGrid.innerHTML = posts
    .slice(0, 3)
    .map(
      (post) => `
        <article class="card">
          <h3>${post.title}</h3>
          <p>${post.excerpt}</p>
          <a class="btn btn-secondary" href="/frontend/bai-viet.html?slug=${post.slug}">Đọc ngay</a>
        </article>`
    )
    .join('');
}

if (productGrid) {
  productGrid.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-product]');
    if (!button) return;
    const data = JSON.parse(button.getAttribute('data-product'));
    addToCart(data);
    showToast('Đã thêm vào giỏ hàng');
  });
}

loadProducts().catch((error) => console.error(error));
loadPosts().catch((error) => console.error(error));
