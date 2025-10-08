import { sendJson } from '../utils/response.js';

export function createCorsMiddleware(allowedOrigins = []) {
  const allowAll = allowedOrigins.includes('*');
  return function cors(req, res) {
    const origin = req.headers.origin;
    if (allowAll || (origin && allowedOrigins.includes(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return false;
    }
    return true;
  };
}
