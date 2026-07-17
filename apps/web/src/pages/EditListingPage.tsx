import { useParams } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { Badge, Button, Card } from "@nomadhome/ui";
import type { HostListing } from "../api/host.js";
import { useEditListing } from "../hooks/useEditListing.js";
import { useListingPhotos } from "../hooks/useListingPhotos.js";
import { useListingAvailability } from "../hooks/useListingAvailability.js";
import { ListingDetailsForm } from "../components/ListingDetailsForm.js";
import { ListingPhotosCard } from "../components/ListingPhotosCard.js";
import { ListingAvailabilityCard } from "../components/ListingAvailabilityCard.js";

function statusTone(status: HostListing["status"]): "neutral" | "success" | "danger" {
  if (status === "PUBLISHED") return "success";
  if (status === "DISABLED") return "danger";
  return "neutral";
}

function statusLabel(status: HostListing["status"]): string {
  if (status === "PUBLISHED") return t("host.listings.status_published");
  if (status === "DISABLED") return t("host.listings.status_disabled");
  return t("host.listings.status_draft");
}

export function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const {
    listing,
    isLoading,
    form,
    selectedAmenities,
    toggleAmenity,
    save,
    saveError,
    publishError,
    publish,
    unpublish,
  } = useEditListing(id);
  const photos = useListingPhotos(id);
  const availability = useListingAvailability(id);

  if (isLoading) return <p className="text-fg-3">Loading...</p>;
  if (!listing)
    return (
      <p role="alert" className="text-danger">
        {t("error.generic.unexpected")}
      </p>
    );

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-4 py-8">
      <h1 className="text-2xl font-bold text-fg-1">{t("host.listings.edit_title")}</h1>

      <div className="flex flex-wrap items-center gap-4">
        <Badge tone={statusTone(listing.status)}>{statusLabel(listing.status)}</Badge>
        {listing.status !== "PUBLISHED" ? (
          <Button onClick={publish}>{t("host.listings.publish")}</Button>
        ) : (
          <Button variant="secondary" onClick={unpublish}>
            {t("host.listings.unpublish")}
          </Button>
        )}
        {publishError && (
          <p role="alert" className="text-sm text-danger">
            {publishError}
          </p>
        )}
      </div>

      <Card>
        <ListingDetailsForm
          form={form}
          selectedAmenities={selectedAmenities}
          toggleAmenity={toggleAmenity}
          save={save}
          saveError={saveError}
        />
      </Card>

      <ListingPhotosCard {...photos} />

      <ListingAvailabilityCard {...availability} />
    </div>
  );
}
