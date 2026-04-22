import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "./apiConfig";

export const walletService = {
  /**
   * Lấy số dư ví hiện tại của người dùng
   */
  getBalance: () => axiosClient.get(API_ENDPOINTS.WALLET.GET_BALANCE),

  /**
   * Lấy lịch sử giao dịch ví
   */
  getTransactionHistory: () => axiosClient.get(API_ENDPOINTS.WALLET.GET_TRANSACTIONS),
};
