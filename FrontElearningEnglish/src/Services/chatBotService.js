import axiosClient from "./axiosClient";

const chatBotService = {
  /**
   * POST /api/user/chatbot/chat
   * Endpoint yêu cầu xác thực JWT
   * @param {string} message - Câu hỏi của người dùng
   */
  chat: (message) =>
    axiosClient.post(
      "/user/chatbot/chat",
      { message },
      {
        timeout: 30000,
      }
    ),

  /**
   * Phương thức cũ (consult) - có thể giữ lại nếu còn dùng chung
   */
  consult: async (prompt) => {
    const res = await axiosClient.post("/public/chatbot/consult", { prompt });
    return res.data;
  },
};

export default chatBotService;
