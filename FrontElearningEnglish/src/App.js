import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./Routes";
import { EnumProvider } from "./Context/EnumContext";
import { ThemeProvider } from "./Context/ThemeContext";
import { AssetProvider } from "./Context/AssetContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Components/Common/ModalFix/ModalFix.css";
import "./Components/Common/Modal/BaseModal.css";

// React Query
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Initialize QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <EnumProvider>
            <AssetProvider>
              <AppRoutes />
              <ToastContainer position="top-right" autoClose={3000} />
            </AssetProvider>
          </EnumProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
