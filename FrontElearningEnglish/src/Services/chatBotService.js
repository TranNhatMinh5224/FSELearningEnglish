import axiosClient from "./axiosClient";

const chatBotService = {
  /**
   * POST /api/public/chatbot/consult
   * Không cần auth - public endpoint
   */
  consult: async (prompt) => {
    const res = await axiosClient.post("/public/chatbot/consult", { prompt });
    return res.data;
  },
};

export default chatBotService;
