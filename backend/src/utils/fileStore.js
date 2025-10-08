import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_RELATIVE_PATH = '../../data/db.json';
const INITIAL_STRUCTURE = Object.freeze({
  users: [],
  products: [],
  coupons: [],
  posts: [],
  orders: [],
  emailTokens: [],
  auditLogs: []
});

function resolveDbPath(customPath) {
  if (customPath) {
    return customPath;
  }
  if (process.env.VIPDAYNE_DB_PATH) {
    return process.env.VIPDAYNE_DB_PATH;
  }
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.join(currentDir, DEFAULT_RELATIVE_PATH);
}

async function ensureFileExists(targetPath) {
  const dbPath = resolveDbPath(targetPath);
  try {
    await access(dbPath, constants.F_OK);
  } catch {
    await mkdir(path.dirname(dbPath), { recursive: true });
    await writeFile(dbPath, JSON.stringify(INITIAL_STRUCTURE, null, 2));
  }
  return dbPath;
}

export async function readDatabase(targetPath) {
  const dbPath = await ensureFileExists(targetPath);
  const raw = await readFile(dbPath, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON structure');
    }
    return parsed;
  } catch {
    await writeFile(dbPath, JSON.stringify(INITIAL_STRUCTURE, null, 2));
    return JSON.parse(JSON.stringify(INITIAL_STRUCTURE));
  }
}

export async function writeDatabase(data, targetPath) {
  const dbPath = resolveDbPath(targetPath);
  await mkdir(path.dirname(dbPath), { recursive: true });
  await writeFile(dbPath, JSON.stringify(data, null, 2));
  return data;
}

export function clone(value) {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}
