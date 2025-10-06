# Vipdayne.net

Giải pháp bán sản phẩm số chuẩn production với đầy đủ giao diện khách hàng và quản trị, tích hợp PayOS và Brevo.

## Cấu trúc dự án

```
backend/        # API Node.js thuần, lưu trữ dữ liệu JSON, tích hợp PayOS và Brevo
frontend/       # Giao diện tĩnh HTML/CSS/JS (khách hàng + admin)
```

## Chuẩn bị môi trường

1. Sao chép `.env.example` trong thư mục `backend` thành `.env` và điền đầy đủ thông tin:

```
cp backend/.env.example backend/.env
```

Các biến quan trọng:

- `PORT`: cổng chạy API (mặc định 3000)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: tài khoản quản trị mặc định
- Thông tin PayOS (`PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `RETURN_URL`, `CANCEL_URL`)
- API Brevo (`BREVO_API_KEY`, `BREVO_VERIFICATION_TEMPLATE_ID`, ...)

## Khởi chạy API backend

```
cd backend
node src/server.js
```

Server sẽ tự tạo tài khoản quản trị nếu chưa tồn tại và phục vụ tại `http://localhost:3000`.

## Triển khai frontend

Giao diện là các file tĩnh trong thư mục `frontend`. Có thể phục vụ bằng Nginx hoặc máy chủ tĩnh đơn giản:

```
cd frontend
python3 -m http.server 8080
```

Sau đó truy cập `http://localhost:8080/frontend/index.html`.

## Các chức năng chính

### Khách hàng

- Đăng ký/đăng nhập, lưu token vào LocalStorage.
- Duyệt sản phẩm, thêm giỏ hàng, tạo đơn và thanh toán qua PayOS.
- Xem lịch sử đơn hàng, nhận email xác thực Brevo khi đơn chuyển trạng thái đã thanh toán.

### Quản trị

- Dashboard thống kê người dùng, đơn hàng, doanh thu.
- Tìm kiếm và quản lý người dùng.
- Tạo/xoá mã giảm giá linh hoạt (theo % hoặc số tiền, giới hạn lượt và hạn sử dụng).
- Tạo bài viết kèm link tải.
- Theo dõi đơn hàng và trạng thái xác thực.

### Bảo mật & tối ưu

- CORS giới hạn domain cấu hình, tự động bổ sung origin từ `BASE_URL`.
- Rate limit cơ bản chống spam.
- JWT ký HMAC-SHA256, mật khẩu băm scrypt.
- Headers bảo mật (CSP, HSTS, COOP/CORP, X-Frame-Options, ...).
- Custom linter kiểm tra ký tự tab và xuống dòng Windows.
- Tự khôi phục file cơ sở dữ liệu JSON nếu hỏng định dạng.

## Đóng gói

Sau khi cấu hình xong có thể đóng gói triển khai bằng cách nén thư mục dự án:

```
zip -r vipdayne.net.zip backend frontend README.md
```

Đảm bảo bỏ qua các file nhạy cảm như `.env` khi chia sẻ.

## Kiểm thử

- Chạy linter: `npm run lint` trong thư mục `backend`.
- Kiểm tra đăng ký/đăng nhập và phản hồi 404 API: `npm run test` trong thư mục `backend`.
