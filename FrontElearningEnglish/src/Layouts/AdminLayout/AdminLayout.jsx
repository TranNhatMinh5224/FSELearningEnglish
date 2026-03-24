import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { ROUTE_PATHS } from "../../Routes/Paths";
import UnauthorizedModal from "../../Components/Common/UnauthorizedModal/UnauthorizedModal";
import { hasAnyRole } from "../../Utils/permissions";
import "./AdminLayout.css";

// Icons (Using React Icons)
import {
  MdDashboard,
  MdClass,
  MdPeople,
  MdAssignment,
  MdLogout,
  MdSearch,
  MdInventory,
  MdAdminPanelSettings,
  MdImage,
  MdHome
} from "react-icons/md";
import { useAuth } from "../../Context/AuthContext";

export default function AdminLayout() {
  const { user, roles, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();

  // Unauthorized Modal State
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);
  const [unauthorizedFeature, setUnauthorizedFeature] = useState("");

  // Check if user is admin
  const isAdmin = roles.some((role) => {
    const roleName = typeof role === 'string' ? role : role?.name || role;
    return roleName === "SuperAdmin" ||
      roleName === "ContentAdmin" ||
      roleName === "FinanceAdmin";
  });

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate(ROUTE_PATHS.LOGIN);
        return;
      }

      if (!isAdmin) {
        navigate(ROUTE_PATHS.HOME);
        return;
      }
    }
  }, [isAuthenticated, isAdmin, loading, navigate, roles]);

  const handleLogout = () => {
    logout(navigate);
  };

  // Sidebar toggle state for mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Check permissions before navigation
  const handleNavClick = (e, path, requiredRoles, featureName) => {
    // Close sidebar on mobile when navigating
    if (window.innerWidth < 992) {
      closeSidebar();
    }

    if (requiredRoles && !hasAnyRole(roles, requiredRoles)) {
      e.preventDefault();
      setUnauthorizedFeature(featureName);
      setShowUnauthorizedModal(true);
    }
  };

  // Show loading or nothing while checking auth
  if (loading || !isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className={`admin-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'show' : ''}`}>
        <div className="sidebar-brand">
          <span>Catalunya English</span>
          <button className="sidebar-close-btn d-lg-none" onClick={closeSidebar}>&times;</button>
        </div>

        <nav className="sidebar-menu">
          <NavLink
            to={ROUTE_PATHS.ADMIN.DASHBOARD}
            className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}
            onClick={(e) => handleNavClick(e, null, null, null)}
          >
            <MdDashboard /> Dashboard
          </NavLink>

          <NavLink
            to={ROUTE_PATHS.ADMIN.COURSES}
            className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}
            onClick={(e) => handleNavClick(e, ROUTE_PATHS.ADMIN.COURSES, ["SuperAdmin", "ContentAdmin"], "Quản lý khóa học")}
          >
            <MdClass /> Course Management
          </NavLink>

          <NavLink
            to={ROUTE_PATHS.ADMIN.USERS}
            className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}
            onClick={(e) => handleNavClick(e, ROUTE_PATHS.ADMIN.USERS, ["SuperAdmin", "FinanceAdmin"], "Quản lý người dùng")}
          >
            <MdPeople /> User Management
          </NavLink>

          <NavLink
            to="/admin/packages"
            className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}
            onClick={(e) => handleNavClick(e, "/admin/packages", ["SuperAdmin", "FinanceAdmin"], "Quản lý gói dịch vụ")}
          >
            <MdInventory /> Package Management
          </NavLink>

          <NavLink
            to="/admin/admin-management"
            className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}
            onClick={(e) => handleNavClick(e, "/admin/admin-management", ["SuperAdmin"], "Admin Management")}
          >
            <MdAdminPanelSettings /> Admin Management
          </NavLink>

          <NavLink
            to={ROUTE_PATHS.ADMIN.ASSET_MANAGEMENT}
            className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}
            onClick={(e) => handleNavClick(e, ROUTE_PATHS.ADMIN.ASSET_MANAGEMENT, ["SuperAdmin", "ContentAdmin"], "Quản lý Assets")}
          >
            <MdImage /> Asset Management
          </NavLink>

          <NavLink
            to={ROUTE_PATHS.ADMIN.SUBMISSION_MANAGEMENT}
            className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}
            onClick={(e) => handleNavClick(e, ROUTE_PATHS.ADMIN.SUBMISSION_MANAGEMENT, ["SuperAdmin", "ContentAdmin"], "Quản lý bài nộp")}
          >
            <MdAssignment /> Quản lý bài nộp
          </NavLink>

          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => navigate(ROUTE_PATHS.HOME)} className="menu-item" style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <MdHome /> Quay về trang chủ
            </button>
            <button onClick={handleLogout} className="menu-item" style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <MdLogout /> Logout
            </button>
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="admin-main">
        {/* TOP HEADER */}
        <header className="admin-header">
          <button className="menu-toggle-btn d-lg-none me-3" onClick={toggleSidebar}>
            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path></svg>
          </button>

          <div className="header-search d-none d-md-block">
            <MdSearch style={{ position: 'absolute', marginLeft: '10px', marginTop: '10px', color: '#94a3b8' }} />
            <input type="text" placeholder="Search anything..." style={{ paddingLeft: '35px' }} />
          </div>

          <div className="header-actions ms-auto">
            <div className="admin-profile">
              <span className="d-none d-sm-inline" style={{ fontWeight: 600, color: '#334155' }}>{user?.fullName || "Admin"}</span>
              <img
                src={user?.avatarUrl || "https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff"}
                alt="Admin"
                style={{ width: '32px', height: '32px', borderRadius: '50%', marginLeft: '10px', verticalAlign: 'middle', objectFit: 'cover' }}
              />
            </div>
          </div>
        </header>

        {/* DYNAMIC CONTENT */}

        {/* UNAUTHORIZED MODAL */}
        <UnauthorizedModal
          show={showUnauthorizedModal}
          onClose={() => setShowUnauthorizedModal(false)}
          feature={unauthorizedFeature}
        />
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
