import { listProducts } from '../services/orderService.js';
import { listPosts, getPostBySlug } from '../services/postService.js';
import { sendJson, notFound } from '../utils/response.js';
import { parseUrl } from '../utils/parser.js';

export async function listProductsController(req, res) {
  const products = await listProducts();
  sendJson(res, 200, { products });
}

export async function listPostsController(req, res) {
  const posts = await listPosts();
  sendJson(res, 200, { posts });
}

export async function postDetailController(req, res) {
  const { pathname } = parseUrl(req);
  const slug = pathname.split('/').pop();
  const post = await getPostBySlug(slug);
  if (!post) {
    return notFound(res);
  }
  sendJson(res, 200, { post });
}
