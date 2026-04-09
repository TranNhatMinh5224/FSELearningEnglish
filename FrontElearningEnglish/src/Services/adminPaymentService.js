import axios from "axios";

const API_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

const adminPaymentService = {
    getFailedWebhooks: async () => {
        return await axios.get(`${API_URL}/admin/payments/failed-webhooks`, getAuthHeader());
    },

    retryWebhook: async (webhookId) => {
        return await axios.post(`${API_URL}/admin/payments/failed-webhooks/${webhookId}/retry`, {}, getAuthHeader());
    }
};

export default adminPaymentService;
