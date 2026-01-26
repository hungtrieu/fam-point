# Hướng dẫn tích hợp Cloudinary và Upload ảnh

Tôi đã thiết lập cơ chế upload linh hoạt:
- **Ở môi trường Local (Development)**: Ảnh sẽ được lưu trực tiếp vào thư mục `public/uploads` của project để bạn test nhanh mà không cần key.
- **Ở môi trường Production**: Ứng dụng sẽ tự động chuyển sang dùng Cloudinary.

---

## 1. Tạo tài khoản Cloudinary
- Truy cập [cloudinary.com](https://cloudinary.com/) và tạo một tài khoản miễn phí.

## 2. Lấy Cloud Name
- Sau khi đăng nhập, tại trang **Dashboard**, bạn sẽ thấy mục **Cloud name**. Hãy sao chép giá trị này.

## 3. Tạo Upload Preset (để upload ảnh từ trình duyệt)
- Đi tới mục **Settings** (biểu tượng bánh răng ở góc dưới bên trái).
- Chọn tab **Upload**.
- Cuộn xuống phần **Upload presets** và nhấn **Add upload preset**.
- Ở phần **Upload preset name**, bạn có thể đổi tên (mặc định thường là `ml_default`).
- **QUAN TRỌNG**: Chuyển **Signing Mode** từ `Signed` sang `Unsigned`. Điều này cho phép upload trực tiếp từ trình duyệt mà không cần tạo chữ ký bảo mật phức tạp ngay lập tức.
- Nhấn **Save**.

## 4. Cấu hình vào ứng dụng
Mở file `.env.local` và thêm các dòng sau (thay thế giá trị bằng thông tin của bạn):

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=ten_cloud_cua_ban
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ten_preset_cua_ban
```

## 5. Cập nhật code (nếu dùng tên preset khác)
Trong file `src/app/reminders/page.tsx`, tôi đã sử dụng `ml_default`. Nếu bạn đặt tên khác, hãy cập nhật lại ở dòng:
`formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default');`
