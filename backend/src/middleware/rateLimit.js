const buckets = new Map();

export function createRateLimiter({ windowMs = 60000, max = 60 } = {}) {
  return function rateLimiter(req, res) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const bucket = buckets.get(ip) || { count: 0, expiresAt: now + windowMs };
    if (now > bucket.expiresAt) {
      bucket.count = 0;
      bucket.expiresAt = now + windowMs;
    }
    bucket.count += 1;
    buckets.set(ip, bucket);
    if (bucket.count > max) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ message: 'Vượt quá giới hạn yêu cầu, vui lòng thử lại sau.' }));
      return false;
    }
    return true;
  };
}
