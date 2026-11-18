import type { ChangeEvent, RefObject } from "react";
import { t } from "@nomadhome/shared";
import { Button, Card } from "@nomadhome/ui";
import { ServerErrorAlert } from "./ServerErrorAlert.js";
import { FLAT_CARD_CLASS } from "./listingFormStyles.js";

// A solid 2px border replaces the secondary Button's 1px border plus inset ring (a box shadow).
const FLAT_SECONDARY = "border-2 ![box-shadow:none]";

interface Photo {
  id: string;
  url: string;
}

interface Props {
  photos: Photo[];
  isUploading: boolean;
  uploadError: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  upload: (file: File) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
}

export function ListingPhotosCard({
  photos,
  isUploading,
  uploadError,
  fileInputRef,
  upload,
  deletePhoto,
}: Props) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void upload(file);
  };

  return (
    <Card className={FLAT_CARD_CLASS}>
      <h2 className="mb-4 text-lg font-bold text-fg">{t("host.photos.title")}</h2>
      {photos.length === 0 ? (
        <p className="text-fg-muted">{t("host.photos.no_photos")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <div key={photo.id} className="relative">
              <img
                src={photo.url}
                alt={`Photo ${index + 1}`}
                className="aspect-square w-full rounded-none border-2 border-border object-cover"
              />
              <Button
                variant="destructive"
                className="mt-2 min-h-11 w-full"
                onClick={() => deletePhoto(photo.id)}
              >
                {t("host.photos.delete")}
              </Button>
            </div>
          ))}
        </div>
      )}
      <ServerErrorAlert error={uploadError} className="mt-3" />
      <div className="mt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
        <Button
          variant="secondary"
          className={FLAT_SECONDARY}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? t("host.photos.uploading") : t("host.photos.upload")}
        </Button>
      </div>
    </Card>
  );
}
