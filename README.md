# FSELearningEnglish – Nền tảng E-Learning tiếng Anh toàn diện

> Dự án Fullstack triển khai thực tế, phục vụ đồng thời 3 vai trò **Học viên / Giáo viên / Quản trị viên** với luồng nghiệp vụ đầy đủ: học tập, giảng dạy, quản trị, thanh toán, AI hỗ trợ học.

---

## 🌐 Demo trực tiếp

- Trang chính: https://learning-eng.hocnghiepvu.com
- Đăng nhập: https://learning-eng.hocnghiepvu.com/login
- Đăng ký: https://learning-eng.hocnghiepvu.com/register
- Trang giới thiệu/chính sách: https://learning-eng.hocnghiepvu.com/about

> Có thể truy cập link để thao tác trực tiếp trên môi trường đã deploy.

---

## 📌 Tại sao dự án này đáng chú ý?

Không chỉ là CRUD khóa học. Dự án tập trung xử lý các bài toán thực tế của sản phẩm EdTech:

1. **Learning Experience**: học theo lộ trình, quiz/essay, phát âm, flashcard ôn tập.
2. **Teaching Experience**: giáo viên tự tạo nội dung, quản lớp, chấm bài.
3. **Business Flow**: thanh toán PayOS, nâng cấp gói giáo viên, theo dõi giao dịch.
4. **Reliability**: webhook queue + retry backoff + dead-letter + cleanup payment hết hạn.
5. **AI Integration**: chatbot + dictionary + vector search (pgvector) để tăng chất lượng hỗ trợ học.

---

## 🧭 Mục lục

- [1. Tính năng nổi bật theo vai trò](#1-tính-năng-nổi-bật-theo-vai-trò)
- [2. Điểm mạnh kỹ thuật “khó” đã xử lý](#2-điểm-mạnh-kỹ-thuật-khó-đã-xử-lý)
- [3. Luồng nghiệp vụ chính](#3-luồng-nghiệp-vụ-chính)
- [4. Kiến trúc hệ thống](#4-kiến-trúc-hệ-thống)
- [5. Công nghệ sử dụng](#5-công-nghệ-sử-dụng)
- [6. Cấu trúc thư mục](#6-cấu-trúc-thư-mục)
- [7. Hướng dẫn chạy local](#7-hướng-dẫn-chạy-local)
- [8. Cấu hình môi trường](#8-cấu-hình-môi-trường)
- [9. CI/CD triển khai VPS](#9-cicd-triển-khai-vps)
- [10. Kịch bản review nhanh cho HR/Tech Lead](#10-kịch-bản-review-nhanh-cho-hrtech-lead)
- [11. Roadmap](#11-roadmap)

---

## 1. Tính năng nổi bật theo vai trò

### 👩‍🎓 Học viên (Student)

- Đăng ký, đăng nhập, xác minh email OTP, quên/đặt lại mật khẩu.
- Đăng nhập xã hội với Google/Facebook.
- Học theo mô hình phân cấp: **Course → Lesson → Module → Lecture/Flashcard/Assessment**.
- Làm **Quiz** theo lượt thi, lưu lịch sử, xem kết quả chi tiết.
- Nộp **Essay**, theo dõi trạng thái/chấm điểm.
- Luyện **Pronunciation** theo module (tích hợp Azure Speech).
- Ôn từ vựng theo **Spaced Repetition** (review due cards, mastered cards, notebook).
- Quản lý hồ sơ cá nhân, đổi mật khẩu.
- Thanh toán mua khóa học và xem lịch sử giao dịch.
- Nhận thông báo, theo dõi và duy trì streak học tập.

### 👨‍🏫 Giáo viên (Teacher)

- Quản lý khóa học của mình.
- Tạo/cập nhật bài học, module, lecture, flashcard.
- Thiết kế assessment, quiz section/group/question, essay.
- Quản lý học viên trong khóa.
- Theo dõi bài nộp, chấm bài và xem thống kê.
- Luồng nâng cấp tài khoản qua gói giáo viên.

### 🛡️ Quản trị viên (Admin)

- Dashboard tổng quan vận hành & doanh thu.
- Quản lý người dùng, phân quyền, khóa/mở tài khoản.
- Quản lý khóa học, gói giáo viên, chính sách hệ thống.
- Quản lý tài nguyên frontend (asset).
- Giám sát thanh toán và can thiệp nghiệp vụ khi cần.

### 🤖 AI & tích hợp bên thứ ba

- AI Chatbot hỗ trợ hỏi đáp học tập.
- Dictionary lookup + gợi ý tạo flashcard từ từ mới.
- Semantic Kernel + Gemini cho xử lý AI.
- `pgvector` để lưu embedding và truy vấn ngữ nghĩa.
- PayOS cho thanh toán online.
- MinIO cho lưu trữ file/media.

---

## 2. Điểm mạnh kỹ thuật “khó” đã xử lý

### ✅ Payment reliability (điểm nhấn mạnh)

- Dùng **idempotency key** để tránh tạo giao dịch trùng.
- Verify chữ ký webhook PayOS.
- Có **PaymentWebhookQueue** để không mất webhook khi lỗi tạm thời.
- **WebhookRetryService** chạy nền với exponential backoff (1m → 5m → 15m → 1h → 6h).
- Có trạng thái **Dead Letter** cho webhook lỗi nhiều lần.
- **PaymentCleanupService** tự động dọn payment pending quá hạn theo batch.

### ✅ Security & governance

- JWT authentication + refresh token.
- Role-based + permission-based authorization.
- Rate limiting trả về `429` + `Retry-After`.
- Validation tập trung bằng FluentValidation.

### ✅ Learning retention features

- Thuật toán Spaced Repetition cấu hình được (mastery interval, pass quality...).
- Streak học tập + reminder notification/email để tăng retention.

### ✅ Production-oriented backend

- Tự apply EF migrations khi API startup.
- Tách tầng rõ ràng: API / Application / Domain / Infrastructure.
- Background services cho cleanup/retry/công việc định kỳ.

---

## 3. Luồng nghiệp vụ chính

### Luồng A – Học viên mua khóa học

1. User chọn khóa học.
2. Tạo payment record.
3. Sinh link PayOS.
4. Xử lý return/webhook.
5. Xác nhận thanh toán thành công.
6. Tự động kích hoạt quyền học khóa.

### Luồng B – Giáo viên tạo nội dung

1. Giáo viên tạo course.
2. Tạo lesson/module.
3. Thêm lecture/flashcard/assessment.
4. Thiết kế quiz + câu hỏi hoặc essay.
5. Học viên học và nộp bài.
6. Giáo viên theo dõi/chấm/đánh giá.

### Luồng C – Ôn tập từ vựng thông minh

1. Học viên học flashcard.
2. Hệ thống tính due cards theo lịch ôn.
3. Review session ghi nhận chất lượng trả lời.
4. Cập nhật trạng thái mastered/near-mastered.

---

## 4. Kiến trúc hệ thống

```text
[ React Frontend ]
        |
        v
[ ASP.NET Core API ]
        |
        +--> [ Application Layer (Business Use Cases) ]
        +--> [ Domain Layer (Entities/Rules) ]
        +--> [ Infrastructure Layer ]
                 |- PostgreSQL + pgvector
                 |- MinIO
                 |- PayOS
                 |- Azure Speech
                 |- Google/Facebook OAuth
                 |- Gemini/Semantic Kernel
```

Kiểu kiến trúc này giúp:

- Dễ mở rộng module mới.
- Giảm phụ thuộc chéo.
- Dễ test/tối ưu từng tầng.

---

## 5. Công nghệ sử dụng

### Backend

- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL + pgvector
- FluentValidation, AutoMapper
- JWT, Authorization Policy/Handler
- Semantic Kernel + Gemini

### Frontend

- React
- React Router
- React Query
- Axios
- Bootstrap / React-Bootstrap
- Recharts

### DevOps / Infra

- Docker Compose (local DB)
- GitHub Actions (CI/CD)
- VPS + Nginx + systemd

---

## 6. Cấu trúc thư mục

```text
FSELearningEnglish/
├─ BackendELearningEnglish/
│  ├─ LearningEnglish.API/
│  ├─ LearningEnglish.Application/
│  ├─ LearningEnglish.Domain/
│  └─ LearningEnglish.Infrastructure/
├─ FrontElearningEnglish/
├─ docker-compose.local.yml
└─ README.md
```

---

## 7. Hướng dẫn chạy local

### 7.1 Yêu cầu môi trường

- .NET SDK 8+
- Node.js 18+
- Docker Desktop

### 7.2 Chạy database

```bash
docker compose -f docker-compose.local.yml up -d
```

### 7.3 Chạy backend

```bash
cd BackendELearningEnglish/LearningEnglish.API
dotnet restore
dotnet run
```

> API sẽ tự chạy migration khi khởi động.

### 7.4 Chạy frontend

```bash
cd FrontElearningEnglish
npm install
npm start
```

Frontend mặc định: `http://localhost:3000`

---

## 8. Cấu hình môi trường

File cấu hình chính:

- `BackendELearningEnglish/LearningEnglish.API/appsettings.json`
- `BackendELearningEnglish/LearningEnglish.API/appsettings.Development.json`

Các nhóm config quan trọng:

- `ConnectionStrings`
- `Frontend:BaseUrl`
- `Jwt`
- `GoogleAuth`, `FacebookAuth`
- `PayOS`
- `AzureSpeech`
- `MinIO`
- `OxfordDictionary`
- `ChatBotAI` / `Gemini`

> Khuyến nghị bảo mật: không lưu secret production trực tiếp trong mã nguồn. Dùng biến môi trường hoặc secret manager.

---

## 9. CI/CD triển khai VPS

Repo có 2 workflow tự động deploy khi push nhánh `main`:

- Backend: `.github/workflows/backend-deploy.yml`
- Frontend: `.github/workflows/frontend-deploy.yml`

### Secrets cần có

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_BACKEND_PATH`
- `VPS_BACKEND_SERVICE`
- `VPS_FRONTEND_PATH`

### Yêu cầu VPS

User deploy cần `sudo NOPASSWD` cho:

- `systemctl restart <backend-service>`
- `systemctl reload nginx`

### Trigger

- Auto khi thay đổi:
  - `BackendELearningEnglish/**`
  - `FrontElearningEnglish/**`
- Có thể chạy thủ công (`workflow_dispatch`).

---

## 10. Kịch bản review nhanh cho HR/Tech Lead

Nếu cần đánh giá nhanh trong 5–10 phút, có thể theo luồng:

1. Vào trang chủ: https://learning-eng.hocnghiepvu.com
2. Mở trang đăng ký/đăng nhập để xem auth flow.
3. Trải nghiệm tìm khóa học và vào trang chi tiết khóa.
4. Mở khu vực học để xem lesson/module/lecture/quiz/essay.
5. Vào trang thanh toán để xem luồng commerce.
6. Trải nghiệm chatbot/dictionary để thấy phần AI.

Điểm cần chú ý khi review:

- Sản phẩm có đủ vòng đời: học viên dùng được, giáo viên vận hành được, admin quản trị được.
- Không chỉ có UI: backend xử lý nhiều case khó (queue, retry, idempotency, security).
- Đã deploy production, có CI/CD tự động.

---

## 11. Roadmap

- Bổ sung test tự động (unit/integration/e2e).
- Public API docs + Postman collection đầy đủ.
- Dashboard phân tích học tập nâng cao (learning analytics).
- Monitoring & alerting production chuyên sâu.

---

## 🙌 Lời kết

Đây là dự án mình đầu tư theo hướng **sản phẩm có thể vận hành thực tế**, không dừng ở demo CRUD.  
Nếu anh/chị HR hoặc Tech Lead cần mình walkthrough kiến trúc và luồng nghiệp vụ trực tiếp, em rất sẵn sàng.