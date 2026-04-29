# Catalunya English - Hệ thống học tiếng Anh thông minh tích hợp AI

> **Website dự án:** [learning-eng.hocnghiepvu.com](https://learning-eng.hocnghiepvu.com)  
- **Live Demo:** https://learning-eng.hocnghiepvu.com  
- **Status:** Production  
- **Author:** Trần Nhật Minh  
- **Email:** nhatminh5224.forwork@gmail.com  

## 1. Giới thiệu dự án (Introduction)
**Catalunya English** là một nền tảng học tập trực tuyến thông minh, kết hợp linh hoạt giữa **Khóa học hệ thống (Public)** và **Lớp học riêng (Private)**. Hệ thống được xây dựng để phục vụ hai nhu cầu song song của người dùng:
- **Học viên:** Có thể tự học các chương trình chuẩn hóa từ hệ thống (Public) hoặc tham gia vào các lớp học chuyên sâu do giáo viên trực tiếp quản lý (Private) thông qua mã lớp học.
- **Giáo viên:** Sau khi nâng cấp gói dịch vụ (Teacher Packages), giáo viên sẽ được cung cấp một "không gian số" riêng để tự thiết kế bài giảng, quản lý danh sách học sinh và theo dõi tiến trình học tập của từng cá nhân một cách chuyên nghiệp và bảo mật.

## 2. Lý do chọn đề tài (Motivation)
- **Số hóa mô hình dạy học truyền thống:** Cung cấp công cụ mạnh mẽ giúp giáo viên chuyển đổi từ dạy học offline sang mô hình **lớp học Private** online, giúp quản lý học sinh và nội dung giảng dạy một cách khoa học và hiệu quả.
- **Cung cấp lộ trình học tập đa dạng:** Kết hợp giữa giáo trình chuẩn hóa từ hệ thống và các bài giảng cá nhân hóa từ giáo viên, giúp học viên có được trải nghiệm học tập phong phú nhất.
- **Tối ưu hóa quy trình quản lý lớp học riêng:** Giải quyết các bài toán về quản lý bài tập, chấm điểm tự luận (Essay), và theo dõi kết quả học tập của học sinh thông qua hệ thống mã lớp học (Class Code).
- **Hỗ trợ học tập bằng công nghệ hiện đại:** Ứng dụng **AI Pronunciation** và thuật toán **SRS** để giúp học viên ghi nhớ từ vựng hiệu quả hơn, đồng thời giảm bớt gánh nặng quản lý cho giáo viên qua hệ thống nhắc nhở tự động.

## 3. Tính năng nổi bật (Key Features)
- **Hybrid Course System:** Hỗ trợ học tập song song trên các khóa học Public của hệ thống và các lớp học Private của giáo viên.
- **Private Class Management:** Giáo viên quản lý học sinh qua mã lớp (Class Code), chấm điểm bài tập và theo dõi doanh thu gói dịch vụ.
- **Smart Learning Tools:** Đánh giá phát âm qua AI, luyện từ vựng qua Flashcard SRS và hệ thống nhắc nhở học tập (Email/Streak).
- **Hệ thống kinh doanh & Ví điện tử:** Nạp tiền qua PayOS, mua khóa học và nâng cấp gói Giáo viên tự động.
- **AI Consultant:** Chatbot hỗ trợ tư vấn về các khóa học, chính sách và hướng dẫn sử dụng nền tảng cho cả hai đối tượng người dùng.

## 3. Công nghệ sử dụng (Tech Stack)
### Backend:
- **Ngôn ngữ/Framework:** ASP.NET Core 8.0 (Web API)
- **Database:** PostgreSQL (với extension **pgvector** cho Search AI)
- **Lưu trữ:** MinIO (S3 Compatible Storage) cho Media và Tài liệu
- **Xác thực:** JWT (JSON Web Token), Google & Facebook OAuth2
- **Mapping & DI:** AutoMapper, Dependency Injection chuẩn Clean Architecture

### Frontend:
- **Framework:** React.js (Vite)
- **UI/UX:** Vanilla CSS & Bootstrap (Thiết kế Responsive, tối ưu hóa trải nghiệm người dùng)
- **State Management:** React Context API

### AI & Third-party Services:
- **Generative AI:** Google Gemini SDK (Vertex AI)
- **Payment Gateway:** PayOS SDK
- **Mailing Service:** SMTP với Template HTML chuyên nghiệp

## 4. Kiến trúc hệ thống (Architecture)
Dự án tuân thủ nghiêm ngặt mô hình **Clean Architecture**, giúp hệ thống dễ dàng mở rộng và bảo trì:
- **Domain Layer:** Chứa các Business Entities, Enums và Core Logic.
- **Application Layer:** Định nghĩa Interfaces, DTOs, và các Services xử lý nghiệp vụ (Use Cases).
- **Infrastructure Layer:** Thực hiện Repository Pattern, làm việc với Database (EF Core), Storage và các dịch vụ bên thứ 3.
- **Presentation Layer (API):** RESTful API cho phép Frontend và các dịch vụ khác giao tiếp.

## 5. Trạng thái Production (Production Status)
- **Deployment:** Dự án đã được đóng gói bằng **Docker** và triển khai trên máy chủ thực tế.
- **Monitoring:** Tích hợp Logging và cơ chế xử lý lỗi (Exception Handling) tập trung.
- **Performance:** Tối ưu hóa Database Index và Cache cho các truy vấn phổ biến.

---
*Dự án được phát triển với tâm huyết nhằm tạo ra một công cụ học tập tiếng Anh thực thụ, áp dụng những công nghệ mới nhất trong ngành phần mềm.*
