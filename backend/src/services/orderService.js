import { readDatabase, writeDatabase, clone } from '../utils/fileStore.js';
import { logInfo } from '../utils/logger.js';

function calculateTotals(items, products) {
  let subtotal = 0;
  const enrichedItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId && p.active !== false);
    if (!product) {
      throw new Error('Sản phẩm không tồn tại hoặc đã ngừng kinh doanh');
    }
    const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const lineTotal = product.price * quantity;
    subtotal += lineTotal;
    return {
      productId: product.id,
      quantity,
      price: product.price,
      lineTotal,
      name: product.name
    };
  });
  return { subtotal, items: enrichedItems };
}

export async function listProducts() {
  const db = await readDatabase();
  return db.products.filter((product) => product.active !== false);
}

export async function createOrder({ userId, items, coupon, customerEmail, customerName }) {
  const db = await readDatabase();
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Giỏ hàng trống');
  }
  const { subtotal, items: detailedItems } = calculateTotals(items, db.products);
  let discount = 0;
  let appliedCoupon = null;
  if (coupon) {
    const normalizedCode = coupon.trim().toUpperCase();
    const found = db.coupons.find((item) => item.code === normalizedCode);
    if (found) {
      const now = Date.now();
      const isExpired = found.expiresAt && new Date(found.expiresAt).getTime() < now;
      if (!isExpired && (found.maxUsage === 0 || found.usedCount < found.maxUsage)) {
        if (found.type === 'percent') {
          discount = Math.min(subtotal, Math.round((subtotal * found.value) / 100));
        } else {
          discount = Math.min(subtotal, found.value);
        }
        appliedCoupon = found;
      }
    }
  }
  const finalTotal = Math.max(subtotal - discount, 0);
  const order = {
    id: `order_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    userId,
    customerEmail: customerEmail || null,
    customerName: customerName || null,
    items: detailedItems,
    subtotal,
    discount,
    finalTotal,
    status: 'pending',
    couponCode: appliedCoupon?.code || null,
    payOsOrderId: null,
    paymentLink: null,
    verificationRequired: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.orders.push(order);
  await writeDatabase(db);
  const safeOrder = clone(order);
  return safeOrder;
}

export async function attachPaymentInfo(orderId, { payOsOrderId, paymentLink }) {
  const db = await readDatabase();
  const order = db.orders.find((item) => item.id === orderId);
  if (!order) {
    throw new Error('Không tìm thấy đơn hàng');
  }
  order.payOsOrderId = payOsOrderId;
  order.paymentLink = paymentLink;
  order.updatedAt = new Date().toISOString();
  await writeDatabase(db);
  return clone(order);
}

export async function markOrderPaid(payOsOrderId) {
  const db = await readDatabase();
  const order = db.orders.find((item) => item.payOsOrderId === payOsOrderId);
  if (!order) {
    throw new Error('Không tìm thấy đơn hàng tương ứng');
  }
  order.status = 'paid';
  order.updatedAt = new Date().toISOString();
  await writeDatabase(db);
  logInfo('Đơn hàng đã được thanh toán', { payOsOrderId, orderId: order.id });
  return clone(order);
}

export async function markOrderCancelled(payOsOrderId) {
  const db = await readDatabase();
  const order = db.orders.find((item) => item.payOsOrderId === payOsOrderId);
  if (!order) {
    throw new Error('Không tìm thấy đơn hàng tương ứng');
  }
  order.status = 'cancelled';
  order.updatedAt = new Date().toISOString();
  await writeDatabase(db);
  return clone(order);
}

export async function listOrdersByUser(userId) {
  const db = await readDatabase();
  return db.orders
    .filter((order) => order.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function listAllOrders() {
  const db = await readDatabase();
  return db.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function incrementCouponUsage(code) {
  const db = await readDatabase();
  const coupon = db.coupons.find((item) => item.code === code);
  if (!coupon) return null;
  coupon.usedCount = (coupon.usedCount || 0) + 1;
  await writeDatabase(db);
  return coupon;
}

export async function setVerificationRequired(orderId, required) {
  const db = await readDatabase();
  const order = db.orders.find((item) => item.id === orderId);
  if (!order) {
    throw new Error('Không tìm thấy đơn hàng');
  }
  order.verificationRequired = required;
  order.updatedAt = new Date().toISOString();
  await writeDatabase(db);
  return clone(order);
}
