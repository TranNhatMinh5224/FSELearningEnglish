# Catalunya English - Hệ thống học tiếng Anh thông minh tích hợp AI

> **Website dự án:** [learning-eng.hocnghiepvu.com](https://learning-eng.hocnghiepvu.com)  
- **Live Demo:** https://learning-eng.hocnghiepvu.com  
- **Status:** Production  
- **Author:** Trần Nhật Minh  
- **Email:** nhatminh5224.forwork@gmail.com  

---

## ⚡ Quick Snapshot (15s Overview)

*   **Core:** AI-Powered English Learning SaaS (Hybrid Model).
*   **Tech Stack:** React 19 + .NET 8 + PostgreSQL (Pgvector).
*   **AI Engine:** RAG Chatbot (Semantic Kernel) + Azure Speech + Gemini.
*   **Adaptive:** Spaced Repetition (SM-2 Algorithm).
*   **Fintech:** Wallet system + PayOS Integration + Audit Trail.
*   **Architecture:** Structured Monolith (Clean Architecture) + DDD + SOLID.
*   **DevOps:** GitHub Actions (CI/CD) + Linux VPS (Nginx, Systemd).

---

## 🏗️ 1. Kiến trúc hệ thống (System Architecture)

```mermaid
graph TD
    %% CI/CD Flow
    Developer[Developer] -- Git Push --> GH[GitHub Actions CI/CD]
    GH -- Deploy --> VPS[Linux VPS Service]

    %% Main Request Flow
    Client[React 19 Frontend] -- HTTPS --> Nginx{Nginx Reverse Proxy}
    Nginx -- Proxy --> API[.NET 8 Structured Monolith]
    
    subgraph "Core Backend Services"
        API -- EF Core --> DB[(PostgreSQL + Pgvector)]
        API -- Local Cache --> RAM[(VPS RAM - MemoryCache)]
        API -- S3 Protocol --> MinIO[(MinIO Storage)]
        API -- Background Task --> FFmpeg[FFmpeg Media Engine]
    end
    
    subgraph "External AI & Auth"
        API -- Semantic Kernel --> Gemini[Google Gemini AI]
        API -- Speech SDK --> Azure[Azure Speech Services]
    end

    subgraph "Third-party Integrations"
        API -- Webhook --> PayOS[PayOS Gateway]
        API -- SMTP --> Mail[Email Service]
        API -- REST --> Dict[Oxford/Free Dictionary API]
    end
    
    %% Styling
    style Nginx fill:#009639,color:#fff
    style API fill:#512bd4,color:#fff
    style DB fill:#336791,color:#fff
    style GH fill:#2088ff,color:#fff
    style RAM fill:#f39c12,color:#fff
```

---

## 🌍 2. Bối cảnh bài toán (The Problem)

Việc học tiếng Anh tại Việt Nam vẫn gặp nhiều hạn chế cốt lõi:
- **Thiếu linh hoạt**: Phụ thuộc trung tâm, thời gian cố định.
- **Không cá nhân hóa**: Lộ trình đại trà, không theo sát năng lực.
- **Chi phí cao**: Khó tiếp cận với số đông.
- **Thiếu công cụ tự luyện**: Đặc biệt là kỹ năng Speaking & Writing.
- **Giáo viên khó scale**: Giới hạn về không gian và công cụ quản lý.

---

## 💡 2. Đề tài & Giải pháp (The Solution)

Dựa trên bối cảnh đó, đề tài **"Xây dựng nền tảng Hybrid E-learning SaaS tích hợp AI"** được ra đời nhằm giải quyết triệt để các vấn đề trên thông qua:

- **Mô hình Hybrid**: Kết hợp Khóa học chuẩn (System) và Lớp riêng (Teacher) để tối ưu chi phí và tính cá nhân hóa.
- **AI-Powered**: Tận dụng AI (RAG, Azure Speech) để tạo công cụ tự luyện tập và tư vấn 24/7. Đặc biệt, hệ thống **RAG Chatbot** đóng vai trò là "tư vấn viên" thông minh, truy xuất tri thức từ kho dữ liệu nội bộ để phản hồi về:
    - 📚 Thông tin chi tiết và lộ trình các **Khóa học** (Courses).
    - 👨‍🏫 Quyền lợi và hạn mức của các **Gói dịch vụ Giáo viên** (Teacher Packages).
    - ⚖️ Các **Chính sách & Quy định** (Policies) vận hành của nền tảng.
- **Fintech & SaaS**: Chuyển đổi từ một web học tập sang một nền tảng kinh doanh giáo dục số, trao quyền cho giáo viên mở rộng quy mô.

---

## 🏗️ 3. Quy trình nghiệp vụ hệ thống (System Workflows - BPMN 2.0)

Để đảm bảo hệ thống vận hành ổn định và có khả năng chịu lỗi (Fault-tolerance), toàn bộ logic cốt lõi đã được chuẩn hóa bằng sơ đồ **BPMN 2.0**. Đây là tài liệu nền tảng giúp đội ngũ kỹ thuật hiểu sâu về luồng dữ liệu và các điểm rẽ nhánh nghiệp vụ.

- **Top-Up Flow**: Nạp tiền PayOS, xử lý Webhook Idempotency.  
  [[📄 File XML]](./Office/BPMN/TopUp_Flow.xml)
  <details>
    <summary>🖼️ Xem sơ đồ chi tiết &#38; Giải thích</summary>
    <br/>
    <ul>
      <li><b>Idempotency Check:</b> Sử dụng mã tham chiếu để đảm bảo một giao dịch nạp tiền không bị tính trùng hai lần khi nhận nhiều Webhook.</li>
      <li><b>Status Synchronization:</b> Đồng bộ trạng thái ví ngay lập tức sau khi xác thực chữ ký (Signature) từ cổng thanh toán.</li>
    </ul>
    <img src="./Office/BPMN/TopUp_Flow.png" alt="Top-Up Flow" width="100%"/>
  </details>

- **Purchase Flow**: Giao dịch nguyên tử, đảm bảo nhất quán dữ liệu.  
  [[📄 File XML]](./Office/BPMN/Purchase_Flow.xml)
  <details>
    <summary>🖼️ Xem sơ đồ chi tiết &#38; Giải thích</summary>
    <br/>
    <ul>
      <li><b>Atomic Transaction:</b> Đảm bảo trừ tiền và cấp quyền khóa học phải xảy ra đồng thời. Nếu một bước lỗi, hệ thống sẽ Rollback toàn bộ.</li>
      <li><b>Audit Logging:</b> Ghi lại lịch sử biến động số dư (Balance Before/After) để phục vụ đối soát tài chính.</li>
    </ul>
    <img src="./Office/BPMN/Purchare.png" alt="Purchase Flow" width="100%"/>
  </details>

### 🧠 3.2 Nhóm Học thuật & Thuật toán (Learning Engine)
- **Quiz Lifecycle**: Quản lý bài thi, Auto-save và Auto-submit.  
  [[📄 File XML]](./Office/BPMN/Quiz_Lifecycle.xml)
  <details>
    <summary>🖼️ Xem sơ đồ chi tiết &#38; Giải thích</summary>
    <br/>
    <ul>
      <li><b>Real-time Persistence:</b> Lưu trạng thái bài làm sau mỗi câu trả lời để tránh mất dữ liệu khi gặp sự cố mạng.</li>
      <li><b>Background Auto-Submit:</b> Sử dụng Background Task để tự động thu bài và chấm điểm ngay khi hết giờ làm bài.</li>
    </ul>
    <img src="./Office/BPMN/Quiz_Lifecycle.png" alt="Quiz Lifecycle" width="100%"/>
  </details>

- **Adaptive SRS**: Thuật toán SM-2 tối ưu hóa việc ghi nhớ.  
  [[📄 File XML]](./Office/BPMN/SRS_Adaptive_Learning.xml)
  <details>
    <summary>🖼️ Xem sơ đồ chi tiết &#38; Giải thích</summary>
    <br/>
    <ul>
      <li><b>SM-2 Implementation:</b> Tự động tính toán <i>Easiness Factor</i> và <i>Interval</i> dựa trên đánh giá độ khó của người dùng.</li>
      <li><b>Spaced Repetition:</b> Điều phối lịch ôn tập thông minh, giúp chuyển kiến thức từ bộ nhớ ngắn hạn sang dài hạn.</li>
    </ul>
    <img src="./Office/BPMN/SRS_Adaptive_Learning.png" alt="Adaptive SRS" width="100%"/>
  </details>

### 🤖 3.3 Nhóm AI & Quản trị SaaS
- **AI Knowledge Hub (RAG)**: Truy xuất tri thức đa nguồn với Semantic Kernel.  
  [[📄 File XML]](./Office/BPMN/AI_RAG_Flow.xml)
  <details>
    <summary>🖼️ Xem sơ đồ chi tiết &#38; Giải thích</summary>
    <br/>
    <ul>
      <li><b>Multi-source Retrieval:</b> Tổng hợp tri thức từ Khóa học, Gói dịch vụ và Chính sách hệ thống để cung cấp phản hồi chính xác nhất.</li>
      <li><b>Context Augmentation:</b> Tối ưu hóa Prompt bằng cách chèn ngữ cảnh tri thức đã qua xử lý Vector Search.</li>
    </ul>
    <img src="./Office/BPMN/AI_RAG_Flow.png" alt="AI RAG Flow" width="100%"/>
  </details>

- **SaaS Quota Governance**: Kiểm soát định mức tài nguyên giáo viên.  
  [[📄 File XML]](./Office/BPMN/SaaS_Quota_Governance.xml)
  <details>
    <summary>🖼️ Xem sơ đồ chi tiết &#38; Giải thích</summary>
    <br/>
    <ul>
      <li><b>Resource Enforcement:</b> Tự động hóa việc kiểm tra hạn mức (Số lượng học sinh, khóa học) dựa trên gói Subscription của giáo viên.</li>
      <li><b>Usage Analytics:</b> Cung cấp dữ liệu thời gian thực về việc sử dụng tài nguyên so với định mức đã mua.</li>
    </ul>
    <img src="./Office/BPMN/SaaS_Quota_Governance.png" alt="SaaS Quota" width="100%"/>
  </details>

### 🔐 3.4 Nhóm Bảo mật & Phân quyền
- **Identity Security**: Đăng ký OTP, chống Spam và bảo mật 5 lớp.  
  [[📄 File XML]](./Office/BPMN/Identity_Security_Flow.xml)
  <details>
    <summary>🖼️ Xem sơ đồ chi tiết &#38; Giải thích</summary>
    <br/>
    <ul>
      <li><b>Rate Limiting:</b> Sử dụng Memory Cache để tạo cơ chế Cooldown (60s) giữa các lần yêu cầu OTP, ngăn chặn Spam API.</li>
      <li><b>Brute-force Protection:</b> Tự động khóa mã OTP sau 5 lần nhập sai liên tiếp.</li>
    </ul>
    <img src="./Office/BPMN/Identity_Security_Flow.png" alt="Identity Security" width="100%"/>
  </details>

- **RBAC Security**: Kiểm soát truy cập dựa trên Role-Based Access Control.  
  [[📄 File XML]](./Office/BPMN/RBAC_Security_Flow.xml)
  <details>
    <summary>🖼️ Xem sơ đồ chi tiết &#38; Giải thích</summary>
    <br/>
    <ul>
      <li><b>Middleware Authorization:</b> Kiểm tra quyền hạn (Permissions) thông qua Middleware trước khi yêu cầu chạm tới Controller.</li>
      <li><b>Dynamic Role Management:</b> Hỗ trợ thay đổi quyền hạn người dùng theo thời gian thực mà không cần khởi động lại hệ thống.</li>
    </ul>
    <img src="./Office/BPMN/RBAC_Security_Flow.png" alt="RBAC Security" width="100%"/>
  </details>

> [!NOTE]  
> Toàn bộ các file thiết kế chuyên sâu nằm tại thư mục: [`Office/BPMN/`](./Office/BPMN/)

---
## 📄 4. Thiết kế Cơ sở dữ liệu (Database Design)

Hệ thống sử dụng **PostgreSQL** với hơn 40 thực thể được tổ chức khoa học, tập trung vào tính toàn vẹn dữ liệu và khả năng Audit (Kiểm toán).

> [!TIP]
> **Tài liệu Database chuyên sâu (Multi-format):**
> *   🌐 [**Bản vẽ tương tác (dbdiagram.io)**](https://dbdiagram.io/d/69f670d2c6a36f9c1be58625)
> *   🖼️ **Xem sơ đồ:** [Bản vẽ PNG](./Office/DB/Untitled.png) | [📐 Vector SVG (Khuyên dùng)](./Office/DB/Untitled.svg)
> *   📄 **Tài liệu offline:** [Bản in PDF](./Office/DB/Untitled.pdf) | [💾 Cấu trúc SQL Schema](./Office/DB/Untitled.sql)

### 💎 4.1 Trụ cột nghiệp vụ & Cấu trúc dữ liệu (Core Business Pillars)

| Module | Các thực thể chính (Entities) | Mối quan hệ cấu trúc dữ liệu |
| :--- | :--- | :--- |
| **🔐 Identity** | `User`, `Role`, `RolePermission` | Áp dụng RBAC, liên kết N-N giữa Role và Permission. |
| **📚 LMS Core** | `Course`, `Module`, `Lesson`, `Quiz` | Cấu trúc phân cấp 1-N chặt chẽ, tối ưu việc truy vấn nội dung học tập. |
| **📊 Adaptive** | `Progress`, `QuizResult` | Lưu vết lịch sử làm bài để tính toán tham số SM-2 (Interval, Repetition). |
| **💳 Fintech** | `Wallet`, `PaymentTransaction`, `WebhookQueue` | Lưu trữ Audit Trail với cơ chế Append-Only để đối soát lịch sử số dư. |
| **🧠 AI Vector** | `CourseKnowledge`, `PolicyKnowledge` | Tích hợp kiểu dữ liệu Vector (pgvector) để phục vụ AI Semantic Search. |
| **👩‍🏫 SaaS Mgr** | `TeacherPackage`, `TeacherSubscription` | Quản lý vòng đời gói dịch vụ giáo viên (Start Date, End Date, Quotas). |
| **📝 Evaluation** | `Essay`, `EssaySubmission`, `Pronunciation` | Liên kết giữa người học và kết quả đánh giá (Giáo viên chấm hoặc AI chấm). |

---

## 🚀 5. Kiến trúc & Công nghệ (Tech Stack &#38; Architecture)

Dự án được xây dựng theo mô hình **Client-Server** tách biệt, tối ưu hóa khả năng mở rộng và bảo trì.

### 💻 5.1 Frontend (React Ecosystem)
Hệ thống giao diện được thiết kế chú trọng vào trải nghiệm người dùng và hiệu năng, sử dụng các công nghệ hiện đại:
- **Core:** Xây dựng trên nền tảng **React 19** mới nhất.
- **State Management &#38; Caching:** Tích hợp **TanStack Query** để tối ưu hóa hiệu năng caching và xử lý mượt mà các trạng thái dữ liệu bất đồng bộ từ API.
- **UI/UX:** Giao diện trực quan, đảm bảo tính **Responsive 100%** trên mọi thiết bị với **Bootstrap 5**.
- **Data Visualization:** Trực quan hóa dữ liệu thống kê báo cáo chuyên nghiệp bằng biểu đồ **Recharts**.

### ⚙️ 5.2 Backend (Structured Monolith & Clean Architecture)
Hệ thống được thiết kế theo kiến trúc **Structured Monolith** (Monolith có cấu trúc), kết hợp tư duy **Domain-Driven Design (DDD)** và các nguyên tắc **SOLID** để giải quyết các nghiệp vụ giáo dục phức tạp. Việc phân tách rõ rệt 4 lớp giúp hệ thống dễ dàng bảo trì và sẵn sàng tách thành Microservices trong tương lai:
- **Domain Layer**: Chứa Entities, Enums, Interfaces cốt lõi. Hoàn toàn độc lập với các thư viện bên ngoài.
- **Application Layer**: Nơi định nghĩa các Use Cases, DTOs, AutoMapper, và Validator (FluentValidation). Áp dụng triệt để pattern **CQRS** (thông qua MediatR) để tách biệt luồng Đọc/Ghi.
- **Infrastructure Layer**: Giao tiếp với Database (EF Core/PostgreSQL), Caching (Memory Cache), Storage (MinIO), và External APIs (PayOS, Azure Speech, Google Gemini).
- **Presentation Layer (Web API)**: Quản lý Controllers, custom Middleware (Rate Limiting), và thiết lập Dependency Injection.

### 🧠 5.3 Điểm nhấn Kỹ thuật nâng cao (Advanced Backend Engineering)
Để giải quyết các bài toán phức tạp về hiệu năng, bảo mật và quản lý tài nguyên máy chủ, hệ thống không chỉ dừng lại ở các thao tác CRUD cơ bản mà còn áp dụng triệt để các giải pháp phần mềm chuyên sâu:
- **Design Patterns Thực chiến:**
  - **Strategy Pattern:** Áp dụng cho hệ thống chấm điểm đa dạng (`IScoringStrategy`: *Trắc nghiệm, Điền từ, Nối câu, Sắp xếp...*), giúp dễ dàng thêm loại câu hỏi mới mà không sửa code cũ (Open/Closed Principle).
  - **Repository & Unit of Work:** Quản lý Transaction tập trung, đảm bảo tính nguyên tử (Atomicity) khi thực hiện các giao dịch thanh toán và cập nhật khóa học.
  - **CQRS Pattern:** Tích hợp `MediatR` để điều phối các luồng xử lý Command/Query phức tạp.
- **Fault Tolerance & Background Processing:**
  - **Retry Pattern (Dead-letter Queue):** `WebhookRetryService` tự động gửi lại các webhook bị lỗi để không thất thoát dữ liệu thanh toán.
  - **Garbage Collection (GC) Jobs:** Loạt `IHostedService` chạy ngầm để dọn dẹp hệ thống (Xóa OTP hết hạn, dọn file tạm MinIO, hủy Payment hết hạn) giúp tiết kiệm bộ nhớ.
- **Security & Reliability:**
  - **Rate Limiting:** Chống Brute-force và Spam API bằng cơ chế Fixed Window (VD: Giới hạn số lần nhập mã lớp học/OTP).
  - **Policy-based Authorization:** Phân quyền động tới từng chức năng nhỏ (Dynamic Permissions) thông qua Custom Authorization Handlers thay vì chỉ dựa vào Role tĩnh.
  - **Validation Pipeline:** Tích hợp `FluentValidation` để tự động xác thực dữ liệu đầu vào ngay từ tầng API.

---

## 🚀 6. Triển khai & Vận hành (Deployment &#38; DevOps)

Hệ thống được thiết kế để vận hành tự động (Automation-first), đảm bảo khả năng triển khai nhanh và ổn định.

### 🔄 6.1 Chu trình CI/CD (GitHub Actions)
Tự động hóa toàn bộ quy trình từ lúc Push code đến khi sản phẩm lên môi trường Production:
- **CI Pipeline**: Tự động Build, Restore và kiểm tra lỗi cú pháp cho cả Frontend và Backend.
- **CD Pipeline**: Sử dụng **Self-hosted Runner** trên VPS Linux để thực hiện:
    - **Backend**: Đóng gói ứng dụng, tạo **EF Migration Bundle** và tự động cập nhật Schema Database.
    - **Frontend**: Build mã nguồn và đồng bộ hóa dữ liệu lên Web Server.
    - **Service Management**: Tự động Restart các **Systemd Service** để áp dụng phiên bản mới mà không cần can thiệp thủ công.

### 🌐 6.2 Hạ tầng Production (Native Linux Deployment)
Hệ thống được triển khai tối ưu hiệu năng trực tiếp trên nền tảng Linux (không qua lớp ảo hóa container cho môi trường chạy chính):
- **Server:** VPS Linux (Ubuntu), quản lý vòng đời ứng dụng qua **Systemd Services**.
- **Web Server:** **Nginx** đóng vai trò Reverse Proxy, xử lý SSL (HTTPS), nén dữ liệu và bảo mật đầu cuối.
- **Database:** PostgreSQL vận hành native để tận dụng tối đa tài nguyên phần cứng.
- **Storage Strategy (MinIO):** Object Storage tương thích chuẩn S3, quản lý tập trung tài nguyên đa phương tiện (Video, Audio, Essay).
- **Security:** Quản lý cấu hình qua Environment Variables và GitHub Secrets.

---

## 🛠️ 7. Setup & Development

Dự án hỗ trợ hai phương thức thiết lập môi trường phát triển:
- **Portable Setup (Khuyên dùng):** Sử dụng **Docker Compose** để khởi chạy toàn bộ hệ thống chỉ với một câu lệnh.
- **Manual Setup:** Cài đặt trực tiếp các công nghệ (.NET 8, Node.js, Postgres, MinIO...).

👉 **[Xem hướng dẫn cài đặt chi tiết tại SETUP.md](./SETUP.md)**

---

## 🌟 8. Các tính năng tiêu biểu (Key Featured Highlights)

Hệ thống vượt xa các nền tảng LMS thông thường nhờ việc tích hợp các giải pháp kỹ thuật chuyên sâu và mô hình kinh doanh hiện đại.

### 🤖 8.1 Hệ thống AI RAG (Retrieval-Augmented Generation)
- **Tư duy:** Không chỉ là một wrapper gọi API AI đơn thuần, hệ thống sử dụng **Semantic Kernel** để điều phối quy trình RAG.
- **Giá trị:** AI có khả năng truy xuất tri thức từ kho dữ liệu nội bộ (Courses, Policies, Teacher Packages) để đưa ra phản hồi chính xác, giảm thiểu hiện tượng "ảo giác" (Hallucination).

### 📈 8.2 Học tập thích ứng (Adaptive Learning - SM-2)
- **Cơ chế:** Hiện thực hóa thuật toán **SuperMemo-2 (SM-2)** để tự động hóa việc cá nhân hóa lộ trình ôn tập.
- **Giá trị:** Hệ thống tự động tính toán thời điểm "vàng" (Interval) để nhắc nhở người dùng ôn tập lại từ vựng/kiến thức dựa trên chất lượng phản hồi, tối ưu hóa việc ghi nhớ dài hạn.

### 👩‍🏫 8.3 Mô hình SaaS "Teacher Empowerment"
- **Cơ chế:** Cung cấp giải pháp **Software-as-a-Service** cho giáo viên. Mỗi giáo viên có thể sở hữu không gian quản lý riêng, lớp học riêng và các gói dịch vụ (Teacher Packages).
- **Giá trị:** Hệ thống quản lý chặt chẽ hạn ngạch tài nguyên (Quotas) và các gói đăng ký, cho phép nền tảng mở rộng quy mô kinh doanh không giới hạn.

### 💳 8.4 Fintech Wallet & Auto-Payment
- **Cơ chế:** Tích hợp cổng thanh toán **PayOS (QR Code)** với quy trình cộng tiền tự động. 
- **Giá trị:** Đảm bảo tính toàn vẹn dữ liệu tài chính thông qua cơ chế **Idempotency Webhook** và hệ thống **Audit Trail** ghi lại mọi biến động số dư ví (Balance History).

### 🎤 8.5 Chấm điểm phát âm bằng AI (AI Pronunciation Assessment)
- **Cơ chế:** Tận dụng sức mạnh của **Azure Speech Services** để nhận diện và phân tích phổ thanh âm theo thời gian thực.
- **Giá trị:** Cung cấp phản hồi chi tiết tới từng âm tiết (Phonemes) bao gồm độ chính xác, độ trôi chảy và ngữ điệu, giúp học sinh tự luyện nói chuẩn bản xứ mà không cần giáo viên kèm 1-1. *(Lưu ý: Đối với kỹ năng Viết - Essay, hệ thống đề cao sự tương tác nên sử dụng cơ chế Giáo viên chấm thủ công có phản hồi chi tiết).*

---

