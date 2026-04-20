import axios from "axios";
import { tokenStorage } from "../Utils/tokenStorage";
import { API_BASE_URL, AUTH_REFRESH_URL } from "./BaseURL";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==== REQUEST ====
axiosClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      config.headers["X-Access-Token"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ===== RESPONSE =====
let isRefreshing = false;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  queue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("refresh-token") &&
      !originalRequest.url?.includes("login")
    ) {
      if (isRefreshing) {
        console.warn(`[Axios] Request to ${originalRequest.url} queued while refreshing`);
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = tokenStorage.getRefreshToken();
        const expiredAccessToken = tokenStorage.getAccessToken();

        if (!refreshToken) {
          console.warn("[Axios] No refresh token found, skipping refresh attempt");
          throw error;
        }

        console.info("[Axios] Attempting to refresh token...");
        // Call refresh API with both refreshToken and current (expired) accessToken
        const res = await axios.post(
          AUTH_REFRESH_URL,
          { refreshToken, accessToken: expiredAccessToken }
        );

        // Backend wraps data in ServiceResponse<T>
        const { accessToken, refreshToken: newRefresh } = res?.data?.data || {};
        if (!accessToken || !newRefresh) {
          console.error("[Axios] Refresh response missing tokens", res?.data);
          throw new Error("Invalid refresh response");
        }

        console.info("[Axios] Token refreshed successfully");
        tokenStorage.setTokens({ accessToken, refreshToken: newRefresh });

        axiosClient.defaults.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        return axiosClient(originalRequest);
      } catch (err) {
        console.error("[Axios] Token refresh failed:", err.response?.status, err.message);
        processQueue(err, null);

        const hadTokens = tokenStorage.getAccessToken() || tokenStorage.getRefreshToken();

        // Chỉ xóa token và redirect nếu lỗi là 401/403 (Token thực sự vô hiệu)
        if (err.response?.status === 401 || err.response?.status === 403) {
          console.error("[Axios] Refresh token revoked or expired, clearing tokens");
          tokenStorage.clear();

          if (hadTokens) {
            const currentPath = window.location.pathname;
            const publicPaths = ['/welcome', '/login', '/register', '/home'];
            if (!publicPaths.includes(currentPath)) {
              window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
            }
          }
        }

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // For 401 errors that don't trigger token refresh (e.g., guest users)
    // Don't redirect if user is on a public page or home page
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const allowedPaths = ['/welcome', '/login', '/register', '/home'];
      const hasToken = tokenStorage.getAccessToken();

      // If no token and on allowed path, don't redirect (guest user)
      if (!hasToken && allowedPaths.includes(currentPath)) {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
