import { Resend } from "resend";
import type {
  EmailService,
  CancellationEmailPayload,
  BookingConfirmationPayload,
} from "./email.service.js";

const FROM_ADDRESS = process.env["EMAIL_FROM"] ?? "NomadHome <onboarding@resend.dev>";

export class ResendEmailService implements EmailService {
  private readonly resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async sendVerificationEmail(to: string, rawToken: string): Promise<void> {
    await this.resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: "Verify your NomadHome account",
      html: `<p>Click the link below to verify your email:</p>
             <p><a href="${process.env["APP_URL"]}/verify?token=${rawToken}">Verify email</a></p>`,
    });
  }

  async sendCancellationToHost(payload: CancellationEmailPayload): Promise<void> {
    await this.resend.emails.send({
      from: FROM_ADDRESS,
      to: payload.hostEmail,
      subject: `Booking cancelled: ${payload.listingTitle}`,
      html: `<p>Hi ${payload.hostName},</p>
             <p>The booking for <strong>${payload.listingTitle}</strong>
             (${payload.checkIn} → ${payload.checkOut}) has been cancelled.</p>
             <p>Booking ID: ${payload.bookingId}</p>`,
    });
  }

  async sendBookingConfirmation(payload: BookingConfirmationPayload): Promise<void> {
    await this.resend.emails.send({
      from: FROM_ADDRESS,
      to: payload.guestEmail,
      subject: `Booking confirmed: ${payload.listingTitle}`,
      html: `<p>Your booking is confirmed!</p>
             <p><strong>${payload.listingTitle}</strong><br/>
             ${payload.checkIn} → ${payload.checkOut}</p>
             <p>Booking ID: ${payload.bookingId}</p>`,
    });

    await this.resend.emails.send({
      from: FROM_ADDRESS,
      to: payload.hostEmail,
      subject: `New booking: ${payload.listingTitle}`,
      html: `<p>Hi ${payload.hostName}, you have a new booking for
             <strong>${payload.listingTitle}</strong>
             (${payload.checkIn} → ${payload.checkOut}).</p>
             <p>Booking ID: ${payload.bookingId}</p>`,
    });
  }
}
