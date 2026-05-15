import axios from "axios";
import axiosClient from "./axiosClient";
import { API_BASE_URL } from "./BaseURL";

const publicAxios = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: false,
});

/**
 * Service để quản lý Asset Frontend từ backend
 */
const assetFrontendService = {
    /**
     * Lấy tất cả assets active (public - không cần auth)
     * GET: /api/public/asset-frontend
     */
    getAllActiveAssets: () => publicAxios.get(`/public/asset-frontend`, {
        headers: {
            Authorization: undefined,
            "X-Access-Token": undefined,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
        },
        params: {
            t: Date.now(),
        },
    }),

    // ========== ADMIN APIs (cần auth) ==========

    /**
     * Lấy tất cả assets (admin - cần auth)
     * GET: /api/admin/asset-frontend
     */
    getAllAssets: () => axiosClient.get("/admin/asset-frontend"),

    /**
     * Tạo asset mới (admin - cần auth)
     * POST: /api/admin/asset-frontend
     */
    createAsset: (data) => axiosClient.post("/admin/asset-frontend", data),

    /**
     * Cập nhật asset (admin - cần auth)
     * PUT: /api/admin/asset-frontend/{id}
     */
    updateAsset: (id, data) => axiosClient.put(`/admin/asset-frontend/${id}`, data),

    /**
     * Xóa asset (admin - cần auth)
     * DELETE: /api/admin/asset-frontend/{id}
     */
    deleteAsset: (id) => axiosClient.delete(`/admin/asset-frontend/${id}`),
};

export { assetFrontendService };
export default assetFrontendService;
