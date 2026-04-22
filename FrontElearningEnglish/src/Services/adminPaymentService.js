import axiosClient from "./axiosClient";

const adminPaymentService = {
    getFailedWebhooks: async () => {
        return await axiosClient.get("/admin/payments/failed-webhooks");
    },

    retryWebhook: async (webhookId) => {
        return await axiosClient.post(`/admin/payments/failed-webhooks/${webhookId}/retry`);
    },

    getTransactions: async (params) => {
        return await axiosClient.get("/admin/payments/transactions", {
            params
        });
    }
};

export default adminPaymentService;
