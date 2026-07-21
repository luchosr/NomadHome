import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/auth.js";
import { router } from "./router.js";
import "./index.css";

const queryClient = new QueryClient();

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} hydrateFallbackElement={null} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
