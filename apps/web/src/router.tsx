import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout.js";
import { ProtectedRoute } from "./components/ProtectedRoute.js";
import { RoleGuard } from "./components/RoleGuard.js";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        lazy: async () => {
          const { HomePage } = await import("./pages/HomePage.js");
          return { Component: HomePage };
        },
      },
      {
        path: "/login",
        lazy: async () => {
          const { LoginPage } = await import("./pages/LoginPage.js");
          return { Component: LoginPage };
        },
      },
      {
        path: "/register",
        lazy: async () => {
          const { RegisterPage } = await import("./pages/RegisterPage.js");
          return { Component: RegisterPage };
        },
      },
      {
        path: "/verify",
        lazy: async () => {
          const { VerifyEmailPage } = await import("./pages/VerifyEmailPage.js");
          return { Component: VerifyEmailPage };
        },
      },
      {
        path: "/become-host",
        lazy: async () => {
          const { BecomeHostPage } = await import("./pages/BecomeHostPage.js");
          return {
            element: (
              <ProtectedRoute>
                <BecomeHostPage />
              </ProtectedRoute>
            ),
          };
        },
      },
      {
        path: "/search",
        lazy: async () => {
          const { SearchPage } = await import("./pages/SearchPage.js");
          return { Component: SearchPage };
        },
      },
      {
        path: "/listings/:id",
        lazy: async () => {
          const { ListingDetailPage } = await import("./pages/ListingDetailPage.js");
          return { Component: ListingDetailPage };
        },
      },
      {
        path: "/listings/:id/book",
        lazy: async () => {
          const { BookingFormPage } = await import("./pages/BookingFormPage.js");
          return {
            element: (
              <ProtectedRoute>
                <BookingFormPage />
              </ProtectedRoute>
            ),
          };
        },
      },
      {
        path: "/booking/success",
        lazy: async () => {
          const { BookingSuccessPage } = await import("./pages/BookingSuccessPage.js");
          return { Component: BookingSuccessPage };
        },
      },
      {
        path: "/booking/cancel",
        lazy: async () => {
          const { BookingCancelPage } = await import("./pages/BookingCancelPage.js");
          return { Component: BookingCancelPage };
        },
      },
      {
        path: "/host/listings",
        lazy: async () => {
          const { HostListingsPage } = await import("./pages/HostListingsPage.js");
          return {
            element: (
              <ProtectedRoute>
                <RoleGuard role="host">
                  <HostListingsPage />
                </RoleGuard>
              </ProtectedRoute>
            ),
          };
        },
      },
      {
        path: "/host/listings/new",
        lazy: async () => {
          const { CreateListingPage } = await import("./pages/CreateListingPage.js");
          return {
            element: (
              <ProtectedRoute>
                <RoleGuard role="host">
                  <CreateListingPage />
                </RoleGuard>
              </ProtectedRoute>
            ),
          };
        },
      },
      {
        path: "/host/listings/:id/edit",
        lazy: async () => {
          const { EditListingPage } = await import("./pages/EditListingPage.js");
          return {
            element: (
              <ProtectedRoute>
                <RoleGuard role="host">
                  <EditListingPage />
                </RoleGuard>
              </ProtectedRoute>
            ),
          };
        },
      },
      {
        path: "/host/upcoming",
        lazy: async () => {
          const { HostUpcomingPage } = await import("./pages/HostUpcomingPage.js");
          return {
            element: (
              <ProtectedRoute>
                <RoleGuard role="host">
                  <HostUpcomingPage />
                </RoleGuard>
              </ProtectedRoute>
            ),
          };
        },
      },
      {
        path: "/admin/users",
        lazy: async () => {
          const { AdminUsersPage } = await import("./pages/AdminUsersPage.js");
          return {
            element: (
              <ProtectedRoute>
                <RoleGuard role="admin">
                  <AdminUsersPage />
                </RoleGuard>
              </ProtectedRoute>
            ),
          };
        },
      },
      {
        path: "/admin/listings",
        lazy: async () => {
          const { AdminListingsPage } = await import("./pages/AdminListingsPage.js");
          return {
            element: (
              <ProtectedRoute>
                <RoleGuard role="admin">
                  <AdminListingsPage />
                </RoleGuard>
              </ProtectedRoute>
            ),
          };
        },
      },
      {
        path: "/bookings",
        lazy: async () => {
          const { MyBookingsPage } = await import("./pages/MyBookingsPage.js");
          return {
            element: (
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            ),
          };
        },
      },
      {
        path: "*",
        lazy: async () => {
          const { NotFoundPage } = await import("./pages/NotFoundPage.js");
          return { Component: NotFoundPage };
        },
      },
    ],
  },
]);
