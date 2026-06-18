import { apiFetch } from "./client.js";

export interface BookingCreated {
  id: string;
  listingId: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalCents: number;
}

export const bookingsApi = {
  create(input: { listingId: string; checkIn: string; checkOut: string }): Promise<BookingCreated> {
    return apiFetch("/bookings", { method: "POST", body: JSON.stringify(input) });
  },
  checkout(bookingId: string): Promise<{ url: string; sessionId: string }> {
    return apiFetch(`/bookings/${bookingId}/checkout`, { method: "POST" });
  },
};
