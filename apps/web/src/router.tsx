import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout.js";
import { ProtectedRoute } from "./components/ProtectedRoute.js";
import { RoleGuard } from "./components/RoleGuard.js";
import { HomePage } from "./pages/HomePage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";
import { SearchPage } from "./pages/SearchPage.js";
import { ListingDetailPage } from "./pages/ListingDetailPage.js";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/search", element: <SearchPage /> },
      { path: "/listings/:id", element: <ListingDetailPage /> },
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
