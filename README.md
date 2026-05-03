# Catalunya English - Hệ thống học tiếng Anh thông minh tích hợp AI

> **Website dự án:** [learning-eng.hocnghiepvu.com](https://learning-eng.hocnghiepvu.com)  
- **Live Demo:** https://learning-eng.hocnghiepvu.com  
- **Status:** Production  
- **Author:** Trần Nhật Minh  
- **Email:** nhatminh5224.forwork@gmail.com  

---

## 🌍 1. Bối cảnh bài toán (The Problem)

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

### 4.1 Các cụm thực thể chiến lược
- **🔐 Identity & Access Control**: Quản lý tài khoản và cơ chế phân quyền động (Dynamic Permissions) tới từng Endpoint.
- **📚 Learning Management (LMS)**: Cấu trúc cây linh hoạt (Course -> Module -> Lesson -> Material) hỗ trợ đa dạng định dạng nội dung.
- **📊 Progress & Adaptive Logic**: Lưu trữ dấu chân học tập chi tiết, phục vụ báo cáo tiến độ và tham số cho thuật toán SRS.
- **💳 Fintech & Audit Trail**: Lưu trữ lịch sử biến động số dư ví (Balance Before/After) giúp minh bạch hóa mọi giao dịch tài chính.
- **🧠 Vector Knowledge Base**: Kho tri thức đã được nhúng (Embedding) phục vụ cho hệ thống AI RAG.

---

## 🚀 5. Kiến trúc & Công nghệ (Tech Stack &#38; Architecture)

Dự án được xây dựng theo mô hình **Client-Server** tách biệt, tối ưu hóa khả năng mở rộng và bảo trì.

### 💻 5.1 Frontend (React Ecosystem)
Hệ thống giao diện được thiết kế chú trọng vào trải nghiệm người dùng và hiệu năng, sử dụng các công nghệ hiện đại:
- **Core:** Xây dựng trên nền tảng **React 19** mới nhất.
- **State Management &#38; Caching:** Tích hợp **TanStack Query** để tối ưu hóa hiệu năng caching và xử lý mượt mà các trạng thái dữ liệu bất đồng bộ từ API.
- **UI/UX:** Giao diện trực quan, đảm bảo tính **Responsive 100%** trên mọi thiết bị với **Bootstrap 5**.
- **Data Visualization:** Trực quan hóa dữ liệu thống kê báo cáo chuyên nghiệp bằng biểu đồ **Recharts**.

### ⚙️ 5.2 Backend (Structured Monolith)
Hệ thống được thiết kế theo kiến trúc **Structured Monolith** (Monolith có cấu trúc), giúp tối ưu chi phí vận hành nhưng vẫn đảm bảo tính module hóa cao. Backend sử dụng tư tưởng  **Clean Architecture** và các nguyên tắc **SOLID**, kết hợp với tư duy **Domain-Driven Design (DDD)** để giải quyết các nghiệp vụ giáo dục phức tạp.

Việc phân tách rõ rệt 4 lớp (**Domain, Application, Infrastructure, Presentation**) giúp hệ thống dễ dàng bảo trì và sẵn sàng mở rộng thành Microservices trong tương lai. Các công nghệ nền tảng bao gồm **.NET 8**, **PostgreSQL**, và **Semantic Kernel** cho việc điều phối AI.

### 🏗️ 5.3 Chi tiết các lớp kiến trúc (Backend Layers)
- **Domain Layer**: Tầng trung tâm chứa các thực thể (Entities), Enums và các logic nghiệp vụ thuần túy. Đây là tầng bất biến, không phụ thuộc vào bất kỳ công nghệ hay thư viện bên ngoài nào.
- **Application Layer**: Chứa các Use Cases của hệ thống (Services). Tầng này xử lý DTOs, Mapping (AutoMapper), Validator và điều phối luồng dữ liệu giữa Domain và các tầng bên ngoài.
- **Infrastructure Layer**: Hiện thực hóa các giao tiếp với hạ tầng kỹ thuật như EF Core (PostgreSQL), Redis Cache, MinIO Storage, Azure Speech và các tích hợp API bên ngoài (Gemini, PayOS).
- **Presentation Layer (Web API)**: Tầng giao tiếp với Client, quản lý Controllers, Middleware, xử lý Authentication/Authorization và cấu hình Dependency Injection (DI).

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

### 🌐 6.2 Hạ tầng Production
- **Server:** VPS Linux (Ubuntu), quản lý dịch vụ qua Systemd.
- **Web Server:** **Nginx** được cấu hình làm Reverse Proxy, hỗ trợ cân bằng tải và bảo mật SSL.
- **Storage Strategy (MinIO):** Triển khai hệ thống **Object Storage** tương thích chuẩn S3 để quản lý tập trung toàn bộ tài nguyên đa phương tiện (Video bài giảng, Audio phát âm, Essay). Giải pháp này giúp hệ thống:
    - Độc lập với các nhà cung cấp Cloud (Cloud-agnostic).
    - Tối ưu hóa tốc độ truy xuất dữ liệu thông qua mạng nội bộ Server.
    - Dễ dàng mở rộng dung lượng lưu trữ (Scaling) mà không làm thay đổi cấu trúc code.
- **Security:** Quản lý cấu hình nhạy cảm qua GitHub Secrets và biến môi trường (.env).

---

## 🌟 7. Các tính năng tiêu biểu (Key Featured Highlights)

Hệ thống vượt xa các nền tảng LMS thông thường nhờ việc tích hợp các giải pháp kỹ thuật chuyên sâu và mô hình kinh doanh hiện đại.

### 🤖 7.1 Hệ thống AI RAG (Retrieval-Augmented Generation)
- **Tư duy:** Không chỉ là một wrapper gọi API AI đơn thuần, hệ thống sử dụng **Semantic Kernel** để điều phối quy trình RAG.
- **Giá trị:** AI có khả năng truy xuất tri thức từ kho dữ liệu nội bộ (Courses, Policies, Teacher Packages) để đưa ra phản hồi chính xác, giảm thiểu hiện tượng "ảo giác" (Hallucination).

### 📈 7.2 Học tập thích ứng (Adaptive Learning - SM-2)
- **Cơ chế:** Hiện thực hóa thuật toán **SuperMemo-2 (SM-2)** để tự động hóa việc cá nhân hóa lộ trình ôn tập.
- **Giá trị:** Hệ thống tự động tính toán thời điểm "vàng" (Interval) để nhắc nhở người dùng ôn tập lại từ vựng/kiến thức dựa trên chất lượng phản hồi, tối ưu hóa việc ghi nhớ dài hạn.

### 👩‍🏫 7.3 Mô hình SaaS "Teacher Empowerment"
- **Cơ chế:** Cung cấp giải pháp **Software-as-a-Service** cho giáo viên. Mỗi giáo viên có thể sở hữu không gian quản lý riêng, lớp học riêng và các gói dịch vụ (Teacher Packages).
- **Giá trị:** Hệ thống quản lý chặt chẽ hạn ngạch tài nguyên (Quotas) và các gói đăng ký, cho phép nền tảng mở rộng quy mô kinh doanh không giới hạn.

### 💳 7.4 Fintech Wallet &#38; Auto-Payment
- **Cơ chế:** Tích hợp cổng thanh toán **PayOS (QR Code)** với quy trình cộng tiền tự động. 
- **Giá trị:** Đảm bảo tính toàn vẹn dữ liệu tài chính thông qua cơ chế **Idempotency Webhook** và hệ thống **Audit Trail** ghi lại mọi biến động số dư ví (Balance History).

### 🎤 7.5 Chấm điểm học thuật bằng AI (AI Academic Grading)
- **Cơ chế:** Tận dụng sức mạnh của **Azure Speech** và **Google Gemini** để chấm điểm tự động.
- **Giá trị:** Cung cấp phản hồi chi tiết về phát âm (Pronunciation) và nhận xét bài luận (Essay), giúp học sinh tự học hiệu quả mà không cần sự can thiệp liên tục của giáo viên.

---

.
