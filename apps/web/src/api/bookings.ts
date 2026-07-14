import { apiFetch } from "./client.js";

export interface BookingCreated {
  id: string;
  listingId: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalCents: number;
}

export interface BookingWithListing {
  id: string;
  listingId: string;
  guestId: string;
  hostId: string;
  checkIn: string;
  checkOut: string;
  nightlyRateCents: number;
  totalCents: number;
  status: "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  cancellationReason: string | null;
  createdAt: string;
  listing: { title: string };
}

export interface BookingsPage {
  data: BookingWithListing[];
  total: number;
  page: number;
  limit: number;
}

export interface HostUpcomingBooking {
  id: string;
  checkIn: string;
  checkOut: string;
  listing: { title: string };
  guest: { email: string };
}

export const bookingsApi = {
  create(input: { listingId: string; checkIn: string; checkOut: string }): Promise<BookingCreated> {
    return apiFetch("/bookings", { method: "POST", body: JSON.stringify(input) });
  },
  checkout(bookingId: string): Promise<{ url: string; sessionId: string }> {
    return apiFetch(`/bookings/${bookingId}/checkout`, { method: "POST" });
  },
  listMine(page = 1): Promise<BookingsPage> {
    return apiFetch(`/bookings/me?page=${page}&limit=20`);
  },
  cancel(bookingId: string, reason?: string): Promise<BookingWithListing> {
    return apiFetch(`/bookings/${bookingId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ cancellationReason: reason }),
    });
  },
  review(bookingId: string, input: { rating: number; text?: string }): Promise<unknown> {
    return apiFetch(`/bookings/${bookingId}/review`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  getById(bookingId: string): Promise<BookingWithListing> {
    return apiFetch(`/bookings/${bookingId}`);
  },
  hostUpcoming(): Promise<HostUpcomingBooking[]> {
    return apiFetch("/bookings/host-upcoming");
  },
};
