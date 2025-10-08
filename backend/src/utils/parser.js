import { StringDecoder } from 'node:string_decoder';
import { URL } from 'node:url';

export async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    let aborted = false;
    req.on('data', (data) => {
      if (aborted) {
        return;
      }
      buffer += decoder.write(data);
      if (buffer.length > 1e6) {
        aborted = true;
        decoder.end();
        req.destroy();
        reject(new Error('Payload quá lớn'));
      }
    });
    req.on('end', () => {
      if (aborted) {
        return;
      }
      buffer += decoder.end();
      if (!buffer) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(buffer);
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

export function parseUrl(req) {
  const fullUrl = new URL(req.url, `http://${req.headers.host}`);
  return {
    pathname: fullUrl.pathname,
    searchParams: fullUrl.searchParams
  };
}
