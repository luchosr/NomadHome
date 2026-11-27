import { useState, type KeyboardEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { Button, Skeleton } from "@nomadhome/ui";
import { adminApi, type AdminListing } from "../api/admin.js";
import { ListingStatusTag } from "../components/ListingStatusTag.js";
import { PageWrapper } from "../components/PageWrapper.js";
import { ServerErrorAlert } from "../components/ServerErrorAlert.js";
import { getDisplayMessage } from "../api/client.js";

function listingTypeLabel(type: AdminListing["type"]): string {
  return type === "PROPERTY" ? t("host.listings.type_property") : t("host.listings.type_workspace");
}

function StatePanel({ children }: { children: string }) {
  return (
    <div
      role="alert"
      className="mx-auto flex min-w-0 max-w-[36rem] items-start gap-4 rounded-card border-2 border-solid border-danger bg-danger-bg p-6"
    >
      <span
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-danger bg-danger text-fg-inverse"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="square"
          strokeLinejoin="miter"
          focusable={false}
        >
          <path d="M12 5v9M12 18v1" />
        </svg>
      </span>
      <h1 className="m-0 min-w-0 break-words text-2xl font-bold leading-tight text-danger">
        {children}
      </h1>
    </div>
  );
}

/** A held Enter or Space must not toggle the action back and forth. */
function ignoreKeyRepeat(event: KeyboardEvent) {
  if (event.repeat && (event.key === "Enter" || event.key === " ")) event.preventDefault();
}

export function AdminListingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "listings"],
    queryFn: () => adminApi.listListings(),
  });

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const runAction = async (id: string, action: (id: string) => Promise<unknown>) => {
    if (pendingId !== null) return;
    setPendingId(id);
    setActionError(null);
    try {
      await action(id);
      void queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
    } catch (err) {
      setActionError(getDisplayMessage(err));
    } finally {
      setPendingId(null);
    }
  };

  const handleDisable = (id: string) => runAction(id, (i) => adminApi.disableListing(i));
  const handleEnable = (id: string) => runAction(id, (i) => adminApi.enableListing(i));

  const renderAction = (listing: AdminListing, className: string) =>
    listing.status !== "DISABLED" ? (
      <Button
        variant="destructive"
        className={className}
        aria-disabled={pendingId === listing.id}
        onKeyDown={ignoreKeyRepeat}
        onClick={() => void handleDisable(listing.id)}
      >
        {t("admin.listings.disable")}
      </Button>
    ) : (
      <Button
        variant="secondary"
        className={className}
        aria-disabled={pendingId === listing.id}
        onKeyDown={ignoreKeyRepeat}
        onClick={() => void handleEnable(listing.id)}
      >
        {t("admin.listings.enable")}
      </Button>
    );

  if (isLoading) {
    return (
      <PageWrapper>
        <div aria-busy="true">
          <Skeleton className="mb-6 h-8 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-border-muted pb-3">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/6" />
                <Skeleton className="h-4 w-1/6" />
                <Skeleton className="h-4 w-1/5" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-11 w-20" />
              </div>
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (error || !data) {
    return (
      <PageWrapper>
        <StatePanel>{t("error.generic.unexpected")}</StatePanel>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <h1 className="m-0 mb-6 text-3xl font-black leading-solid text-fg md:text-4xl">
        {t("admin.listings.title")}
      </h1>

      <ServerErrorAlert error={actionError} className="mb-4" />

      {data.data.length === 0 ? (
        <div className="rounded-card border-2 border-dashed border-border bg-surface-raised px-6 py-12">
          <p className="m-0 text-fg-muted">{t("admin.listings.no_listings")}</p>
        </div>
      ) : (
        <>
          <ul className="m-0 flex list-none flex-col gap-4 p-0 sm:hidden">
            {data.data.map((listing: AdminListing) => (
              <li
                key={listing.id}
                className="min-w-0 rounded-card border-2 border-border bg-surface-raised p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="m-0 break-words font-bold text-fg">{listing.title}</p>
                    <p className="m-0 mt-1 break-words text-sm text-fg-muted">
                      {listingTypeLabel(listing.type)}
                      {" · "}
                      {listing.city}
                    </p>
                  </div>
                  <ListingStatusTag status={listing.status} />
                </div>
                <p className="m-0 mt-3 break-all text-sm text-fg-muted">{listing.host.email}</p>
                <div className="mt-4">{renderAction(listing, "w-full sm:w-auto")}</div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border text-left">
                  <th className="pb-2 pr-4 font-bold text-fg">{t("admin.listings.title_col")}</th>
                  <th className="pb-2 pr-4 font-bold text-fg">{t("admin.listings.type_col")}</th>
                  <th className="pb-2 pr-4 font-bold text-fg">{t("admin.listings.city_col")}</th>
                  <th className="pb-2 pr-4 font-bold text-fg">{t("admin.listings.host_col")}</th>
                  <th className="pb-2 pr-4 font-bold text-fg">{t("admin.listings.status_col")}</th>
                  <th className="pb-2 pr-1 font-bold text-fg">{t("admin.listings.actions_col")}</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((listing: AdminListing) => (
                  <tr key={listing.id} className="border-b border-border-muted last:border-0">
                    <td className="py-3 pr-4 text-fg">
                      <div className="max-w-[18rem] [overflow-wrap:anywhere]">{listing.title}</div>
                    </td>
                    <td className="py-3 pr-4 text-fg-muted">{listingTypeLabel(listing.type)}</td>
                    <td className="py-3 pr-4 text-fg-muted">
                      <div className="max-w-[10rem] [overflow-wrap:anywhere]">{listing.city}</div>
                    </td>
                    <td className="py-3 pr-4 text-fg-muted">
                      <div className="max-w-[14rem] [overflow-wrap:anywhere]">
                        {listing.host.email}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <ListingStatusTag status={listing.status} />
                    </td>
                    <td className="whitespace-nowrap py-3 pr-1">{renderAction(listing, "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageWrapper>
  );
}
