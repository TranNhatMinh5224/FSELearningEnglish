import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authService } from "../Services/authService";
import { tokenStorage } from "../Utils/tokenStorage";
import logger from "../Utils/logger";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSocialLoginInProgress, setIsSocialLoginInProgress] = useState(false);

  // ===== INIT =====
  useEffect(() => {
    const initAuth = async () => {
      // If already authenticated (e.g., from social login), skip init
      if (isAuthenticated || isSocialLoginInProgress) {
        setLoading(false);
        return;
      }

      const token = tokenStorage.getAccessToken();
      if (!token) {
        setIsGuest(true);
        setLoading(false);
        return;
      }

      // Retry logic for getProfile - sometimes after social login, 
      // there's a small delay before backend recognizes the token
      let retries = 3;
      let delay = 500; // start with 500ms delay

      for (let i = 0; i < retries; i++) {
        try {
          const res = await authService.getProfile();
          const userData = res.data.data;
          // Backend trả về displayName hoặc fullName
          userData.fullName = userData.displayName || userData.fullName || `${userData.firstName} ${userData.lastName}`.trim();
          // Lưu avatarUrl vào user object
          userData.avatarUrl = userData.avatarUrl || null;
          setUser(userData);
          const rolesArray = userData.roles?.map((r) => r.name || r) || [];
          setRoles(rolesArray);
          setIsAuthenticated(true);
          setIsGuest(false);
          setLoading(false);
          return; // Success - exit early
        } catch (error) {
          logger.error(`getProfile attempt ${i + 1} failed:`, error);

          // If this is the last retry, clear tokens and set as guest
          if (i === retries - 1) {
            logger.error("All getProfile attempts failed, clearing tokens");
            tokenStorage.clear();
            setIsGuest(true);
            setLoading(false);
            return;
          }

          // Wait before retrying (exponential backoff)
          const currentDelay = delay;
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          delay *= 2; // double the delay for next retry
        }
      }
    };

    initAuth();
  }, [isAuthenticated, isSocialLoginInProgress]);

  // ===== LOGIN =====
  const login = useCallback(async (data, navigate) => {
    try {
      const res = await authService.login(data);

      if (!res.data?.success || !res.data?.data) {
        throw new Error(res.data?.message || "Đăng nhập thất bại");
      }

      const { accessToken, refreshToken, user } = res.data.data;

      if (!accessToken || !refreshToken || !user) {
        throw new Error("Dữ liệu đăng nhập không hợp lệ");
      }

      // Parse user data
      user.fullName = user.displayName || user.fullName || `${user.firstName} ${user.lastName}`.trim();
      user.avatarUrl = user.avatarUrl || null;

      // Set state BEFORE saving tokens to prevent race condition
      setUser(user);
      const rolesArray = user.roles?.map((r) => r.name || r) || [];
      setRoles(rolesArray);
      setIsAuthenticated(true);
      setIsGuest(false);
      setLoading(false);

      // Now save tokens
      tokenStorage.setTokens({ accessToken, refreshToken });

      // Check for any admin role: SuperAdmin, ContentAdmin, FinanceAdmin, or Admin
      const isAdmin = rolesArray.some((roleName) => {
        const normalizedRole = typeof roleName === 'string' ? roleName : roleName?.name || roleName;
        return normalizedRole === "SuperAdmin" ||
          normalizedRole === "ContentAdmin" ||
          normalizedRole === "FinanceAdmin" ||
          normalizedRole === "Admin";
      });

      const redirectPath = isAdmin ? "/admin" : "/home";
      window.location.href = redirectPath;
    } catch (error) {
      throw error; // Re-throw để component có thể catch
    }
  }, []);

  // ===== GOOGLE LOGIN =====
  const googleLogin = useCallback(async (data, navigate) => {
    try {
      setIsSocialLoginInProgress(true);
      const res = await authService.googleLogin(data);

      // Backend returns: { success, statusCode, message, data: { accessToken, refreshToken, user, expiresAt } }
      if (!res.data?.success || !res.data?.data) {
        throw new Error(res.data?.message || "Đăng nhập bằng Google thất bại");
      }

      const { accessToken, refreshToken, user } = res.data.data;

      if (!accessToken || !refreshToken || !user) {
        throw new Error("Dữ liệu đăng nhập không hợp lệ");
      }

      user.fullName = user.displayName || user.fullName || `${user.firstName} ${user.lastName}`.trim();
      user.avatarUrl = user.avatarUrl || null;

      // IMPORTANT: Set state BEFORE saving tokens to prevent race condition
      // where useEffect init runs before state is set
      setUser(user);
      const rolesArray = user.roles?.map((r) => r.name || r) || [];
      setRoles(rolesArray);
      setIsAuthenticated(true);
      setIsGuest(false);
      setLoading(false);

      // Now save tokens - this ensures state is ready before any token-based checks
      tokenStorage.setTokens({ accessToken, refreshToken });

      // Use window.location.href instead of navigate to prevent state reset
      // Check for any admin role: SuperAdmin, ContentAdmin, FinanceAdmin, or Admin
      const isAdmin = rolesArray.some((roleName) => {
        const normalizedRole = typeof roleName === 'string' ? roleName : roleName?.name || roleName;
        return normalizedRole === "SuperAdmin" ||
          normalizedRole === "ContentAdmin" ||
          normalizedRole === "FinanceAdmin" ||
          normalizedRole === "Admin";
      });

      const redirectPath = isAdmin ? "/admin" : "/home";
      window.location.href = redirectPath;
    } catch (error) {
      logger.error("AuthContext.googleLogin ERROR:", error);
      setIsSocialLoginInProgress(false);
      throw error; // Re-throw để component có thể catch
    }
  }, []);

  // ===== FACEBOOK LOGIN =====
  const facebookLogin = useCallback(async (data, navigate) => {
    try {
      setIsSocialLoginInProgress(true);
      const res = await authService.facebookLogin(data);

      // Backend returns: { success, statusCode, message, data: { accessToken, refreshToken, user, expiresAt } }
      if (!res.data?.success || !res.data?.data) {
        logger.error("Facebook login failed:", res.data?.message);
        throw new Error(res.data?.message || "Đăng nhập bằng Facebook thất bại");
      }

      const { accessToken, refreshToken, user } = res.data.data;

      if (!accessToken || !refreshToken || !user) {
        logger.error("Missing required data in Facebook login response");
        throw new Error("Dữ liệu đăng nhập không hợp lệ");
      }

      user.fullName = user.displayName || user.fullName || `${user.firstName} ${user.lastName}`.trim();
      user.avatarUrl = user.avatarUrl || null;

      // IMPORTANT: Set state BEFORE saving tokens to prevent race condition
      setUser(user);
      const rolesArray = user.roles?.map((r) => r.name || r) || [];
      setRoles(rolesArray);
      setIsAuthenticated(true);
      setIsGuest(false);
      setLoading(false);

      // Now save tokens
      tokenStorage.setTokens({ accessToken, refreshToken });

      // Use window.location.href instead of navigate to prevent state reset
      // Check for any admin role: SuperAdmin, ContentAdmin, FinanceAdmin, or Admin
      const isAdmin = rolesArray.some((roleName) => {
        const normalizedRole = typeof roleName === 'string' ? roleName : roleName?.name || roleName;
        return normalizedRole === "SuperAdmin" ||
          normalizedRole === "ContentAdmin" ||
          normalizedRole === "FinanceAdmin" ||
          normalizedRole === "Admin";
      });

      const redirectPath = isAdmin ? "/admin" : "/home";
      window.location.href = redirectPath;
    } catch (error) {
      logger.error("AuthContext.facebookLogin ERROR:", error);
      setIsSocialLoginInProgress(false);
      throw error; // Re-throw để component có thể catch
    }
  }, []);

  // ===== GUEST =====
  const loginAsGuest = useCallback((navigate) => {
    try {
      // Clear all tokens and user data
      tokenStorage.clear();

      // Reset all auth state
      setUser(null);
      setRoles([]);
      setIsAuthenticated(false);
      setIsGuest(true);

      // Navigate to home
      navigate("/home");
    } catch (error) {
      logger.error("Login as guest error:", error);
      // Still try to navigate even if there's an error
      navigate("/home");
    }
  }, []);

  // ===== LOGOUT =====
  const logout = useCallback(async (navigate) => {
    try {
      const rt = tokenStorage.getRefreshToken();
      if (rt) {
        await authService.logout(rt);
      }
    } catch (_) {
      // ignore errors on logout
    } finally {
      tokenStorage.clear();
      setUser(null);
      setRoles([]);
      setIsAuthenticated(false);
      setIsGuest(true);
      navigate("/login");
    }
  }, []);

  // ===== REFRESH USER =====
  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getProfile();
      const userData = response.data.data;
      userData.fullName = userData.displayName || userData.fullName || `${userData.firstName} ${userData.lastName}`.trim();
      userData.avatarUrl = userData.avatarUrl || null;
      setUser(userData);
      setRoles(userData.roles?.map((r) => r.name) || []);
    } catch (error) {
      logger.error("Error refreshing user:", error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        isAuthenticated,
        isGuest,
        loading,
        login,
        googleLogin,
        facebookLogin,
        loginAsGuest,
        logout,
        refreshUser,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
