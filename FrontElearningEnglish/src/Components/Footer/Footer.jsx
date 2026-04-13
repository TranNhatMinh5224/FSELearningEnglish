import React from "react";
import { Row, Col, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import { 
  FaMapMarkerAlt, 
  FaEnvelope, 
  FaGlobe, 
  FaClock, 
  FaFacebookSquare, 
  FaCcVisa, 
  FaCcMastercard 
} from "react-icons/fa";
import { ROUTE_PATHS } from "../../Routes/Paths";
import { useAssets } from "../../Context/AssetContext";
import "./Footer.css";

const FACEBOOK_GROUP_URL = "https://web.facebook.com/groups/843825855021989";

export default function Footer() {
  const { getLogo } = useAssets();
  const logo = getLogo();

  return (
    <footer className="footer">
      <Container fluid>
        <Row className="footer-content g-4">
          {/* Cột 1: Thông tin liên hệ */}
          <Col xs={12} sm={6} lg={5} className="footer-section">
            <div className="footer-brand-section">
              <div className="footer-logo-container">
                <img 
                  src={logo || "/favicon.svg"} 
                  alt="Catalunya English - Logo" 
                  className="footer-logo" 
                />
                <h4 className="footer-brand-title">Catalunya English</h4>
              </div>
              <p className="footer-tagline">HỆ THỐNG HỌC TIẾNG ANH TRỰC TUYẾN</p>
              <div className="footer-title-divider"></div>
            </div>
            
            <ul className="footer-contact-list">
              <li>
                <FaMapMarkerAlt className="contact-icon" />
                <span>Địa chỉ: Hà Nội, Việt Nam</span>
              </li>
              <li>
                <FaEnvelope className="contact-icon" />
                <span>Email: minhxoandev@gmail.com</span>
              </li>
              <li>
                <FaGlobe className="contact-icon" />
                <span>Website: catalunyaenglish.com</span>
              </li>
              <li>
                <FaClock className="contact-icon" />
                <span>Hỗ trợ: 24/7 hàng ngày</span>
              </li>
            </ul>
            
            <p className="footer-disclaimer">
              Chúng tôi không chịu trách nhiệm cho bất kỳ hành vi nào sử dụng tài nguyên sai mục đích.
            </p>

            <div className="footer-payment-methods">
              <span className="payment-badge">VISA</span>
              <span className="payment-badge">MASTERCARD</span>
              <span className="payment-badge">MOMO</span>
              <span className="payment-badge">ZALOPAY</span>
              <span className="payment-badge">VIETQR</span>
            </div>
          </Col>

          {/* Cột 2: Giời thiêu */}
          <Col xs={12} sm={6} lg={2} className="footer-section">
            <h4 className="footer-title">Giới thiệu</h4>
            <ul className="footer-links">
              <li><Link to={ROUTE_PATHS.ABOUT}>Về chúng tôi</Link></li>
              <li><a href={FACEBOOK_GROUP_URL} target="_blank" rel="noopener noreferrer">Nhóm Facebook</a></li>
              <li><Link to={ROUTE_PATHS.FEATURES}>Tính năng</Link></li>
            </ul>
          </Col>

          {/* Cột 3: Hướng dẫn */}
          <Col xs={12} sm={6} lg={2} className="footer-section">
            <h4 className="footer-title">Hướng dẫn</h4>
            <ul className="footer-links">
              <li><Link to={ROUTE_PATHS.GUIDE_BUY_COURSE}>Hướng dẫn mua khóa học</Link></li>
              <li><Link to={ROUTE_PATHS.GUIDE_UPGRADE_TEACHER}>Hướng dẫn nâng cấp Teacher</Link></li>
              <li><Link to={ROUTE_PATHS.GUIDE_USER_MANUAL}>Hướng dẫn sử dụng</Link></li>
            </ul>
          </Col>

          {/* Cột 4: Chính sách */}
          <Col xs={12} sm={6} lg={3} className="footer-section">
            <h4 className="footer-title">Chính sách</h4>
            <ul className="footer-links">
              <li><Link to={ROUTE_PATHS.POLICY_PRIVACY}>Chính sách bảo mật</Link></li>
              <li><Link to={ROUTE_PATHS.POLICY_REFUND}>Hỗ trợ & Hoàn tiền</Link></li>
              <li><Link to={ROUTE_PATHS.POLICY_PAYMENT}>Quy định thanh toán</Link></li>
              <li><Link to={ROUTE_PATHS.POLICY_TERMS}>Điều khoản chung</Link></li>
            </ul>
          </Col>
        </Row>

        <div className="footer-bottom">
          <p>&copy; 2025 Catalunya English. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
