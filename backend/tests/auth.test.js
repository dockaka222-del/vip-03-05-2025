import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

const initialData = {
  users: [],
  products: [],
  coupons: [],
  posts: [],
  orders: [],
  emailTokens: [],
  auditLogs: []
};

let tempDir;
let dbFile;
let baseUrl;
let serverInstance;
let fileStore;
let userService;
let serverModule;

before(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), 'vipdayne-tests-'));
  dbFile = path.join(tempDir, 'db.json');
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';
  process.env.VIPDAYNE_DB_PATH = dbFile;
  await writeFile(dbFile, JSON.stringify(initialData, null, 2));

  fileStore = await import('../src/utils/fileStore.js');
  userService = await import('../src/services/userService.js');
  serverModule = await import('../src/server.js');

  await fileStore.writeDatabase(structuredClone(initialData));
  serverInstance = await serverModule.startServer(0);
  const address = serverInstance.address();
  const port = typeof address === 'object' && address ? address.port : process.env.PORT;
  baseUrl = `http://127.0.0.1:${port}`;
});

beforeEach(async () => {
  await fileStore.writeDatabase(structuredClone(initialData));
});

after(async () => {
  if (serverModule) {
    await serverModule.stopServer();
  }
  delete process.env.VIPDAYNE_DB_PATH;
  delete process.env.PORT;
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('đăng ký và đăng nhập thành công', async () => {
  const payload = { email: 'tester@example.com', password: 'Matkhau123', name: 'Tester' };
  const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  assert.equal(registerResponse.status, 201);
  const registerData = await registerResponse.json();
  assert.ok(registerData.user);
  assert.equal(registerData.user.email, payload.email);
  assert.ok(registerData.accessToken);

  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: payload.email, password: payload.password })
  });
  assert.equal(loginResponse.status, 200);
  const loginData = await loginResponse.json();
  assert.equal(loginData.user.email, payload.email);
  assert.ok(loginData.accessToken);
});

test('đăng nhập sai mật khẩu trả về lỗi', async () => {
  await userService.createUser({ email: 'wrongpass@example.com', password: 'Matkhau123', name: 'Wrong Pass' });
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'wrongpass@example.com', password: 'SaiMatKhau' })
  });
  assert.equal(response.status, 400);
  const data = await response.json();
  assert.match(data.message, /không đúng/i);
});

test('truy cập đường dẫn không tồn tại trả về 404', async () => {
  const response = await fetch(`${baseUrl}/api/khong-ton-tai`);
  assert.equal(response.status, 404);
  const data = await response.json();
  assert.match(data.message, /không tìm thấy/i);
});
