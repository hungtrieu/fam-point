# Fam Point

Đây là một dự án Next.js.

## Bắt đầu

### Yêu cầu tiên quyết

Đảm bảo bạn đã cài đặt các phần mềm sau:
- [Node.js](https://nodejs.org/) (phiên bản 18 hoặc cao hơn)
- [npm](https://www.npmjs.com/)
- [Docker & Docker Compose](https://www.docker.com/products/docker-desktop/) (cho cơ sở dữ liệu local)

### Cài đặt

1. Cài đặt các gói phụ thuộc (dependencies):
   ```bash
   npm install
   ```

### Thiết lập Cơ sở dữ liệu cục bộ (MongoDB)

Dự án này sử dụng MongoDB. Cách dễ nhất để chạy nó cục bộ là sử dụng Docker.

1.  **Khởi động MongoDB**:
    ```bash
    docker-compose up -d
    ```
    Lệnh này sẽ khởi động một instance MongoDB trên cổng `27017` với thông tin đăng nhập mặc định (`root`/`password`).

2.  **Cấu hình Môi trường**:
    Tạo tệp `.env.local` trong thư mục gốc nếu chưa có, và thêm chuỗi kết nối:
    ```env
    MONGODB_URI=mongodb://root:password@localhost:27017/fam-point?authSource=admin
    ```

### Chạy ứng dụng cục bộ (Local)

Để khởi động máy chủ phát triển (dev server):

```bash
npm run dev
```

Ứng dụng sẽ có sẵn tại [http://localhost:9002](http://localhost:9002).

> **Lưu ý:** Máy chủ phát triển được cấu hình để chạy trên cổng **9002**.

## Xây dựng cho Môi trường Production

Để build ứng dụng cho môi trường production:

```bash
npm run build
```

Để khởi động máy chủ production sau khi build:

```bash
npm run start
```

## Triển khai trên Ubuntu (Docker)

Phần này hướng dẫn bạn triển khai ứng dụng trên máy chủ Ubuntu bằng Docker, đặc biệt khi bạn đã có một instance MongoDB đang chạy trong container.

### 1. Chuẩn bị
Đảm bảo máy chủ Ubuntu của bạn đã cài đặt Docker và Docker Compose.

### 2. Cấu hình Mạng (Network)
Nếu MongoDB của bạn đang chạy trong một Docker container, tốt nhất là nên để ứng dụng và MongoDB trong cùng một mạng Docker.

Kiểm tra mạng của container MongoDB:
```bash
docker inspect <mongodb-container-name> -f '{{json .NetworkSettings.Networks}}'
```

### 3. Biến môi trường
Tạo một tệp tên là `.env.prod` trên máy chủ của bạn:
```env
MONGODB_URI=mongodb://root:password@mongodb:27017/fam-point?authSource=admin
```
*(Lưu ý: Thay thế `mongodb` bằng tên container thực tế của instance Mongo của bạn nếu chúng ở trên cùng một mạng)*

### 4. Dockerize ứng dụng
Dự án bao gồm một `Dockerfile` cho production.

### 5. Triển khai với Docker Compose
Chúng ta sử dụng `docker-compose.prod.yml` để triển khai:

1. **Chỉnh sửa `docker-compose.prod.yml`**:
   Đảm bảo phần `networks` khớp với mạng Docker hiện có của bạn (ví dụ: `common-network`).

2. **Chạy Triển khai**:
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
   ```

### 6. Reverse Proxy (Nginx)
Vì bạn đang chạy nhiều ứng dụng trên cùng một máy chủ, hãy sử dụng Nginx để định tuyến lưu lượng đến container của bạn trên cổng `9002`.

Ví dụ cấu hình Nginx:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:9002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Tự động Duyệt Công việc (Cron Job)

Ứng dụng hỗ trợ tự động duyệt các công việc đã hoàn thành vào một thời điểm cụ thể (ví dụ: hàng ngày lúc 12:00 trưa). Tính năng này hữu ích để tự động xác nhận công việc thay cho phụ huynh.

### 1. Cấu hình Bảo mật
Thêm `CRON_SECRET` vào tệp biến môi trường của bạn (`.env` hoặc `.env.local`) để bảo mật endpoint:

```env
CRON_SECRET=chuoi_ngau_nhien_bao_mat_cua_ban
```

### 2. Thiết lập Cron Job (Linux/Ubuntu)
Bạn có thể sử dụng `crontab` của hệ thống để kích hoạt quy trình duyệt.

1.  Mở trình chỉnh sửa crontab:
    ```bash
    crontab -e
    ```

2.  Thêm dòng sau để chạy công việc hàng ngày lúc 12:00 trưa (noon):
    ```bash
    0 12 * * * curl "http://localhost:9002/api/cron/approve-tasks?key=chuoi_ngau_nhien_bao_mat_cua_ban"
    ```
    ```bash
    0 12 * * * curl "http://localhost:9002/api/cron/approve-tasks?key=chuoi_ngau_nhien_bao_mat_cua_ban"
    ```
    *Thay thế `http://localhost:9002` bằng URL cục bộ hoặc công khai thực tế của bạn, và `chuoi_ngau_nhien_bao_mat_cua_ban` bằng giá trị từ bước 1.*

    > **Lưu ý:**
    > - Việc cài đặt Cron Job trên server chỉ cần thực hiện **một lần duy nhất**. Nó hoạt động độc lập với mã nguồn ứng dụng.
    > - Cron Job sẽ chạy mỗi ngày (gọi API), nhưng API sẽ **chỉ thực hiện duyệt** cho các gia đình có bật tính năng "Tự động duyệt" trong phần Cài đặt.


### 3. Kiểm tra (Testing)
Bạn có thể kích hoạt thủ công công việc bằng cách truy cập URL trong trình duyệt hoặc sử dụng curl:
```bash
curl "http://localhost:9002/api/cron/approve-tasks?key=chuoi_ngau_nhien_bao_mat_cua_ban"
```
