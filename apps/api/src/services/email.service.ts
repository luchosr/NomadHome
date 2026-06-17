export interface CancellationEmailPayload {
  hostEmail: string;
  hostName: string;
  guestEmail: string;
  listingTitle: string;
  checkIn: string;
  checkOut: string;
  bookingId: string;
}

/** Transactional email port. The real Resend adapter is a separate infra ticket. */
export interface EmailService {
  sendVerificationEmail(to: string, rawToken: string): Promise<void>;
  sendCancellationToHost(payload: CancellationEmailPayload): Promise<void>;
}

/**
 * Default adapter: logs the dispatch instead of sending.
 *
 * ponytail: stub — real delivery (Resend) is deliberately deferred per the
 * add-identity-registration proposal. Swap this binding when that ticket lands.
 */
export class LoggingEmailService implements EmailService {
  async sendVerificationEmail(to: string, rawToken: string): Promise<void> {
    console.info(`[email] verification queued for ${to} (token ${rawToken.slice(0, 8)}…)`);
  }

  async sendCancellationToHost(payload: CancellationEmailPayload): Promise<void> {
    console.info(
      `[email] cancellation notice queued for host ${payload.hostEmail} (booking ${payload.bookingId})`,
    );
  }
}
