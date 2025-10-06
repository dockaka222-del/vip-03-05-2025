import crypto from 'node:crypto';

function base64UrlEncode(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(input) {
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  while (input.length % 4) {
    input += '=';
  }
  return Buffer.from(input, 'base64').toString();
}

export function signJwt(payload, secret, expiresInSeconds = 900) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInSeconds;
  const body = { ...payload, iat: now, exp };
  const unsigned = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(body))}`;
  const signature = crypto.createHmac('sha256', secret).update(unsigned).digest('base64');
  return `${unsigned}.${base64UrlEncode(signature)}`;
}

export function verifyJwt(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, signature] = parts;
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = base64UrlEncode(
    crypto.createHmac('sha256', secret).update(unsigned).digest('base64')
  );
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }
  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}

export function generateRandomToken(size = 48) {
  return crypto.randomBytes(size).toString('hex');
}
