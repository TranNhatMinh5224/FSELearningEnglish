import axiosClient from "./axiosClient";

const chatBotService = {
  /**
   * POST /api/public/chatbot/consult
   * Không cần auth - public endpoint
   */
  consult: async (prompt) => {
    const res = await axiosClient.post(
      "/public/chatbot/consult",
      { prompt },
      {
        // Prevent requests from hanging forever when AI provider is slow
        timeout: 25000,
      }
    );
    return res.data;
  },
};

export default chatBotService;
