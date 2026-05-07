import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Theme/bootstrap-override.css";
import "./Theme/responsive-typography.css";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./Context/AuthContext";
import { StreakProvider } from "./Context/StreakContext";
import { NotificationProvider } from "./Context/NotificationContext";
import { HelmetProvider } from "react-helmet-async";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <StreakProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </StreakProvider>
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);
