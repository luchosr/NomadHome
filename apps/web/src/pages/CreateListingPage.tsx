import { t } from "@nomadhome/shared";
import { CreateListingForm } from "../components/CreateListingForm.js";
import { useCreateListing } from "../hooks/useCreateListing.js";

export function CreateListingPage() {
  const { form, selectedAmenities, toggleAmenity, submit, serverError } = useCreateListing();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-fg-1">{t("host.listings.create_title")}</h1>
      <CreateListingForm
        form={form}
        selectedAmenities={selectedAmenities}
        toggleAmenity={toggleAmenity}
        submit={submit}
        serverError={serverError}
      />
    </div>
  );
}
