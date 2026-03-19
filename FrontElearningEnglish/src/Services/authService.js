import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "./apiConfig";

export const authService = {
  login: (data) => axiosClient.post(API_ENDPOINTS.AUTH.LOGIN, data),

  register: (data) => axiosClient.post(API_ENDPOINTS.AUTH.REGISTER, data),

  getProfile: () => axiosClient.get(API_ENDPOINTS.AUTH.PROFILE),

  logout: (refreshToken) =>
    axiosClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken }),

  // Deprecated: OAuth URLs are now built in frontend using env variables
  // getGoogleAuthUrl: () => axiosClient.get(API_ENDPOINTS.AUTH.GOOGLE_AUTH_URL),
  // getFacebookAuthUrl: () => axiosClient.get(API_ENDPOINTS.AUTH.FACEBOOK_AUTH_URL),

  googleLogin: (data) =>
    axiosClient.post(API_ENDPOINTS.AUTH.GOOGLE_LOGIN, data),

  facebookLogin: async (data) => {
    // Log to terminal (console.log outputs to terminal in Node.js/React)
    // Log to terminal (console.log outputs to terminal in Node.js/React)


    try {
      const response = await axiosClient.post(API_ENDPOINTS.AUTH.FACEBOOK_LOGIN, data);
      return response;
    } catch (error) {
      console.error("Facebook login error:", error);
      throw error;
    }
  },

  verifyEmail: (data) =>
    axiosClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, data),

  forgotPassword: (data) =>
    axiosClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data),

  verifyResetOtp: (data) =>
    axiosClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, data),

  resetPassword: (data) =>
    axiosClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data),

  updateProfile: (data) =>
    axiosClient.put(API_ENDPOINTS.AUTH.UPDATE_PROFILE, data),

  updateAvatar: (data) =>
    axiosClient.put(API_ENDPOINTS.AUTH.UPDATE_AVATAR, data),

  changePassword: (data) =>
    axiosClient.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data),
};
