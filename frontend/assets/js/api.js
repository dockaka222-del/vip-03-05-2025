const API_BASE = window.__VIPDAYNE_API__ || 'http://localhost:3000';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include'
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Có lỗi xảy ra');
  }
  return data;
}

export async function apiRegister(payload) {
  return request('/api/auth/register', { method: 'POST', body: payload });
}

export async function apiLogin(payload) {
  return request('/api/auth/login', { method: 'POST', body: payload });
}

export async function apiVerifyEmail(token) {
  return request('/api/auth/verify-email', { method: 'POST', body: { token } });
}

export async function apiGetProducts() {
  return request('/api/products');
}

export async function apiGetPosts() {
  return request('/api/posts');
}

export async function apiGetPost(slug) {
  return request(`/api/posts/${slug}`);
}

export async function apiCreateOrder(payload, token) {
  return request('/api/orders', { method: 'POST', body: payload, token });
}

export async function apiGetOrders(token) {
  return request('/api/orders', { token });
}

export async function apiAdminStats(token) {
  return request('/api/admin/stats', { token });
}

export async function apiAdminUsers(query, token) {
  const params = new URLSearchParams(query);
  return request(`/api/admin/users?${params.toString()}`, { token });
}

export async function apiAdminOrders(token) {
  return request('/api/admin/orders', { token });
}

export async function apiAdminCreateCoupon(payload, token) {
  return request('/api/admin/coupons', { method: 'POST', body: payload, token });
}

export async function apiAdminListCoupons(token) {
  return request('/api/admin/coupons', { token });
}

export async function apiAdminDeleteCoupon(code, token) {
  return request(`/api/admin/coupons/${code}`, { method: 'DELETE', token });
}

export async function apiAdminCreatePost(payload, token) {
  return request('/api/admin/posts', { method: 'POST', body: payload, token });
}
