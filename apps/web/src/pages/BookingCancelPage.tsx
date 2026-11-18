import { useSearchParams, Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { buttonVariants } from "@nomadhome/ui";

export function BookingCancelPage() {
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get("listingId");

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-card border-2 border-border bg-surface-raised text-fg">
        <div className="p-6 md:p-8">
          <span
            aria-hidden="true"
            className="mb-5 flex h-16 w-16 shrink-0 items-center justify-center border-2 border-border text-fg"
          >
            <svg
              viewBox="0 0 32 32"
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="square"
              strokeLinejoin="miter"
              focusable={false}
            >
              <path d="M8 16H24" />
            </svg>
          </span>
          <h1 className="m-0 mb-3 break-words text-3xl font-black leading-[0.95] tracking-[-0.03em] text-fg">
            {t("booking.ui.cancel_title")}
          </h1>
          <p className="m-0 break-words text-base text-fg-muted">
            {t("booking.ui.cancel_message")}
          </p>
        </div>
        <div className="rounded-b-[2px] border-t-2 border-border bg-surface-inset p-4 md:px-8">
          {listingId ? (
            <Link
              to={`/listings/${listingId}`}
              className={`${buttonVariants({ variant: "secondary" })} w-full sm:w-auto`}
            >
              {t("booking.ui.back_to_listing")}
            </Link>
          ) : (
            <Link
              to="/search"
              className={`${buttonVariants({ variant: "secondary" })} w-full sm:w-auto`}
            >
              {t("booking.ui.back_to_search")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
