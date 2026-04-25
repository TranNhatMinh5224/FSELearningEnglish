import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "./apiConfig";

export const paymentService = {
    processPayment: (data) => axiosClient.post(API_ENDPOINTS.PAYMENTS.PROCESS, data),


    /**
     * Lấy lịch sử giao dịch với phân trang
     * @param {number} pageNumber - Số trang (mặc định 1)
     * @param {number} pageSize - Số lượng bản ghi mỗi trang (mặc định 20)
     */
    getHistory: (pageNumber = 1, pageSize = 20) => 
        axiosClient.get(API_ENDPOINTS.PAYMENTS.HISTORY, {
            params: { pageNumber, pageSize }
        }),

    getTransactionDetail: (paymentId) =>
        axiosClient.get(API_ENDPOINTS.PAYMENTS.TRANSACTION_DETAIL(paymentId)),

    // PayOS payment verification/confirmation (polling)
    confirmPayOsPayment: (paymentId) =>
        axiosClient.post(API_ENDPOINTS.PAYMENTS.PAYOS_CONFIRM(paymentId)),

    // PayOS payment link creation
    createPayOsLink: (paymentId) =>
        axiosClient.post(API_ENDPOINTS.PAYMENTS.PAYOS_CREATE_LINK(paymentId)),

    // Cancel payment
    cancelPayment: (paymentId) =>
        axiosClient.post(API_ENDPOINTS.PAYMENTS.CANCEL(paymentId)),
};
