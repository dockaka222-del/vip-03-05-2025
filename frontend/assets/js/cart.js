const CART_KEY = 'vipdayne_cart';

export function getCart() {
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

export function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((item) => item.productId === product.productId);
  if (existing) {
    existing.quantity += product.quantity;
  } else {
    cart.push(product);
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  return cart;
}

export function removeFromCart(productId) {
  const cart = getCart().filter((item) => item.productId !== productId);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  return cart;
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}
