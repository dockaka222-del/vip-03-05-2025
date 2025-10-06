export function sendJson(res, statusCode, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...headers
  });
  res.end(body);
}

export function notFound(res) {
  sendJson(res, 404, { message: 'Không tìm thấy tài nguyên' });
}

export function methodNotAllowed(res) {
  sendJson(res, 405, { message: 'Phương thức không được hỗ trợ' });
}

export function badRequest(res, message = 'Yêu cầu không hợp lệ') {
  sendJson(res, 400, { message });
}

export function unauthorized(res, message = 'Cần đăng nhập') {
  sendJson(res, 401, { message });
}

export function forbidden(res, message = 'Không có quyền truy cập') {
  sendJson(res, 403, { message });
}
