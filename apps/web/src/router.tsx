import { createBrowserRouter, Outlet } from "react-router-dom";
import { Layout } from "./components/Layout.js";
import { ProtectedRoute } from "./components/ProtectedRoute.js";
import { RoleGuard } from "./components/RoleGuard.js";
import { ErrorPage } from "./pages/ErrorPage.js";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      // Public routes
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

      // Protected routes — guard runs statically before any chunk is downloaded
      {
        element: (
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          {
            path: "/become-host",
            lazy: async () => {
              const { BecomeHostPage } = await import("./pages/BecomeHostPage.js");
              return { Component: BecomeHostPage };
            },
          },
          {
            path: "/listings/:id/book",
            lazy: async () => {
              const { BookingFormPage } = await import("./pages/BookingFormPage.js");
              return { Component: BookingFormPage };
            },
          },
          {
            path: "/bookings",
            lazy: async () => {
              const { MyBookingsPage } = await import("./pages/MyBookingsPage.js");
              return { Component: MyBookingsPage };
            },
          },

          // Host-only routes
          {
            element: (
              <RoleGuard role="host">
                <Outlet />
              </RoleGuard>
            ),
            children: [
              {
                path: "/host/listings",
                lazy: async () => {
                  const { HostListingsPage } = await import("./pages/HostListingsPage.js");
                  return { Component: HostListingsPage };
                },
              },
              {
                path: "/host/listings/new",
                lazy: async () => {
                  const { CreateListingPage } = await import("./pages/CreateListingPage.js");
                  return { Component: CreateListingPage };
                },
              },
              {
                path: "/host/listings/:id/edit",
                lazy: async () => {
                  const { EditListingPage } = await import("./pages/EditListingPage.js");
                  return { Component: EditListingPage };
                },
              },
              {
                path: "/host/upcoming",
                lazy: async () => {
                  const { HostUpcomingPage } = await import("./pages/HostUpcomingPage.js");
                  return { Component: HostUpcomingPage };
                },
              },
            ],
          },

          // Admin-only routes
          {
            element: (
              <RoleGuard role="admin">
                <Outlet />
              </RoleGuard>
            ),
            children: [
              {
                path: "/admin/users",
                lazy: async () => {
                  const { AdminUsersPage } = await import("./pages/AdminUsersPage.js");
                  return { Component: AdminUsersPage };
                },
              },
              {
                path: "/admin/listings",
                lazy: async () => {
                  const { AdminListingsPage } = await import("./pages/AdminListingsPage.js");
                  return { Component: AdminListingsPage };
                },
              },
            ],
          },
        ],
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
