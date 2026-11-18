import { useParams } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { Button, Card, Skeleton } from "@nomadhome/ui";
import { useEditListing } from "../hooks/useEditListing.js";
import { useListingPhotos } from "../hooks/useListingPhotos.js";
import { useListingAvailability } from "../hooks/useListingAvailability.js";
import { ListingDetailsForm } from "../components/ListingDetailsForm.js";
import { ListingPhotosCard } from "../components/ListingPhotosCard.js";
import { ListingAvailabilityCard } from "../components/ListingAvailabilityCard.js";
import { ListingStatusTag } from "../components/ListingStatusTag.js";
import { ServerErrorAlert } from "../components/ServerErrorAlert.js";

// A solid 2px border replaces the secondary Button's 1px border plus inset ring (a box shadow).
const FLAT_SECONDARY = "border-2 ![box-shadow:none]";

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

  if (isLoading) {
    return (
      <div aria-busy="true" className="mx-auto max-w-2xl space-y-10 px-4 py-8">
        <Skeleton className="h-8 w-56" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-11 w-28" />
        </div>
        <Card>
          <div className="space-y-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Card>
        <Card>
          <div className="space-y-3">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Card>
        <Card>
          <div className="space-y-3">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-16 w-full" />
          </div>
        </Card>
      </div>
    );
  }
  if (!listing)
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <StatePanel>{t("error.generic.unexpected")}</StatePanel>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-4 py-8">
      <h1 className="m-0 text-3xl font-black leading-solid text-fg md:text-4xl">
        {t("host.listings.edit_title")}
      </h1>

      <div className="flex flex-wrap items-center gap-4">
        <ListingStatusTag status={listing.status} />
        {listing.status !== "PUBLISHED" ? (
          <Button className="min-h-11" onClick={publish}>
            {t("host.listings.publish")}
          </Button>
        ) : (
          <Button variant="secondary" className={`min-h-11 ${FLAT_SECONDARY}`} onClick={unpublish}>
            {t("host.listings.unpublish")}
          </Button>
        )}
        <ServerErrorAlert error={publishError} className="w-full" />
      </div>

      <Card>
        <ListingDetailsForm
          form={form}
          selectedAmenities={selectedAmenities}
          toggleAmenity={toggleAmenity}
          onSubmit={save}
          saveError={saveError}
        />
      </Card>

      <ListingPhotosCard {...photos} />

      <ListingAvailabilityCard {...availability} />
    </div>
  );
}
