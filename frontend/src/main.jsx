import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        containerStyle={{
          top: 60, // Push down from top
        }}
        toastOptions={{
          duration: 2500, // Shorter duration
          style: {
            background: "#1a1a1a",
            color: "#fff",
            border: "1px solid #facc15",
            cursor: "pointer", // Show it's clickable
          },
          success: {
            iconTheme: {
              primary: "#facc15",
              secondary: "#000",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
          // Make dismissible on click
          onClick: (event) => {
            const toastId = event.currentTarget.getAttribute("data-toast-id");
            if (toastId) toast.dismiss(toastId);
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
