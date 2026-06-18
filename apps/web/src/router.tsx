import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout.js";
import { ProtectedRoute } from "./components/ProtectedRoute.js";
import { RoleGuard } from "./components/RoleGuard.js";
import { HomePage } from "./pages/HomePage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      {
        path: "/host/*",
        element: (
          <ProtectedRoute>
            <RoleGuard role="host">
              <div>Host dashboard — coming soon</div>
            </RoleGuard>
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/*",
        element: (
          <ProtectedRoute>
            <RoleGuard role="admin">
              <div>Admin dashboard — coming soon</div>
            </RoleGuard>
          </ProtectedRoute>
        ),
      },
      {
        path: "/bookings",
        element: (
          <ProtectedRoute>
            <div>My bookings — coming soon</div>
          </ProtectedRoute>
        ),
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
