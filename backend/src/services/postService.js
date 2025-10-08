import { readDatabase, writeDatabase } from '../utils/fileStore.js';
import { sanitizeString } from '../utils/validator.js';

function generateSlug(title) {
  return sanitizeString(title)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `post-${Date.now()}`;
}

export async function createPost(payload, authorId) {
  const db = await readDatabase();
  const title = sanitizeString(payload.title || '');
  if (!title) {
    throw new Error('Tiêu đề không được bỏ trống');
  }
  const slug = payload.slug ? generateSlug(payload.slug) : generateSlug(title);
  const exists = db.posts.find((post) => post.slug === slug);
  if (exists) {
    throw new Error('Đường dẫn bài viết đã tồn tại');
  }
  const content = payload.content?.trim();
  if (!content) {
    throw new Error('Nội dung bài viết không được bỏ trống');
  }
  const post = {
    id: `post_${Date.now()}`,
    title,
    slug,
    excerpt: payload.excerpt?.trim() || content.slice(0, 160),
    content,
    downloadLinks: Array.isArray(payload.downloadLinks) ? payload.downloadLinks : [],
    authorId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.posts.push(post);
  await writeDatabase(db);
  return post;
}

export async function listPosts() {
  const db = await readDatabase();
  return db.posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getPostBySlug(slug) {
  const db = await readDatabase();
  return db.posts.find((post) => post.slug === slug) || null;
}

export async function updatePost(slug, payload) {
  const db = await readDatabase();
  const post = db.posts.find((item) => item.slug === slug);
  if (!post) {
    throw new Error('Không tìm thấy bài viết');
  }
  if (payload.title) {
    post.title = sanitizeString(payload.title);
  }
  if (payload.content) {
    post.content = payload.content.trim();
  }
  if (payload.excerpt) {
    post.excerpt = payload.excerpt.trim();
  }
  if (Array.isArray(payload.downloadLinks)) {
    post.downloadLinks = payload.downloadLinks;
  }
  post.updatedAt = new Date().toISOString();
  await writeDatabase(db);
  return post;
}
