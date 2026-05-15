import { lazy, Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./Routes";
import { EnumProvider } from "./Context/EnumContext";
import { ThemeProvider } from "./Context/ThemeContext";
import { AssetProvider } from "./Context/AssetContext";
import GoogleAnalytics from "./Components/Common/GoogleAnalytics/GoogleAnalytics";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Components/Common/ModalFix/ModalFix.css";
import "./Components/Common/Modal/BaseModal.css";

// React Query
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Conditional ChatBot Widget
import ConditionalChatBot from "./Components/Common/ChatBotWidget/ConditionalChatBot";

// Initialize QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <GoogleAnalytics />
        <ThemeProvider>
          <EnumProvider>
            <AssetProvider>
              <AppRoutes />
              <ToastContainer position="top-right" autoClose={3000} />
              
              {/* Chỉ hiển thị Chatbot cho User (không hiện cho Admin/Teacher) */}
              <Suspense fallback={null}>
                <ConditionalChatBot />
              </Suspense>
            </AssetProvider>
          </EnumProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
