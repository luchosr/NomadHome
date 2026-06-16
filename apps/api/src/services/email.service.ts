/** Transactional email port. The real Resend adapter is a separate infra ticket. */
export interface EmailService {
  sendVerificationEmail(to: string, rawToken: string): Promise<void>;
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
}
