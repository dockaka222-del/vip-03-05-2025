import { readDatabase, writeDatabase, clone } from '../utils/fileStore.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateRandomToken } from '../utils/token.js';
import { validateEmail } from '../utils/validator.js';
import { logSecurity } from '../utils/logger.js';

export async function findUserByEmail(email) {
  const db = await readDatabase();
  return db.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function ensureAdminAccount(adminEmail, adminPassword) {
  if (!adminEmail || !adminPassword) {
    return;
  }
  const db = await readDatabase();
  const admin = db.users.find((user) => user.email === adminEmail);
  if (!admin) {
    db.users.push({
      id: `user_${Date.now()}`,
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
      name: 'Quản trị viên',
      role: 'admin',
      verified: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: null
    });
    await writeDatabase(db);
    logSecurity('Đã tạo tài khoản quản trị mặc định', { adminEmail });
  } else if (!admin.passwordHash) {
    admin.passwordHash = hashPassword(adminPassword);
    admin.verified = true;
    await writeDatabase(db);
    logSecurity('Đã cập nhật mật khẩu quản trị mặc định', { adminEmail });
  }
}

export async function createUser({ email, password, name }) {
  if (!validateEmail(email)) {
    throw new Error('Email không hợp lệ');
  }
  const db = await readDatabase();
  const exists = db.users.some((user) => user.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    throw new Error('Email đã tồn tại, vui lòng đăng nhập');
  }
  const newUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    email,
    passwordHash: hashPassword(password),
    name: name?.trim() || email.split('@')[0],
    role: 'customer',
    verified: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: null
  };
  db.users.push(newUser);
  await writeDatabase(db);
  const safeUser = clone(newUser);
  delete safeUser.passwordHash;
  return safeUser;
}

export async function authenticateUser({ email, password }) {
  const db = await readDatabase();
  const user = db.users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error('Thông tin đăng nhập không đúng');
  }
  user.lastLoginAt = new Date().toISOString();
  await writeDatabase(db);
  const safeUser = clone(user);
  delete safeUser.passwordHash;
  return safeUser;
}

export async function listUsers({ search = '', page = 1, pageSize = 20 }) {
  const db = await readDatabase();
  const keyword = search.trim().toLowerCase();
  const filtered = keyword
    ? db.users.filter((user) =>
        user.email.toLowerCase().includes(keyword) || user.name.toLowerCase().includes(keyword)
      )
    : db.users;
  const total = filtered.length;
  const offset = (page - 1) * pageSize;
  const paginated = filtered.slice(offset, offset + pageSize).map((user) => {
    const safeUser = clone(user);
    delete safeUser.passwordHash;
    return safeUser;
  });
  return { total, page, pageSize, items: paginated };
}

export async function updateUser(id, payload) {
  const db = await readDatabase();
  const user = db.users.find((item) => item.id === id);
  if (!user) {
    throw new Error('Không tìm thấy người dùng');
  }
  if (payload.name) {
    user.name = payload.name.trim();
  }
  if (typeof payload.verified === 'boolean') {
    user.verified = payload.verified;
  }
  if (payload.role && ['customer', 'admin'].includes(payload.role)) {
    user.role = payload.role;
  }
  await writeDatabase(db);
  const safeUser = clone(user);
  delete safeUser.passwordHash;
  return safeUser;
}

export async function createEmailVerificationToken(userId) {
  const db = await readDatabase();
  const token = generateRandomToken(16);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
  db.emailTokens = db.emailTokens.filter((item) => item.userId !== userId);
  db.emailTokens.push({ userId, token, expiresAt });
  await writeDatabase(db);
  return { token, expiresAt };
}

export async function verifyEmailToken(token) {
  const db = await readDatabase();
  const record = db.emailTokens.find((item) => item.token === token);
  if (!record) {
    throw new Error('Mã xác thực không hợp lệ');
  }
  if (new Date(record.expiresAt).getTime() < Date.now()) {
    throw new Error('Mã xác thực đã hết hạn');
  }
  const user = db.users.find((item) => item.id === record.userId);
  if (!user) {
    throw new Error('Không tìm thấy người dùng');
  }
  user.verified = true;
  db.emailTokens = db.emailTokens.filter((item) => item.token !== token);
  await writeDatabase(db);
  const safeUser = clone(user);
  delete safeUser.passwordHash;
  return safeUser;
}
