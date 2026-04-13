import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Container } from "react-bootstrap";
import MainHeader from "../../Components/Header/MainHeader";
import Footer from "../../Components/Footer/Footer";
import SEO from "../../Components/SEO/SEO";
import { ROUTE_PATHS } from "../../Routes/Paths";
import "./InfoPage.css";

const InfoPage = () => {
  const location = useLocation();
  const path = location.pathname;

  // Tự động cuộn lên đầu trang khi chuyển route
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  const getContent = () => {
    switch (path) {
      case ROUTE_PATHS.ABOUT:
        return {
          title: "Giới thiệu",
          subtitle: "Nâng tầm tri thức - Kết nối tương lai",
          description: "Catalunya English là nền tảng học tiếng Anh trực tuyến hiện đại, mang lại phương pháp học tập hiệu quả nhất cho người Việt.",
          content: (
            <div className="about-content">
              <section className="about-hero">
                <p>
                  Catalunya English không chỉ là một nền tảng học tập, mà là nơi khởi đầu của những niềm đam mê và khát vọng chinh phục ngôn ngữ toàn cầu.
                </p>
              </section>

              <div className="about-grid">
                <div className="about-item">
                  <h3>🎯 Sứ mệnh</h3>
                  <p>
                    Mang lại phương pháp học tiếng Anh hiện đại, dễ tiếp cận và hiệu quả nhất cho người Việt, giúp mọi người tự tin vươn ra thế giới.
                  </p>
                </div>
                <div className="about-item">
                  <h3>👁️ Tầm nhìn</h3>
                  <p>
                    Trở thành hệ thống học tiếng Anh trực tuyến hàng đầu, nơi học viên không chỉ học ngôn ngữ mà còn phát triển tư duy toàn cầu.
                  </p>
                </div>
              </div>

              <section className="about-values">
                <div className="about-hero"><h2>Giá trị cốt lõi</h2></div>
                <div className="values-list">
                  <div className="value-card">
                    <div className="value-icon">💎</div>
                    <h4>Chất lượng</h4>
                    <p>Mỗi bài giảng đều được biên soạn kỹ lưỡng bởi đội ngũ chuyên gia.</p>
                  </div>
                  <div className="value-card">
                    <div className="value-icon">❤️</div>
                    <h4>Tận tâm</h4>
                    <p>Đội ngũ hỗ trợ 24/7 luôn sẵn sàng đồng hành cùng học viên.</p>
                  </div>
                  <div className="value-card">
                    <div className="value-icon">🚀</div>
                    <h4>Sáng tạo</h4>
                    <p>Ứng dụng công nghệ mới nhất vào quy trình giảng dạy và học tập.</p>
                  </div>
                </div>
              </section>

              <section className="about-community">
                <h3>Cộng đồng Catalunya English</h3>
                <p>
                  Với hàng ngàn học viên đang theo học và nhóm cộng đồng trên Facebook hoạt động sôi nổi, chúng tôi tạo ra môi trường tương tác tốt nhất để bạn luyện tập hàng ngày.
                </p>
                <div className="mt-4 text-center">
                  <Link to={ROUTE_PATHS.HOME} className="info-cta-btn">Bắt đầu hành trình của bạn ngay</Link>
                </div>
              </section>
            </div>
          ),
        };
      case ROUTE_PATHS.FEATURES:
        return {
          title: "Tính năng nổi bật",
          subtitle: "Khám phá các công nghệ giáo dục hiện đại 4.0",
          description: "Khám phá các công nghệ giáo dục hiện đại đang được áp dụng tại Catalunya English.",
          content: (
            <div className="features-page">
              <div className="features-grid">
                <div className="feature-card f-purple">
                  <span className="feature-icon">🗣️</span>
                  <h4>Luyện phát âm AI</h4>
                  <p>Công nghệ nhận diện giọng nói tiên tiến, phản hồi ngay lập tức để bạn chỉnh sửa phát âm chuẩn xác.</p>
                </div>
                <div className="feature-card f-pink">
                  <span className="feature-icon">🧠</span>
                  <h4>Flashcards thông minh</h4>
                  <p>Hệ thống thẻ ghi nhớ tự động tối ưu hóa thời gian ôn tập vào bộ nhớ dài hạn.</p>
                </div>
                <div className="feature-card f-blue">
                  <span className="feature-icon">📔</span>
                  <h4>Sổ tay từ vựng</h4>
                  <p>Lưu trữ mọi từ mới từ bài học vào sổ tay cá nhân, thực hiện ôn tập định kỳ mọi lúc mọi nơi.</p>
                </div>
                <div className="feature-card f-green">
                  <span className="feature-icon">🏅</span>
                  <h4>Hệ thống Đánh giá</h4>
                  <p>Đa dạng hình thức kiểm tra từ Quiz đến Essay, giúp đánh giá toàn diện 4 kỹ năng.</p>
                </div>
              </div>
              <div className="mt-5 text-center">
                <Link to={ROUTE_PATHS.HOME} className="info-cta-btn">Xem danh sách khóa học</Link>
              </div>
            </div>
          ),
        };
      case ROUTE_PATHS.GUIDE_BUY_COURSE:
        return {
          title: "Hướng dẫn mua khóa học",
          subtitle: "Bắt đầu hành trình chinh phục tiếng Anh ngay hôm nay",
          description: "Chỉ với vài thao tác đơn giản, bạn có thể bắt đầu học tập ngay lập tức.",
          content: (
            <div className="guide-body">
              <div className="step-container">
                <div className="step-item">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Chọn khóa học</h4>
                    <p>Tìm kiếm và lựa chọn khóa học phù hợp với trình độ của bạn tại trang chủ Catalunya English.</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Trang Thanh toán</h4>
                    <p>Hệ thống tự động thiết kế đơn hàng và tạo mã thanh toán an toàn qua cổng <strong>PayOS</strong>.</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Quét mã VietQR</h4>
                    <p>Mở ứng dụng ngân hàng và quét mã QR hiển thị. Hệ thống hỗ trợ nạp tiền 24/7 từ mọi ngân hàng.</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>Kích hoạt tự động</h4>
                    <p>Hệ thống sẽ tự động xác nhận và mở khóa bài học trong vòng 3-10 giây sau khi chuyển khoản.</p>
                  </div>
                </div>
              </div>
              <div className="guide-note">
                <span>💡</span>
                <p><strong>Mẹo nhỏ:</strong> Bạn có thể kiểm tra danh sách bài học đã mua tại mục <Link to={ROUTE_PATHS.MY_COURSES}>"Khóa học của tôi"</Link> ngay sau khi thanh toán thành công.</p>
              </div>
              <div className="mt-4 text-center">
                <Link to={ROUTE_PATHS.HOME} className="info-cta-link">← Quay lại trang chủ chọn khóa học</Link>
              </div>
            </div>
          ),
        };
      case ROUTE_PATHS.GUIDE_UPGRADE_TEACHER:
        return {
          title: "Nâng cấp Teacher",
          subtitle: "Chia sẻ kiến thức - Lan tỏa giá trị",
          description: "Chia sẻ kiến thức tiếng Anh và tạo dựng thu nhập thụ động bền vững.",
          content: (
            <div className="guide-body">
              <section className="teacher-benefits">
                <div className="benefits-grid">
                  <div className="benefit-item">
                    <h5>🛠️ Quản lý học tập</h5>
                    <p>Thiết kế lộ trình học tập, bài giảng video và quản lý bài nộp học viên khoa học.</p>
                  </div>
                  <div className="benefit-item">
                    <h5>💰 Hỗ trợ Tài chính</h5>
                    <p>Hệ thống tự động theo dõi doanh thu và lịch sử thanh toán từ học viên.</p>
                  </div>
                  <div className="benefit-item">
                    <h5>🎨 Công cụ Giáo vụ</h5>
                    <p>Sử dụng bộ công cụ tạo Quiz, Flashcard và bài giảng chuyên nghiệp tích hợp sẵn.</p>
                  </div>
                </div>
              </section>
              <div className="step-container">
                <div className="step-item">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Chọn Gói Giáo Viên</h4>
                    <p>Lựa chọn gói đăng ký phù hợp tại mục "Gói Giáo Viên" ở trang chủ.</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Thanh toán</h4>
                    <p>Thực hiện thanh toán qua PayOS tương tự như khóa học thông thường.</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Bắt đầu sáng tạo</h4>
                    <p>Menu "Quản lý Giáo viên" sẽ xuất hiện để bạn bắt đầu xây dựng nội dung ngay.</p>
                  </div>
                </div>
              </div>
            </div>
          ),
        };
      case ROUTE_PATHS.GUIDE_USER_MANUAL:
        return {
          title: "Hướng dẫn sử dụng",
          subtitle: "Khai thác tối đa hiệu quả hệ thống",
          description: "Khai thác tối đa hiệu quả của hệ thống học tập Catalunya English.",
          content: (
            <div className="guide-body">
              <div className="policy-box">
                <h3>1. Quản lý Từ vựng</h3>
                <p>Khi học bài giảng, hãy bấm vào icon dấu cộng để thêm từ vào <strong>Sổ tay</strong>. Sử dụng tính năng <strong>Review</strong> để ôn tập lại bằng thẻ Flashcard.</p>
              </div>
              <div className="policy-box">
                <h3>2. Luyện tập Phát âm</h3>
                <p>Truy cập mục <strong>Pronunciation</strong> trong mỗi Module. Bấm giữ icon Mic để đọc theo mẫu, AI sẽ so sánh và chấm điểm chi tiết.</p>
              </div>
              <div className="policy-box">
                <h3>3. Tương tác Bài học</h3>
                <p>Nội dung bài học bao gồm Video, Flashcards và Assignments. Hãy hoàn thành các <strong>Quiz</strong> để mở khóa các chương tiếp theo.</p>
              </div>
            </div>
          ),
        };
      case ROUTE_PATHS.POLICY_PRIVACY:
        return {
          title: "Chính sách bảo mật",
          subtitle: "An toàn thông tin là ưu tiên số 1",
          description: "Quyền riêng tư và an toàn thông tin là ưu tiên hàng đầu của chúng tôi.",
          content: (
            <div className="policy-body">
              <div className="policy-box">
                <h3>Thu thập dữ liệu</h3>
                <p>Catalunya English thu thập thông tin cơ bản (Tên, Email) để cá nhân hóa tiến trình học tập và đồng bộ hóa kết quả.</p>
              </div>
              <div className="policy-box">
                <h3>Bảo mật Giao dịch</h3>
                <p>Mọi dữ liệu thanh toán đều được xử lý qua mã hóa SSL và đối tác PayOS. Chúng tôi không lưu trữ thông tin thẻ ngân hàng của bạn.</p>
              </div>
              <div className="policy-box">
                <h3>Quyền người dùng</h3>
                <p>Bạn có toàn quyền yêu cầu xuất dữ liệu học tập hoặc xóa tài khoản vĩnh viễn thông qua trang quản lý cá nhân.</p>
              </div>
            </div>
          ),
        };
      case ROUTE_PATHS.POLICY_REFUND:
        return {
          title: "Hỗ trợ & Hoàn tiền",
          subtitle: "Luôn đồng hành cùng học viên",
          description: "Chúng tôi luôn đồng hành cùng bạn trên con đường chinh phục tiếng Anh.",
          content: (
            <div className="policy-body">
              <div className="policy-box">
                <h3>Cam kết hỗ trợ</h3>
                <p>Đội ngũ kỹ thuật túc trực 24/7 để xử lý các vấn đề về tài khoản, bài tập và lỗi kích hoạt khóa học.</p>
              </div>
              <div className="policy-box">
                <h3>Quy định Hoàn tiền</h3>
                <ul>
                  <li><strong>Thời hạn:</strong> Gửi yêu cầu trong 7 ngày kể từ lúc thanh toán.</li>
                  <li><strong>Điều kiện:</strong> Chưa học quá 2 bài học của khóa học đã đăng ký.</li>
                  <li><strong>Xử lý:</strong> Hoàn trả qua tài khoản ngân hàng trong 2-3 ngày làm việc.</li>
                </ul>
              </div>
            </div>
          ),
        };
      case ROUTE_PATHS.POLICY_PAYMENT:
        return {
          title: "Quy định thanh toán",
          subtitle: "Giao dịch minh bạch, an toàn tuyệt đối",
          description: "Thông tin minh bạch về các giao dịch tài chính trên nền tảng.",
          content: (
            <div className="policy-body">
              <div className="policy-box">
                <h3>Cổng thanh toán chính thức</h3>
                <p>Website sử dụng <strong>PayOS</strong> - Nền tảng thanh toán an toàn hỗ trợ VietQR, ATM nội địa và các loại ví điện tử phổ biến.</p>
              </div>
              <div className="policy-box">
                <h3>Thời gian giao dịch</h3>
                <p>Mã VietQR có hiệu lực trong vòng <strong>15 phút</strong>. Sau thời gian này, bạn cần khởi tạo lại yêu cầu thanh toán.</p>
              </div>
              <div className="policy-box">
                <h3>Xác nhận giao dịch</h3>
                <p>Email thông báo xác nhận thanh toán sẽ được gửi ngay lập tức. Vui lòng giữ lại hóa đơn để được hỗ trợ khi cần thiết.</p>
              </div>
            </div>
          ),
        };
      case ROUTE_PATHS.POLICY_TERMS:
        return {
          title: "Điều khoản chung",
          subtitle: "Xây dựng cộng đồng học tập văn minh",
          description: "Các quy ước chung khi tham gia cộng đồng Catalunya English.",
          content: (
            <div className="policy-body">
              <div className="policy-box">
                <h3>Quy định về Tài khoản</h3>
                <p>Một tài khoản tương ứng với một học viên. Hành vi chia sẻ tài khoản hoặc phân phối trái phép nội dung sẽ bị khóa tài khoản.</p>
              </div>
              <div className="policy-box">
                <h3>Bản quyền nội dung</h3>
                <p>Tất cả video, tài liệu và bộ từ vựng thuộc bản quyền trí tuệ của Catalunya English và các đối tác liên quan.</p>
              </div>
              <div className="policy-box">
                <h3>Trách nhiệm người dùng</h3>
                <p>Người dùng cam kết không sử dụng các công cụ can thiệp vào hệ thống hoặc có những bình luận không phù hợp.</p>
              </div>
            </div>
          ),
        };
    }
  };

  const { title, subtitle, content, description } = getContent();

  return (
    <>
      <SEO title={`${title} | Catalunya English`} description={description || title} />
      <MainHeader />
      <div className="info-page-container">
        <Container>
          <div className="info-card">
            <h1 className="info-title">{title}</h1>
            {subtitle && <p className="info-subtitle">{subtitle}</p>}
            <hr className="info-divider" />
            <div className="info-body">{content}</div>
          </div>
        </Container>
      </div>
      <Footer />
    </>
  );
};

export default InfoPage;
