# Phân tích Hệ thống Kỹ thuật Chi tiết: Catalunya English (FSELearningEnglish)

Tài liệu này tổng hợp phân tích chuyên sâu về kiến trúc mã nguồn, luồng nghiệp vụ và giá trị kinh doanh của hệ thống E-Learning SaaS tích hợp AI - Catalunya English. Hệ thống được thiết kế theo chuẩn Production-ready với kiến trúc phân lớp rõ ràng và áp dụng các mẫu thiết kế phần mềm (Design Patterns) hiện đại.

---

## Phần 1: Kiến trúc Phần mềm & Backend Lõi (C# .NET 8)

Hệ thống backend được thiết kế theo kiến trúc **Structured Monolith** kết hợp tư duy **Clean Architecture** và **Domain-Driven Design (DDD)**.

### 1. Phân tầng Kiến trúc (Clean Architecture)
*   **Domain Layer:** Chứa các nghiệp vụ lõi (Entities, Enums) như logic của `FlashCardReview`, định nghĩa các trạng thái thanh toán. Không phụ thuộc vào bất kỳ framework nào.
*   **Application Layer:** Áp dụng triệt để **CQRS** (thông qua thư viện MediatR) để tách biệt luồng Đọc (Query) và Ghi (Command). Sử dụng `FluentValidation` để kiểm duyệt dữ liệu ngay từ cổng vào.
*   **Infrastructure Layer:** Quản lý giao tiếp với Database (PostgreSQL với pgvector), Caching (Memory Cache), Storage (MinIO), và các API bên ngoài (PayOS, Azure Speech, Google Gemini).
*   **Design Patterns áp dụng:**
    *   **Strategy Pattern:** Cho hệ thống chấm điểm đa dạng — hỗ trợ **6 loại câu hỏi**: Trắc nghiệm 1 đáp án (MultipleChoice), Trắc nghiệm nhiều đáp án (MultipleAnswers), Đúng/Sai (TrueFalse), Điền từ (FillBlank), Nối từ (Matching), Sắp xếp thứ tự (Ordering). Các loại câu hỏi Matching và MultipleAnswers hỗ trợ **Partial Credit** (cho điểm từng phần).
    *   **Unit of Work & Repository Pattern:** Quản lý transaction tập trung, đảm bảo tính nguyên tử (Atomicity) cho mọi giao dịch DB.
    *   **Retry Pattern & Background Jobs:** Xử lý Dead-letter Queue cho Webhook lỗi và các job ngầm dọn dẹp dữ liệu (OTP hết hạn, file tạm MinIO, Payment hết hạn).

### 2. Hệ thống Quiz Engine (QuizAttemptService)
Hệ thống thi trắc nghiệm phức tạp với nhiều cơ chế bảo vệ dữ liệu:
*   **Kiểm soát truy cập:** Xác minh quyền truy cập khóa học (`HasCourseAccess`), trạng thái quiz (Open/Closed), thời gian mở quiz (`AvailableFrom`), hạn nộp assessment (`DueAt`) và giới hạn lượt làm bài (`MaxAttempts`).
*   **Chống làm bài đồng thời (Concurrent Prevention):** Nếu user đang có bài khác `InProgress`, hệ thống block (HTTP 409 Conflict). Nếu bài cũ đã hết giờ → auto-submit ngay lập tức.
*   **Xáo trộn câu hỏi (Deterministic Shuffle):** Sử dụng `attemptId` làm seed cho thuật toán xáo trộn, đảm bảo mỗi lần Resume sẽ giữ nguyên thứ tự câu hỏi đã xáo.
*   **Real-time Scoring (Chấm điểm tức thì):** Mỗi khi học sinh chọn đáp án 1 câu, hệ thống gọi `IScoringStrategy` tương ứng để tính điểm ngay lập tức, lưu song song `AnswersJson` + `ScoresJson` + cập nhật `TotalScore`. Nếu sửa đáp án, điểm sẽ bị ghi đè (có thể từ đúng thành sai → 0 điểm).
*   **Resume Quiz (Phục hồi bài dở):** Khi user mất mạng/tắt trình duyệt → vào lại, hệ thống load lại cấu trúc quiz với cùng seed xáo trộn + điền lại các đáp án đã lưu từ `AnswersJson`. Nếu thời gian đã hết → auto-submit ngay.
*   **Auto-Submit (Background Job):** `QuizAutoSubmitService` chạy ngầm theo chu kỳ, xử lý theo **batch 200 records** (tránh memory overflow) với throttle `Task.Delay(100)` giữa các batch. Tự động nộp bài + gửi Notification + đánh dấu hoàn thành module (`CompleteModuleAsync`).
*   **Kết quả linh hoạt:** Giáo viên cấu hình có hiển thị điểm ngay không (`ShowScoreImmediately`), có cho xem đáp án đúng không (`ShowAnswersAfterSubmit`), điểm đạt (`PassingScore`).

### 3. Luồng Thanh toán & Fintech (PaymentService + WalletService)
Nền tảng tích hợp một hệ sinh thái dòng tiền nội bộ cực kỳ chặt chẽ:
*   **Transaction & ACID:** Mọi giao dịch (trừ tiền ví, cấp quyền khóa học) được bọc trong `_unitOfWork.BeginTransactionAsync()`. Nếu lỗi ở bước cấp quyền, hệ thống gọi `RollbackAsync()` ngay lập tức để không gây thất thoát cho người dùng.
*   **Cơ chế Idempotency chống Duplicate:** Sử dụng `IdempotencyKey` chặn đứng việc trừ tiền hai lần nếu người dùng hoặc hệ thống mạng vô tình gửi yêu cầu (request) đúp.
*   **Webhook & Exponential Backoff:** Khi nhận kết quả thanh toán từ cổng ngoại (PayOS):
    *   Xác thực chữ ký số (`Signature`) trước khi xử lý.
    *   Sử dụng cơ chế hàng đợi (Queue). Nếu logic hậu kiểm (như gửi email) thất bại, hệ thống vẫn ghi nhận tiền nạp thành công nhưng lưu lỗi vào hàng đợi để tự động thử lại sau (2, 4, 8, 16 phút).
*   **Phân luồng Gateway:** Mua nạp tiền (Top-up) bắt buộc qua PayOS. Mua sản phẩm (Khóa học, Gói giáo viên) bắt buộc dùng Ví nội bộ. Điều này tạo ra một vòng lặp tài chính khép kín, dễ đối soát.
*   **WalletService (Ví nội bộ):** Quản lý 3 loại giao dịch: `TopUp` (nạp tiền), `Purchase` (mua hàng, kiểm tra số dư trước khi trừ), `AdminAdjustment` (Admin cộng/trừ tiền thủ công kèm lý do). Mọi giao dịch đều ghi nhận đầy đủ `BalanceBefore` và `BalanceAfter` (Audit Trail).
*   **Luồng mua Gói Giáo viên:** Khi thanh toán thành công, hệ thống tự động nâng cấp Role user thành Teacher, tạo Subscription có thời hạn, gửi Email chúc mừng + Notification.

---

## Phần 2: Các Thuật toán Lõi & Tích hợp AI (AI Engineering)

Hệ thống không chỉ là ứng dụng CRUD cơ bản mà chứa đựng các bài toán tối ưu hóa và AI chuyên sâu.

### 1. Thuật toán Học tập Thích ứng (SM-2 Algorithm)
Tích hợp thuật toán **SuperMemo-2 (SM-2)** vào logic lõi (`FlashCardReviewService.cs`) để giải quyết bài toán "Học trước quên sau":
*   **Cơ chế:** Dựa trên độ khó mà người dùng đánh giá (Quality 0-5), hệ thống tính toán Hệ số dễ (`Easiness Factor - EF`): `newEF = EF + (0.1f - (5 - quality) * (0.08f + (5 - quality) * 0.02f))`.
*   **Spaced Repetition:** Hệ thống tự tính toán số ngày giãn cách (Interval) để hiển thị lại thẻ bài đúng vào thời điểm não bộ chuẩn bị quên.
*   **Mastered Criteria:** Khi một thẻ đạt đủ số lần ôn tập và khoảng cách ngày đủ xa, hệ thống đánh dấu "Đã thuộc" (`DateTime.MaxValue`) và ngừng hiển thị để tiết kiệm thời gian cho người học.

### 2. Hệ thống AI RAG Chatbot (Semantic Kernel)
Xây dựng một trợ lý ảo thực thụ bằng quy trình **Retrieval-Augmented Generation (RAG)** gồm 3 tầng:

**Tầng 1 — Nạp tri thức (Knowledge Ingestion):**
*   `KnowledgeSyncService` tự động đồng bộ tri thức mỗi khi Admin thêm/sửa dữ liệu.
*   `MarkdownForWikiService` sử dụng template engine **Scriban** để chuyển đổi Entity (Course, Package, Policy) thành văn bản Markdown có cấu trúc.
*   Vector hóa Markdown bằng `EmbeddingService` → gọi **Google AI Text Embedding** (Gemini) → lưu vector vào PostgreSQL (`pgvector`).
*   **Bảo vệ quyền riêng tư:** Chỉ đồng bộ khóa học công khai (`CourseType.System`) vào kho tri thức AI. Khóa học riêng của giáo viên (`Teacher`) không được index.

**Tầng 2 — Truy xuất tri thức (Retrieval):**
*   Vector hóa câu hỏi user → dùng `CosineDistance` (pgvector) tìm top-k kết quả tương đồng nhất.
*   Truy vấn đồng thời 3 kho tri thức: Khóa học (top 4), Gói dịch vụ Giáo viên (top 5), Chính sách quy định (top 3).

**Tầng 3 — Sinh câu trả lời (Generation):**
*   Ghép kiến thức tìm được vào Prompt ngữ cảnh → gửi cho LLM (Google Gemini) qua `IChatCompletionService`.
*   Prompt Engineering: chỉ trả lời dựa trên kho tri thức (chống Hallucination), hiểu tiếng lóng Việt (`"k"` = `"không"`), tự chuyển đổi tên thương hiệu cũ.
*   Cấu hình: `max_tokens = 2000`, `temperature = 0.7` — kiểm soát chi phí token và độ sáng tạo.

### 3. AI Chấm điểm Phát âm (Azure Speech SDK)
Hệ thống chấm điểm phát âm thời gian thực gồm 2 service phối hợp:
*   **Luồng xử lý:** Học sinh thu âm trên trình duyệt → upload lên MinIO (bucket tạm) → Backend tải file → `AudioConverterService` chuyển đổi sang WAV 16kHz Mono → gọi **Azure Speech SDK** với `PronunciationAssessmentConfig` (thang điểm 100, độ chi tiết Phoneme, bật phát hiện Miscue).
*   **4 chỉ số đánh giá:** Accuracy (chính xác), Fluency (trôi chảy), Completeness (đầy đủ), PronScore (tổng hợp).
*   **Phân tích đến từng âm vị (Phoneme):** Mỗi từ và mỗi phoneme đều có AccuracyScore riêng. Score < 60 → `ProblemPhonemes`, score ≥ 85 → `StrongPhonemes`.
*   **Chuyển đổi IPA → ký hiệu dễ đọc:** Bảng mapping (`ConvertIPAToDisplay`) chuyển ký tự IPA sang dạng người Việt hiểu được (VD: `θ` → `"th"`, `ʃ` → `"sh"`, `ə` → `"uh"`).
*   **Tối ưu Storage:** Chỉ lưu dữ liệu tổng hợp (`PronunciationProgress`) bằng `UpsertAsync`, không lưu raw data từng lần chấm — giúp scale hệ thống tốt hơn. Xóa file tạm khỏi MinIO ngay sau khi chấm.
*   **Hệ thống Grading:** Tính tổng hợp theo Module, xếp loại A+/A/B/C/D/F dựa trên điểm trung bình, kèm thông điệp khuyến khích phù hợp.

---

## Phần 3: Trải nghiệm & Logic Phía Frontend (React 19)

Frontend SPA (Single Page Application) sử dụng TanStack Query và Bootstrap 5, chia làm 3 không gian làm việc chuyên biệt:

### 1. Không gian Người học (Student Space)
*   **Quiz Engine Tương tác cao:** Hỗ trợ **6 loại câu hỏi** phức tạp (Trắc nghiệm 1 đáp án, Trắc nghiệm nhiều đáp án, Điền từ, Nối từ, Đúng/Sai, Sắp xếp). Có Navigator điều hướng nhảy câu hỏi tức thì và đồng hồ đếm ngược (Timer).
*   **Real-time Scoring & Auto-Submit:** Chấm điểm tức thì mỗi khi chọn đáp án (không cần đợi nộp bài). Tự động lưu đáp án ngầm và thu bài nộp lên server khi hết giờ. Hỗ trợ Resume bài làm dở khi mất mạng/tắt trình duyệt.
*   **Giao diện Flashcard 3D:** Có thể lật thẻ, hiển thị thông số ngày lặp lại trực quan kết hợp phát âm thanh.

### 2. Không gian Giáo viên - Nền tảng B2B (Teacher SaaS Workspace)
Đây là cốt lõi mô hình kinh doanh của nền tảng:
*   **Teacher Subscriptions:** Giáo viên mua các "Gói dịch vụ" (có Quotas: giới hạn học sinh, khóa học) để được cấp không gian hoạt động. Hệ thống tự động nâng cấp Role thành Teacher sau khi mua.
*   **Content Creator Modals:** Cung cấp hệ thống giao diện cửa sổ nhỏ (Modals) liên hoàn để giáo viên tạo bài học, đề thi mà không phải chuyển trang. Hệ thống cây thư mục (Tree View) trực quan. Giáo viên cấu hình quiz linh hoạt: thời gian, số lần làm, xáo trộn, hiển thị điểm/đáp án.
*   **Class Management & Grading:** Quản lý mã lớp học. Đặc biệt có giao diện chấm bài tự luận chia đôi màn hình (Split-screen) - một bên xem bài Essay học sinh nộp, một bên nhập điểm và nhận xét (Rubric).

### 3. Không gian Quản trị viên (Admin Dashboard)
*   **Analytics:** Biểu đồ trực quan (Recharts) theo dõi doanh thu, lưu lượng và hành vi của người dùng trên toàn hệ thống.
*   **Package & Asset Management:** Admin tự định cấu hình các gói bán cho giáo viên. Tích hợp tính năng quản lý Assets (Logo, Banner) cho phép thay đổi giao diện nền tảng mà không cần can thiệp vào mã nguồn Frontend.
*   **Wallet Admin:** Admin có thể trực tiếp điều chỉnh (cộng/trừ) số dư ví của người dùng kèm lý do, phục vụ hoàn tiền hoặc khuyến mãi.
*   **AI Knowledge Management:** Giao diện nhập liệu quy định, chính sách. Dữ liệu sau đó được hệ thống tự động vector hóa và nạp vào kho tri thức cho AI Chatbot.

### 4. Tối ưu Hiệu năng & Trải nghiệm (Performance & UX)
*   **Real-time State:** Nhờ `TanStack Query`, dữ liệu được cache cục bộ, các thao tác chuyển trang và xử lý dữ liệu trả về tốc độ tức thì (0s latency).
*   **Thanh toán liền mạch:** Khi thanh toán qua PayOS thành công, frontend nhận diện và đổ hiệu ứng chúc mừng (Confetti) đồng thời cập nhật số dư ví mà không cần reload trang.
*   **SEO & Core Web Vitals:** Đạt điểm tuyệt đối trên Lighthouse. Quản lý Meta tags động qua `react-helmet-async` giúp tối ưu hóa việc chia sẻ khóa học lên mạng xã hội và Google Index.
*   **Module Completion Tracking:** Tự động đánh dấu hoàn thành module sau khi học sinh nộp bài quiz (cả manual submit lẫn auto-submit), cập nhật tiến độ khóa học theo thời gian thực.

---

*Tài liệu này chứng minh khả năng thiết kế hệ thống chịu tải, tích hợp AI chuyên sâu và kỹ năng xử lý các bài toán kỹ thuật thực tiễn ở cấp độ Production của nền tảng Catalunya English.*
