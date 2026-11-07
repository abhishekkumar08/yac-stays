import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { NotificationProvider, ThemeProvider } from "@kasumi/ui";
import "@kasumi/ui/font";
import "leaflet/dist/leaflet.css";
import "@/index.css";
import "@/brand/theme.css";
import { App } from "@/App.jsx";
import { AuthProvider } from "@/lib/auth.jsx";
import { SavedProvider } from "@/lib/saved.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider defaultMaterial="solid">
      <NotificationProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <SavedProvider>
              <App />
            </SavedProvider>
          </AuthProvider>
        </BrowserRouter>
      </NotificationProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
