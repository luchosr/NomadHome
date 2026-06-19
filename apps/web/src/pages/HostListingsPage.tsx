import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { Badge, Button, Card } from "@nomadhome/ui";
import { hostApi, type HostListing } from "../api/host.js";

function statusTone(status: HostListing["status"]): "neutral" | "success" | "danger" {
  switch (status) {
    case "DRAFT":
      return "neutral";
    case "PUBLISHED":
      return "success";
    case "DISABLED":
      return "danger";
  }
}

function statusLabel(status: HostListing["status"]): string {
  switch (status) {
    case "DRAFT":
      return t("host.listings.status_draft");
    case "PUBLISHED":
      return t("host.listings.status_published");
    case "DISABLED":
      return t("host.listings.status_disabled");
  }
}

export function HostListingsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["host", "listings"],
    queryFn: () => hostApi.listMine(),
  });

  if (isLoading) return <p className="text-fg-3">Loading...</p>;

  if (error || !data) {
    return (
      <p role="alert" className="text-danger">
        {t("error.generic.unexpected")}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-fg-1">{t("host.listings.title")}</h1>
        <Link to="/host/listings/new">
          <Button>{t("host.listings.new_listing")}</Button>
        </Link>
      </div>

      {data.length === 0 ? (
        <p className="text-fg-2">{t("host.listings.no_listings")}</p>
      ) : (
        <div className="space-y-4">
          {data.map((listing) => (
            <Card key={listing.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-fg-1">{listing.title}</p>
                  <p className="mt-1 text-sm text-fg-3">
                    {listing.type === "PROPERTY"
                      ? t("host.listings.type_property")
                      : t("host.listings.type_workspace")}
                    {" · "}
                    {listing.city}, {listing.country}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={statusTone(listing.status)}>{statusLabel(listing.status)}</Badge>
                  <Link to={`/host/listings/${listing.id}/edit`}>
                    <Button variant="secondary">{t("host.listings.edit")}</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
