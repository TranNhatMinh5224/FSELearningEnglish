// src/Components/Header/MainHeader.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Navbar, Nav } from "react-bootstrap";
import { FaHome, FaGraduationCap, FaBookOpen, FaBook } from "react-icons/fa";
import "./Header.css";
import { useAssets } from "../../Context/AssetContext";
import ProfileDropdown from "./ProfileDropdown";
import NotificationDropdown from "./NotificationDropdown/NotificationDropdown";
import StreakDropdown from "./StreakDropdown/StreakDropdown";
import WalletDropdown from "./WalletDropdown/WalletDropdown";
import { useAuth } from "../../Context/AuthContext";
import { ROUTE_PATHS } from "../../Routes/Paths";
import LoginRequiredModal from "../Common/LoginRequiredModal/LoginRequiredModal";

export default function MainHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { getLogo } = useAssets();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const logo = getLogo();

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Kiểm tra đăng nhập trước khi navigate
  const handleNavigation = (path, requiresAuth = false) => {
    if (requiresAuth && !isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    navigate(path);
  };


  return (
    <Navbar className="main-header" fixed="top" expand="lg">
      <Container className="d-flex align-items-center">
        {/* LEFT: logo + brand */}
        <Navbar.Brand
          className="main-header__left d-flex align-items-center"
          onClick={() => navigate(ROUTE_PATHS.HOME)}
          style={{ cursor: "pointer" }}
        >
          {logo && <img src={logo} alt="Catalunya English - Logo" width="44" height="44" className="main-header__logo" />}
          <span className="main-header__brand">Catalunya English</span>
        </Navbar.Brand>

        {/* Toggle for mobile - Moved to the right */}
        <div className="d-flex align-items-center gap-2">
          {/* Mobile-only visible items (Streak & Wallet) */}
          <div className="d-flex d-lg-none align-items-center gap-2">
            <StreakDropdown />
            <WalletDropdown />
          </div>
          <Navbar.Toggle aria-controls="main-navbar" className="border-0 p-0" />
        </div>

        <Navbar.Collapse id="main-navbar">
          {/* CENTER: navigation */}
          <Nav className="main-header__nav mx-auto">
            <Nav.Item
              style={{ "--i": 1 }}
              onClick={() => navigate("/home")}
              className={`nav-item d-flex align-items-center ${isActive("/home") ? "active" : ""}`}
            >
              <FaHome className="nav-icon" />
              <span className="nav-text">Trang chủ</span>
            </Nav.Item>

            <Nav.Item
              style={{ "--i": 2 }}
              onClick={() => handleNavigation(ROUTE_PATHS.MY_COURSES, true)}
              className={`nav-item d-flex align-items-center ${isActive("/my-courses") ? "active" : ""}`}
            >
              <FaGraduationCap className="nav-icon" />
              <span className="nav-text">Học tập</span>
            </Nav.Item>

            <Nav.Item
              style={{ "--i": 3 }}
              onClick={() => handleNavigation(ROUTE_PATHS.VOCABULARY_REVIEW, true)}
              className={`nav-item d-flex align-items-center ${isActive("/vocabulary-review") ? "active" : ""}`}
            >
              <FaBookOpen className="nav-icon" />
              <span className="nav-text">Ôn tập</span>
            </Nav.Item>

            <Nav.Item
              style={{ "--i": 4 }}
              onClick={() => handleNavigation(ROUTE_PATHS.VOCABULARY_NOTEBOOK, true)}
              className={`nav-item d-flex align-items-center ${isActive("/vocabulary-notebook") ? "active" : ""}`}
            >
              <FaBook className="nav-icon" />
              <span className="nav-text">Sổ tay</span>
            </Nav.Item>
          </Nav>

          {/* RIGHT: actions */}
          <div className="main-header__right d-flex align-items-center gap-3">
            {/* Desktop-only Streak & Wallet */}
            <div className="d-none d-lg-flex align-items-center gap-3">
              <StreakDropdown />
              <WalletDropdown />
            </div>
            
            {/* Always in right group (Notifications & Profile) */}
            <div style={{ "--i": 5 }} className="mobile-stagger-item">
              <NotificationDropdown />
            </div>
            <div style={{ "--i": 6 }} className="mobile-stagger-item">
              <ProfileDropdown />
            </div>
          </div>
        </Navbar.Collapse>
      </Container>

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </Navbar>
  );
}
