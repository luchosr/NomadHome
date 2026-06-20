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
import { BookingFormPage } from "./pages/BookingFormPage.js";
import { BookingSuccessPage } from "./pages/BookingSuccessPage.js";
import { BookingCancelPage } from "./pages/BookingCancelPage.js";
import { MyBookingsPage } from "./pages/MyBookingsPage.js";
import { HostListingsPage } from "./pages/HostListingsPage.js";
import { CreateListingPage } from "./pages/CreateListingPage.js";
import { EditListingPage } from "./pages/EditListingPage.js";
import { HostUpcomingPage } from "./pages/HostUpcomingPage.js";
import { AdminUsersPage } from "./pages/AdminUsersPage.js";
import { AdminListingsPage } from "./pages/AdminListingsPage.js";

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
        path: "/listings/:id/book",
        element: (
          <ProtectedRoute>
            <BookingFormPage />
          </ProtectedRoute>
        ),
      },
      { path: "/booking/success", element: <BookingSuccessPage /> },
      { path: "/booking/cancel", element: <BookingCancelPage /> },
      {
        path: "/host/listings",
        element: (
          <ProtectedRoute>
            <RoleGuard role="host">
              <HostListingsPage />
            </RoleGuard>
          </ProtectedRoute>
        ),
      },
      {
        path: "/host/listings/new",
        element: (
          <ProtectedRoute>
            <RoleGuard role="host">
              <CreateListingPage />
            </RoleGuard>
          </ProtectedRoute>
        ),
      },
      {
        path: "/host/listings/:id/edit",
        element: (
          <ProtectedRoute>
            <RoleGuard role="host">
              <EditListingPage />
            </RoleGuard>
          </ProtectedRoute>
        ),
      },
      {
        path: "/host/upcoming",
        element: (
          <ProtectedRoute>
            <RoleGuard role="host">
              <HostUpcomingPage />
            </RoleGuard>
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/users",
        element: (
          <ProtectedRoute>
            <RoleGuard role="admin">
              <AdminUsersPage />
            </RoleGuard>
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/listings",
        element: (
          <ProtectedRoute>
            <RoleGuard role="admin">
              <AdminListingsPage />
            </RoleGuard>
          </ProtectedRoute>
        ),
      },
      {
        path: "/bookings",
        element: (
          <ProtectedRoute>
            <MyBookingsPage />
          </ProtectedRoute>
        ),
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
