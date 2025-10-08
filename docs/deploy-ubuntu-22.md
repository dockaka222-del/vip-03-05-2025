# Triển khai Vipdayne.net trên VPS Ubuntu 22.04 (1 vCPU / 1GB RAM)

Tài liệu này mô tả từng bước để bạn đưa dự án vào môi trường production tối giản, chỉ cần chỉnh sửa `.env` trực tiếp trên VPS.

## 1. Chuẩn bị máy chủ

```bash
# Cập nhật hệ thống và cài các tiện ích cơ bản
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip ufw
```

Bật tường lửa và chỉ mở SSH, HTTP, HTTPS:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 2. Cài Node.js LTS và PNPM (tùy chọn)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm # hoặc giữ npm nếu bạn muốn
```

Kiểm tra phiên bản:

```bash
node -v
npm -v
```

## 3. Lấy mã nguồn và cấu hình biến môi trường

```bash
cd /opt
sudo git clone https://github.com/<ten-tai-khoan>/vipdayne.net.git vipdayne
sudo chown -R $USER:$USER vipdayne
cd vipdayne/backend
cp .env.example .env
nano .env
```

Điền đầy đủ thông tin PayOS, Brevo, JWT và tài khoản admin. Khi chạy production, dịch vụ sẽ kiểm tra những biến này và dừng nếu thiếu.

## 4. Cài đặt phụ thuộc và build (nếu cần)

```bash
cd /opt/vipdayne/backend
npm install --production
```

Frontend là tệp tĩnh nên không cần build. Bạn có thể đồng bộ về `/var/www/vipdayne` hoặc phục vụ trực tiếp từ repo.

## 5. Thiết lập dịch vụ systemd cho backend

Tạo file `/etc/systemd/system/vipdayne.service` với nội dung:

```ini
[Unit]
Description=Vipdayne.net API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/vipdayne/backend
Environment=NODE_ENV=production
EnvironmentFile=/opt/vipdayne/backend/.env
ExecStart=/usr/bin/node /opt/vipdayne/backend/src/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Sau đó kích hoạt:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now vipdayne.service
sudo systemctl status vipdayne.service
```

Nhật ký dịch vụ được lưu tại `journalctl -u vipdayne.service`.

## 6. Cấu hình Nginx phục vụ frontend và reverse proxy backend

```bash
sudo apt install -y nginx
sudo tee /etc/nginx/sites-available/vipdayne.conf > /dev/null <<'NGINX'
server {
    listen 80;
    server_name vipdayne.net www.vipdayne.net;

    # Forward API
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve static frontend
    root /opt/vipdayne/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    error_page 404 /404.html;
}
NGINX

sudo ln -s /etc/nginx/sites-available/vipdayne.conf /etc/nginx/sites-enabled/vipdayne.conf
sudo nginx -t
sudo systemctl reload nginx
```

Frontend sẽ phục vụ tại `https://vipdayne.net` và mọi yêu cầu `/api/` sẽ chuyển tiếp về backend Node.js.

## 7. Kích hoạt HTTPS (tùy chọn nhưng khuyến nghị)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d vipdayne.net -d www.vipdayne.net
```

HSTS sẽ tự động bật do ứng dụng nhận diện domain HTTPS.

## 8. Kiểm tra và giám sát

- Truy cập `https://vipdayne.net` để xác thực giao diện.
- Kiểm tra API: `curl -I https://vipdayne.net/api/health`.
- Theo dõi log: `journalctl -u vipdayne.service -f`.
- Sao lưu file dữ liệu JSON trong `/opt/vipdayne/backend/data/` định kỳ.

## 9. Cập nhật phiên bản mới

```bash
cd /opt/vipdayne
git pull
cd backend
npm install --production
sudo systemctl restart vipdayne.service
```

Luôn test lại thanh toán PayOS và email Brevo sau mỗi lần cập nhật.

---

Với hướng dẫn này, VPS cấu hình 1 vCPU/1GB RAM đủ để chạy demo production và bạn chỉ cần cập nhật `.env` tương ứng khi chuyển server.
