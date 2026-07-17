import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { t } from "@nomadhome/shared";
import { hostApi, type CreateListingInput } from "../api/host.js";
import { extractApiMessage } from "../api/client.js";

export type ListingFormValues = Omit<CreateListingInput, "amenityCodes">;

export function useEditListing(id: string | undefined) {
  const queryClient = useQueryClient();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["host", "listings", id],
    queryFn: () => hostApi.getOne(id!),
    enabled: !!id,
  });

  const form = useForm<ListingFormValues>();
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  useEffect(() => {
    if (!listing) return;
    form.reset({
      title: listing.title,
      description: listing.description,
      type: listing.type,
      city: listing.city,
      country: listing.country,
      addressLine: listing.addressLine,
      capacity: listing.capacity,
      nightlyRateCents: listing.nightlyRateCents,
      currency: listing.currency,
    });
    setSelectedAmenities(new Set(listing.amenities.map((a) => a.amenityCode)));
  }, [listing, form]);

  const toggleAmenity = (code: string) => {
    setSelectedAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const save = form.handleSubmit(async (values) => {
    setSaveError(null);
    try {
      await hostApi.update(id!, {
        ...values,
        capacity: Number(values.capacity),
        nightlyRateCents: Number(values.nightlyRateCents),
        amenityCodes: Array.from(selectedAmenities),
      });
      await queryClient.invalidateQueries({ queryKey: ["host", "listings", id] });
    } catch {
      setSaveError(t("error.generic.unexpected"));
    }
  });

  const publish = async () => {
    setPublishError(null);
    try {
      await hostApi.publish(id!);
      await queryClient.invalidateQueries({ queryKey: ["host", "listings", id] });
    } catch (err) {
      setPublishError(extractApiMessage(err) ?? t("error.generic.unexpected"));
    }
  };

  const unpublish = async () => {
    setPublishError(null);
    try {
      await hostApi.unpublish(id!);
      await queryClient.invalidateQueries({ queryKey: ["host", "listings", id] });
    } catch {
      setPublishError(t("error.generic.unexpected"));
    }
  };

  return {
    listing,
    isLoading,
    form,
    selectedAmenities,
    toggleAmenity,
    save,
    publish,
    unpublish,
    saveError,
    publishError,
  };
}
