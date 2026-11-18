import { t } from "@nomadhome/shared";
import { CreateListingForm } from "../components/CreateListingForm.js";
import { useCreateListing } from "../hooks/useCreateListing.js";

export function CreateListingPage() {
  const { form, selectedAmenities, toggleAmenity, submit, serverError } = useCreateListing();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="m-0 mb-6 text-3xl font-black leading-solid text-fg md:text-4xl">
        {t("host.listings.create_title")}
      </h1>
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
