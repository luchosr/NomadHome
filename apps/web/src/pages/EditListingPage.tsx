import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { t } from "@nomadhome/shared";
import { Badge, Button, Card, Input } from "@nomadhome/ui";
import { hostApi, type HostListing, type CreateListingInput } from "../api/host.js";
import { photoApi } from "../api/photos.js";
import { availabilityApi } from "../api/availability.js";
import { ApiError } from "../api/client.js";

const AMENITIES = [
  { code: "wifi", label: "Wi-Fi" },
  { code: "kitchen", label: "Kitchen" },
  { code: "workspace_desk", label: "Dedicated desk" },
  { code: "meeting_room", label: "Meeting room" },
  { code: "phone_booth", label: "Phone booth" },
  { code: "laundry", label: "Laundry" },
  { code: "air_conditioning", label: "Air conditioning" },
  { code: "heating", label: "Heating" },
  { code: "parking", label: "Parking" },
  { code: "coffee", label: "Coffee" },
];

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

type FormValues = Omit<CreateListingInput, "amenityCodes">;

export function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // --- Listing details ---
  const { data: listing, isLoading } = useQuery({
    queryKey: ["host", "listings", id],
    queryFn: () => hostApi.getOne(id!),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>();

  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  useEffect(() => {
    if (listing) {
      reset({
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
    }
  }, [listing, reset]);

  const toggleAmenity = (code: string) => {
    setSelectedAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const onSave = async (values: FormValues) => {
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
  };

  const handlePublish = async () => {
    setPublishError(null);
    try {
      await hostApi.publish(id!);
      await queryClient.invalidateQueries({ queryKey: ["host", "listings", id] });
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { error?: string } | null;
        setPublishError(body?.error ?? t("error.generic.unexpected"));
      } else {
        setPublishError(t("error.generic.unexpected"));
      }
    }
  };

  const handleUnpublish = async () => {
    setPublishError(null);
    try {
      await hostApi.unpublish(id!);
      await queryClient.invalidateQueries({ queryKey: ["host", "listings", id] });
    } catch {
      setPublishError(t("error.generic.unexpected"));
    }
  };

  // --- Photos ---
  const { data: photos = [] } = useQuery({
    queryKey: ["host", "listings", id, "photos"],
    queryFn: () => photoApi.list(id!),
    enabled: !!id,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setIsUploading(true);
    try {
      const { url, key } = await photoApi.getUploadUrl(id, file.type);
      await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      await photoApi.register(id, key, photos.length);
      await queryClient.invalidateQueries({ queryKey: ["host", "listings", id, "photos"] });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    await photoApi.deletePhoto(id!, photoId);
    await queryClient.invalidateQueries({ queryKey: ["host", "listings", id, "photos"] });
  };

  // --- Availability ---
  const { data: blocks = [] } = useQuery({
    queryKey: ["host", "listings", id, "availability"],
    queryFn: () => availabilityApi.list(id!),
    enabled: !!id,
  });

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [blockError, setBlockError] = useState<string | null>(null);

  const handleBlock = async () => {
    setBlockError(null);
    try {
      await availabilityApi.block(id!, startDate, endDate);
      await queryClient.invalidateQueries({ queryKey: ["host", "listings", id, "availability"] });
      setStartDate("");
      setEndDate("");
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { error?: string } | null;
        setBlockError(body?.error ?? t("error.generic.unexpected"));
      } else {
        setBlockError(t("error.generic.unexpected"));
      }
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    await availabilityApi.deleteBlock(id!, blockId);
    await queryClient.invalidateQueries({ queryKey: ["host", "listings", id, "availability"] });
  };

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

      {/* Status + Publish/Unpublish */}
      <div className="flex flex-wrap items-center gap-4">
        <Badge tone={statusTone(listing.status)}>{statusLabel(listing.status)}</Badge>
        {listing.status !== "PUBLISHED" ? (
          <Button onClick={handlePublish}>{t("host.listings.publish")}</Button>
        ) : (
          <Button variant="secondary" onClick={handleUnpublish}>
            {t("host.listings.unpublish")}
          </Button>
        )}
        {publishError && (
          <p role="alert" className="text-sm text-danger">
            {publishError}
          </p>
        )}
      </div>

      {/* Section 1: Listing details form */}
      <Card>
        <form onSubmit={handleSubmit(onSave)} className="space-y-5" noValidate>
          <div>
            <label htmlFor="edit-title" className="mb-1 block text-sm font-medium text-fg-2">
              {t("host.listings.field_title")}
            </label>
            <Input id="edit-title" {...register("title")} required />
          </div>

          <div>
            <label htmlFor="edit-description" className="mb-1 block text-sm font-medium text-fg-2">
              {t("host.listings.field_description")}
            </label>
            <textarea
              id="edit-description"
              {...register("description")}
              required
              rows={4}
              className="w-full rounded-md border border-muted bg-elevated px-4 py-3 text-base text-fg-1 placeholder:text-fg-muted transition-colors duration-fast ease-out focus-visible:border-forest-500 focus-visible:outline-none"
            />
          </div>

          <div>
            <label htmlFor="edit-type" className="mb-1 block text-sm font-medium text-fg-2">
              {t("host.listings.field_type")}
            </label>
            <select
              id="edit-type"
              {...register("type")}
              required
              className="w-full rounded-md border border-muted bg-elevated px-4 py-3 text-base text-fg-1 focus-visible:border-forest-500 focus-visible:outline-none"
            >
              <option value="PROPERTY">{t("host.listings.type_property")}</option>
              <option value="WORKSPACE">{t("host.listings.type_workspace")}</option>
            </select>
          </div>

          <div>
            <label htmlFor="edit-city" className="mb-1 block text-sm font-medium text-fg-2">
              {t("host.listings.field_city")}
            </label>
            <Input id="edit-city" {...register("city")} required />
          </div>

          <div>
            <label htmlFor="edit-country" className="mb-1 block text-sm font-medium text-fg-2">
              {t("host.listings.field_country")}
            </label>
            <Input id="edit-country" {...register("country")} required maxLength={2} />
          </div>

          <div>
            <label htmlFor="edit-addressLine" className="mb-1 block text-sm font-medium text-fg-2">
              {t("host.listings.field_address")}
            </label>
            <Input id="edit-addressLine" {...register("addressLine")} required />
          </div>

          <div>
            <label htmlFor="edit-capacity" className="mb-1 block text-sm font-medium text-fg-2">
              {t("host.listings.field_capacity")}
            </label>
            <Input
              id="edit-capacity"
              type="number"
              {...register("capacity", { valueAsNumber: true })}
              required
              min={1}
            />
          </div>

          <div>
            <label
              htmlFor="edit-nightlyRateCents"
              className="mb-1 block text-sm font-medium text-fg-2"
            >
              {t("host.listings.field_rate")}
            </label>
            <Input
              id="edit-nightlyRateCents"
              type="number"
              {...register("nightlyRateCents", { valueAsNumber: true })}
              required
              min={1}
            />
          </div>

          <div>
            <label htmlFor="edit-currency" className="mb-1 block text-sm font-medium text-fg-2">
              {t("host.listings.field_currency")}
            </label>
            <Input id="edit-currency" {...register("currency")} required />
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-fg-2">
              {t("host.listings.field_amenities")}
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {AMENITIES.map(({ code, label }) => (
                <label key={code} className="flex items-center gap-2 text-sm text-fg-2">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.has(code)}
                    onChange={() => toggleAmenity(code)}
                    className="h-4 w-4 rounded border-muted accent-forest-700"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          {saveError && (
            <p role="alert" className="text-sm text-danger">
              {saveError}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {t("host.listings.save")}
          </Button>
        </form>
      </Card>

      {/* Section 2: Photos */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-fg-1">{t("host.photos.title")}</h2>
        {photos.length === 0 ? (
          <p className="text-fg-3">{t("host.photos.no_photos")}</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative">
                <img src={photo.url} alt="" className="h-28 w-full rounded-md object-cover" />
                <Button
                  variant="destructive"
                  className="mt-1 w-full"
                  onClick={() => handleDeletePhoto(photo.id)}
                >
                  {t("host.photos.delete")}
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? t("host.photos.uploading") : t("host.photos.upload")}
          </Button>
        </div>
      </Card>

      {/* Section 3: Availability */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-fg-1">{t("host.availability.title")}</h2>
        {blocks.length === 0 ? (
          <p className="text-fg-3">{t("host.availability.no_blocks")}</p>
        ) : (
          <ul className="mb-4 space-y-2">
            {blocks.map((block) => (
              <li
                key={block.id}
                className="flex items-center justify-between rounded-md border border-muted p-3"
              >
                <span className="text-sm text-fg-2">
                  {block.startDate} – {block.endDate}
                </span>
                <Button variant="destructive" onClick={() => handleDeleteBlock(block.id)}>
                  {t("host.availability.delete")}
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium text-fg-2">
              {t("host.availability.start_label")}
            </label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fg-2">
              {t("host.availability.end_label")}
            </label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <Button onClick={handleBlock} disabled={!startDate || !endDate}>
            {t("host.availability.block")}
          </Button>
        </div>
        {blockError && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {blockError}
          </p>
        )}
      </Card>
    </div>
  );
}
