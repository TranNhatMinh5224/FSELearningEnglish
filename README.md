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

## 🏗️ 3. Quy trình nghiệp vụ (System Workflows - BPMN)

Hệ thống được vận hành dựa trên bộ khung 9 quy trình nghiệp vụ Blueprint. BPMN (Business Process Model and Notation) được sử dụng làm **"ngôn ngữ chung"** để chuyển đổi logic nghiệp vụ phức tạp thành các sơ đồ kỹ thuật trực quan, giúp các bên liên quan dễ dàng nắm bắt:
- **Cái gì (Tasks)**: Các hành vụ thực thi.
- **Ai (Lanes)**: Trách nhiệm xử lý giữa User, Backend và External Services.
- **Như thế nào (Gateways)**: Các điều kiện rẽ nhánh và xử lý ngoại lệ.

Bạn có thể xem chi tiết bằng cách click vào link file hoặc kéo file vào [bpmn.io](https://demo.bpmn.io/).

#### 🔐 A. Nhóm Identity & Bảo mật Tài khoản
1.  **Identity & Security**: [BPMN8_Identity_Security.xml](./BPMN8_Identity_Security.xml) - Đăng ký, OTP, Social Login & Brute-force.
    <details>
    <summary><b>Xem chi tiết đặc tả kỹ thuật & Sơ đồ</b></summary>

    ![BPMN Identity](./BPMN8_Identity_Security.png)

    - **Mô tả kỹ thuật**: Hệ thống xác thực tập trung hỗ trợ đa phương thức:
        - **Onboarding**: Đăng ký truyền thống (Email OTP 5 phút) và đăng nhập nhanh qua **Social Auth (Google/Facebook OAuth 2.0)**.
        - **Password Recovery**: Luồng khôi phục mật khẩu 3 bước bảo mật (Yêu cầu -> Xác thực OTP -> Thiết lập mật khẩu mới).
        - **Session Management**: Quản lý phiên bằng **JWT & Refresh Token**. Hỗ trợ tính năng **Logout All Devices** (Đăng xuất từ xa) bằng cách thu hồi toàn bộ tokens.
        - **Security Layer**: Backend triển khai lớp bảo vệ **Anti Brute-force** (giới hạn 5 lần thử) bảo vệ toàn bộ các endpoint nhạy cảm.
    - **Vai trò & Kết quả**: Thiết lập "vành đai bảo mật" đa lớp, đảm bảo trải nghiệm đăng nhập không ma sát và an toàn tuyệt đối cho thông tin người dùng.
    </details>

#### 💳 B. Nhóm Tài chính & Kinh doanh (Fintech)
2.  **Fintech TopUp**: [BPMN1_TopUp.xml](./BPMN1_TopUp.xml) - Nạp tiền ví tự động qua VietQR/PayOS.
    <details>
    <summary><b>Xem chi tiết đặc tả kỹ thuật & Sơ đồ</b></summary>

    ![BPMN TopUp](./BPMN1_TopUp.png)

    - **Mô tả kỹ thuật**: Tích hợp cổng thanh toán **PayOS (VietQR)**. Quy trình bao gồm: Tạo link thanh toán -> Người dùng quét QR -> Hệ thống nhận **Webhook** xác thực giao dịch từ ngân hàng -> Cập nhật số dư ví nội bộ theo thời gian thực (Real-time Balance Sync).
    - **Vai trò & Kết quả**: Tự động hóa hoàn toàn luồng tiền vào, loại bỏ việc xác nhận thủ công, tạo nền tảng tài chính cho toàn bộ giao dịch trong ứng dụng.
    </details>

3.  **Teacher SaaS Upgrade**: [BPMN4_Teacher_Upgrade.xml](./BPMN4_Teacher_Upgrade.xml) - Nâng cấp quyền hạn Giáo viên (SaaS Model).
    <details>
    <summary><b>Xem chi tiết đặc tả kỹ thuật & Sơ đồ</b></summary>

    ![BPMN Upgrade](./BPMN4_Teacher_Upgrade.png)

    - **Mô tả kỹ thuật**: Quy trình chuyển đổi vai trò (Role Elevation). Hệ thống kiểm tra số dư ví, thực hiện trừ tiền và khởi tạo bản ghi **Subscription** kèm các thông số hạn mức kinh doanh (Max Course, Max Student).
    - **Vai trò & Kết quả**: Kích hoạt mô hình kinh doanh SaaS, biến người dùng thành "đối tác giáo viên" có quyền khai thác thương mại trên nền tảng.
    </details>

4.  **Course Commerce**: [BPMN3_Purchase_Course.xml](./BPMN3_Purchase_Course.xml) - Giao dịch mua khóa học (Atomic Transaction).
    <details>
    <summary><b>Xem chi tiết đặc tả kỹ thuật & Sơ đồ</b></summary>

    ![BPMN Purchase](./BPMN3_Purchase_Course.png)

    - **Mô tả kỹ thuật**: Luồng giao dịch thương mại khóa học. Sử dụng cơ chế **Atomic Transaction** (Giao dịch nguyên tử) để đảm bảo tính toàn vẹn: "Trừ tiền học sinh -> Cộng quyền truy cập -> Ghi log giao dịch". Nếu một bước lỗi, toàn bộ quy trình sẽ Rollback để bảo toàn số dư.
    - **Vai trò & Kết quả**: Đảm bảo sự minh bạch tuyệt đối trong việc mua bán, bảo vệ quyền lợi tài chính của cả học sinh và giáo viên.
    </details>

#### 🏗️ C. Nhóm Quản trị & Vận hành (SaaS Governance)
5.  **System Governance**: [BPMN9_Governance.xml](./BPMN9_Governance.xml) - Kiểm soát hạn mức Quota cho Giáo viên.
    <details>
    <summary><b>Xem chi tiết đặc tả kỹ thuật & Sơ đồ</b></summary>

    ![BPMN Governance](./BPMN9_Governance.png)

    - **Mô tả kỹ thuật**: Hệ thống kiểm soát tài nguyên thông qua **Policy-based Checks**. Mỗi khi giáo viên thực hiện các tác vụ tạo nội dung, hệ thống sẽ truy vấn hạn mức (Quota) từ gói SaaS hiện tại để cho phép hoặc ngăn chặn hành vi vượt hạn mức.
    - **Vai trò & Kết quả**: Đảm bảo sự ổn định của hạ tầng và thực thi đúng cam kết kinh doanh của các gói dịch vụ.
    </details>

#### 📝 D. Nhóm Hoạt động Học tập (Learning Activity)
6.  **Quiz Lifecycle**: [BPMN2_Quiz.xml](./BPMN2_Quiz.xml) - Làm bài trắc nghiệm & Chấm điểm tự động.
    <details>
    <summary><b>Xem chi tiết đặc tả kỹ thuật & Sơ đồ</b></summary>

    ![BPMN Quiz](./BPMN2_Quiz.png)

    - **Mô tả kỹ thuật**: Trình quản lý bài tập tương tác. Triển khai thuật toán xáo trộn câu hỏi, cơ chế **Auto-save** tiến độ và chấm điểm tự động cho 6 dạng câu hỏi chuẩn quốc tế.
    - **Vai trò & Kết quả**: Chuẩn hóa việc đánh giá năng lực học sinh, cung cấp kết quả tức thì và giúp giáo viên rảnh tay khỏi việc chấm bài thủ công.
    </details>

7.  **Essay Grading**: [BPMN5_Essay_Grading.xml](./BPMN5_Essay_Grading.xml) - Nộp bài luận & Quy trình chấm bài thủ công.
    <details>
    <summary><b>Xem chi tiết đặc tả kỹ thuật & Sơ đồ</b></summary>

    ![BPMN Essay](./BPMN5_Essay_Grading.png)

    - **Mô tả kỹ thuật**: Luồng nộp và chấm bài tự luận. Quản lý trạng thái bài nộp (Submitted -> Grading -> Feedback) và lưu trữ bài viết dung lượng lớn qua MinIO. Hỗ trợ giáo viên nhận xét và sửa bài trực tiếp.
    - **Vai trò & Kết quả**: Hỗ trợ các kỹ năng chuyên sâu (Writing) - nơi cần sự tương tác và đánh giá tinh tế từ con người.
    </details>

#### 🤖 E. Công nghệ Nâng cao (Adaptive AI)
8.  **Adaptive SRS Learning**: [BPMN6_SRS_Learning.xml](./BPMN6_SRS_Learning.xml) - Học từ vựng theo thuật toán Spaced Repetition (SM-2).
    <details>
    <summary><b>Xem chi tiết đặc tả kỹ thuật & Sơ đồ</b></summary>

    ![BPMN SRS](./BPMN6_SRS_Learning.png)

    - **Mô tả kỹ thuật**: Ứng dụng thuật toán **SuperMemo-2 (SM-2)**. Hệ thống dựa trên lịch sử ghi nhớ để tính toán khoảng cách ôn tập tối ưu, tự động nhắc nhở người dùng vào đúng thời điểm họ sắp quên từ vựng.
    - **Vai trò & Kết quả**: Tối ưu hóa trí nhớ dài hạn, biến việc học từ vựng thành một quá trình khoa học và cá nhân hóa tuyệt đối.
    </details>

9.  **AI Knowledge Hub (RAG)**: [BPMN7_AI_Assistant.xml](./BPMN7_AI_Assistant.xml) - Trợ lý tư vấn AI dựa trên tri thức nội bộ.
    <details>
    <summary><b>Xem chi tiết đặc tả kỹ thuật & Sơ đồ</b></summary>

    ![BPMN AI](./BPMN7_AI_Assistant.png)

    - **Mô tả kỹ thuật**: Kiến trúc **Retrieval-Augmented Generation**. Quy trình: User Query -> Vector Search trên kho tri thức hệ thống -> Trích xuất Context -> Augment vào Prompt -> LLM phản hồi.
    - **Vai trò & Kết quả**: Tạo ra trợ lý ảo am hiểu sâu sắc về hệ thống, cung cấp thông tin tư vấn chính xác và cá nhân hóa 24/7.
    </details>

---

## 📄 4. Thiết kế Cơ sở dữ liệu (Database Design)

Hệ thống sử dụng **SQL Server** với hơn 40 bảng thực thể, được tổ chức theo kiến trúc **Domain-Driven Design**, đảm bảo tính toàn vẹn dữ liệu và khả năng mở rộng.

> [!TIP]
> **Xem sơ đồ quan hệ (ERD):**
> *   🌐 [**Xem bản tương tác tại dbdiagram.io**](https://dbdiagram.io/d/69f670d2c6a36f9c1be58625)
> *   🖼️ [Bản vẽ tĩnh (Image)](./FSE_Database_Diagram.png) | [📐 Vector SVG](./FSE_Database_Diagram.svg) | [📄 Tài liệu PDF](./FSE_Database_Architecture.pdf) | [💾 SQL Schema](./FSE_Database_Schema.sql)

### 4.1 Các cụm thực thể chính
- **🔐 Nhóm Identity & Access Control**: Quản lý tập trung tài khoản, vai trò và phân quyền động (Dynamic Permissions).
- **📚 Nhóm Learning Management (LMS)**: Thiết kế cấu trúc cây linh hoạt (Course -> Module -> Lesson -> Material).
- **📊 Nhóm Progress & Adaptive Learning**: Lưu trữ dấu chân học tập, lịch sử bài làm và tham số SRS.
- **💳 Nhóm Fintech & SaaS Model**: Quản lý ví, chuỗi giao dịch và thông tin gói dịch vụ kinh doanh.
- **🧠 Nhóm AI Knowledge Base**: Kho chứa dữ liệu tri thức đã được Vector hóa phục vụ RAG.

---

## ⚙️ 5. Công nghệ & Kiến trúc kỹ thuật (The Implementation)

### 5.1 Kiến trúc Back-end (Clean Architecture)
Dự án tuân thủ mô hình 4 lớp tách biệt: **Domain, Application, Infrastructure, API**. Giúp hệ thống độc lập với UI và Database, dễ dàng bảo trì và mở rộng.

#### 🎯 Từ Blueprint đến Thực thi (BPMN-to-Code Traceability)
Để chứng minh hệ thống được xây dựng bài bản từ khâu thiết kế nghiệp vụ, dưới đây là bảng ánh xạ từ các Task trong BPMN sang các phương thức thực thi trong mã nguồn C#:

| Quy trình (BPMN) | Tác vụ (Task Name) | Thực thi trong Code (C# Service/Method) |
| :--- | :--- | :--- |
| **BPMN8: Identity** | `Task_Verify_OTP` | `RegisterService.VerifyEmailAsync()` |
| **BPMN1: TopUp** | `Verify Webhook` | `PaymentService.HandlePayOSWebhook()` |
| **BPMN7: AI RAG** | `Vector Search` | `AiChatService.GetRelevantContext()` |
| **BPMN6: SRS** | `Calc Next Review` | `VocabularyReminderService.UpdateSrsProgress()` |
| **BPMN3: Commerce** | `Atomic Purchase` | `CourseService.RegisterCourseAsync()` (Using Transaction) |

> [!NOTE]
> Sự tương ứng 1-1 này đảm bảo rằng mọi thay đổi về nghiệp vụ trên sơ đồ BPMN đều được phản chiếu chính xác vào logic code, giúp hệ thống dễ dàng mở rộng và bảo trì (Maintainability).

### 5.2 Kiến trúc AI RAG Deep-dive
- **Orchestration**: Microsoft Semantic Kernel.
- **Knowledge Processing**: Vector hóa bằng `gemini-embedding-001`.
- **Hybrid Retrieval**: Kết hợp Keyword và Semantic Search để lấy ngữ cảnh chính xác nhất.

### 5.3 Công nghệ bổ trợ & Hạ tầng
- **Lưu trữ**: Tự vận hành **MinIO (S3 Compatible)** trên VPS riêng để quản lý media độc lập.
- **Thanh toán**: Tích hợp **PayOS Gateway** với cơ chế bảo mật Webhook Token.
- **Background Jobs**: `.NET BackgroundService` quản lý các tác vụ nhắc nhở SRS hằng ngày.

---

## 🚀 6. Khả năng vận hành & Chức năng nổi bật
- **Học tập thích ứng**: Luyện phát âm AI, học từ vựng SRS, làm Quiz tương tác.
- **Kinh doanh SaaS**: Giáo viên làm chủ lớp học, quản lý doanh thu minh bạch qua ví nội bộ.
- **Hạ tầng tự chủ**: Tự host MinIO và AI Agent trên VPS riêng, giảm thiểu chi phí vận hành cloud.

---

## 🛠️ 7. Hướng dẫn chạy dự án (Run Locally)

### Các bước thực hiện
1. **Backend**: Cấu hình AppSettings -> `dotnet ef database update` -> `dotnet run`.
2. **Frontend**: `npm install` -> Cấu hình `.env` -> `npm run dev`.

---

## 🏁 Kết luận
Catalunya English là lời giải cho bài toán giáo dục số, kết hợp hài hòa giữa **Nghiệp vụ thực tế**, **Kiến trúc bền vững** và **Công nghệ AI tiên phong**.
