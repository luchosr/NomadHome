import { t } from "@nomadhome/shared";
import type { HostListing } from "../api/host.js";

type Status = HostListing["status"];

function statusLabel(status: Status): string {
  switch (status) {
    case "DRAFT":
      return t("host.listings.status_draft");
    case "PUBLISHED":
      return t("host.listings.status_published");
    case "DISABLED":
      return t("host.listings.status_disabled");
  }
}

const TAG_SHAPE: Record<Status, string> = {
  DRAFT: "border-dashed border-border text-fg",
  PUBLISHED: "border-solid border-border text-fg",
  DISABLED: "border-solid border-border-muted text-fg-muted line-through",
};

/** Listing status as shape plus text: dashed (not live), solid with a marker (live), struck through (off). */
export function ListingStatusTag({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-sm border-2 bg-surface-raised px-2 py-1 text-xs font-bold ${TAG_SHAPE[status]}`}
    >
      {status === "PUBLISHED" && <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-ink" />}
      {statusLabel(status)}
    </span>
  );
}
