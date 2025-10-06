import { readDatabase, writeDatabase } from '../utils/fileStore.js';
import { sanitizeString, parseNumber } from '../utils/validator.js';

export async function createCoupon(payload) {
  const db = await readDatabase();
  const code = sanitizeString(payload.code || '').toUpperCase();
  if (!code) {
    throw new Error('Mã giảm giá không được để trống');
  }
  const exists = db.coupons.find((coupon) => coupon.code === code);
  if (exists) {
    throw new Error('Mã giảm giá đã tồn tại');
  }
  const type = payload.type === 'amount' ? 'amount' : 'percent';
  const value = parseNumber(payload.value, 0);
  if (type === 'percent' && (value <= 0 || value > 100)) {
    throw new Error('Phần trăm giảm phải từ 1 đến 100');
  }
  if (type === 'amount' && value <= 0) {
    throw new Error('Giá trị giảm phải lớn hơn 0');
  }
  const maxUsage = payload.maxUsage === 0 ? 0 : parseNumber(payload.maxUsage, 0);
  const coupon = {
    id: `coupon_${Date.now()}`,
    code,
    type,
    value,
    maxUsage,
    usedCount: 0,
    expiresAt: payload.expiresAt || null,
    note: sanitizeString(payload.note || ''),
    createdAt: new Date().toISOString()
  };
  db.coupons.push(coupon);
  await writeDatabase(db);
  return coupon;
}

export async function listCoupons() {
  const db = await readDatabase();
  return db.coupons;
}

export async function deleteCoupon(code) {
  const db = await readDatabase();
  const before = db.coupons.length;
  db.coupons = db.coupons.filter((coupon) => coupon.code !== code.toUpperCase());
  if (db.coupons.length === before) {
    throw new Error('Không tìm thấy mã giảm giá');
  }
  await writeDatabase(db);
  return true;
}
