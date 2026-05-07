# 🛠️ Hướng dẫn Cài đặt & Chạy dự án (Setup Guide)

Tài liệu này hướng dẫn chi tiết cách thiết lập môi trường phát triển cho dự án **Catalunya English**. Bạn có thể chọn một trong hai phương thức bên dưới.

---

## 🏗️ 1. Phương thức 1: Portable Setup (Khuyên dùng)
Dành cho những người muốn chạy nhanh dự án mà không cần cài đặt lẻ tẻ các công nghệ trên máy. Yêu cầu duy nhất là đã cài **Docker & Docker Compose**.

1.  **Chuẩn bị file cấu hình:**
    *   Copy file `.env.example` thành `.env` ở thư mục gốc.
    *   Điền các giá trị API Key cần thiết (Gemini, PayOS...).
2.  **Khởi chạy toàn bộ hệ thống:**
    ```bash
    docker-compose up --build -d
    ```
3.  **Truy cập:**
    *   Frontend: `http://localhost:3000`
    *   Backend Swagger: `http://localhost:5030/swagger`
    *   MinIO Console: `http://localhost:9001`

---

## 🛠️ 2. Phương thức 2: Full Stack Development (Hot-reload)
Dành cho lập trình viên muốn sửa code và thấy thay đổi ngay lập tức (Real-time). Đây là phương thức **chuyên nghiệp nhất** để phát triển.

1.  **Chuẩn bị:** Copy `.env.example` thành `.env`.
2.  **Khởi chạy:**
    ```bash
    docker-compose -f docker-compose.dev.yml up --build
    ```
3.  **Tính năng:**
    *   **Backend:** Tự động khởi động lại khi bạn sửa file `.cs` (nhờ `dotnet watch`).
    *   **Frontend:** Tự động cập nhật giao diện khi bạn sửa file `.js/.css` (nhờ `webpack dev server`).
    *   **Database:** Đã tích hợp sẵn Healthcheck để đảm bảo Backend chỉ chạy khi DB đã sẵn sàng.

---

## 💻 3. Phương thức 3: Manual Setup (Cài đặt thủ công)
Dành cho các nhà phát triển muốn can thiệp sâu vào code và debug trực tiếp.

### 2.1 Yêu cầu hệ thống (Prerequisites)
- **Runtime:** [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) & [Node.js (v18+)](https://nodejs.org/)
- **Infrastructure:** Khởi chạy Database, MinIO bằng Docker:
  ```bash
  docker-compose -f docker-compose.local.yml up -d
  ```

### 2.2 Cấu hình Biến môi trường
- **Cơ chế Caching:** Hệ thống sử dụng **In-Memory Caching** (RAM) tối ưu cho môi trường Monolith, không yêu cầu cài đặt thêm Redis.
*   **Backend:** Cấu hình tại `BackendELearningEnglish/LearningEnglish.API/appsettings.Development.json`
*   **Frontend:** Cấu hình tại `FrontElearningEnglish/.env`

### 2.3 Khởi chạy
**Chạy Backend:**
```bash
cd BackendELearningEnglish/LearningEnglish.API
dotnet ef database update
dotnet run
```

**Chạy Frontend:**
```bash
cd FrontElearningEnglish
npm install
npm start
```

---

## 📂 3. Cấu hình biến môi trường chi tiết (Secrets Checklist)

| Nhóm | Key | Nơi lấy |
| --- | --- | --- |
| **Fintech** | `PayOS:ApiKey` | [PayOS Dashboard](https://dashboard.payos.vn/) |
| **AI** | `Gemini:ApiKey` | [Google AI Studio](https://aistudio.google.com/) |
| **Speech** | `AzureSpeech:SubscriptionKey` | [Azure Portal](https://portal.azure.com/) |
| **Storage** | `MinIO:AccessKey` | MinIO Console |

---

## 🌐 4. Kiến trúc Production (Sơ lược)
Trong môi trường thực tế, dự án vận hành native trên Linux với:
- **Nginx:** Làm Reverse Proxy điều phối lưu lượng và SSL.
- **Systemd:** Quản lý vòng đời và tự động khởi động các service .NET.
- **PostgreSQL:** Chạy trực tiếp trên OS để tối ưu IOPS.

---

*Mọi thắc mắc vui lòng liên hệ tác giả qua Email: nhatminh5224.forwork@gmail.com*
