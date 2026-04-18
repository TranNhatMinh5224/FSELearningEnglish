import axiosClient from "./axiosClient";

export const policyService = {
  /**
   * Lấy danh sách toàn bộ chính sách
   */
  getAllPolicies: async () => {
    return await axiosClient.get("/admin/policy");
  },

  /**
   * Lấy chi tiết chính sách theo ID
   */
  getPolicyById: async (id) => {
    return await axiosClient.get(`/admin/policy/${id}`);
  },

  /**
   * Tạo mới chính sách
   */
  createPolicy: async (data) => {
    return await axiosClient.post("/admin/policy", data);
  },

  /**
   * Cập nhật chính sách
   */
  updatePolicy: async (id, data) => {
    return await axiosClient.put(`/admin/policy/${id}`, data);
  },

  /**
   * Xóa chính sách
   */
  deletePolicy: async (id) => {
    return await axiosClient.delete(`/admin/policy/${id}`);
  },
};
