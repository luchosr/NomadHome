import type { ChangeEvent, RefObject } from "react";
import { t } from "@nomadhome/shared";
import { Button, Card } from "@nomadhome/ui";

interface Photo {
  id: string;
  url: string;
}

interface Props {
  photos: Photo[];
  isUploading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  upload: (file: File) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
}

export function ListingPhotosCard({
  photos,
  isUploading,
  fileInputRef,
  upload,
  deletePhoto,
}: Props) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void upload(file);
  };

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-fg-1">{t("host.photos.title")}</h2>
      {photos.length === 0 ? (
        <p className="text-fg-3">{t("host.photos.no_photos")}</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <div key={photo.id} className="relative">
              <img src={photo.url} alt={`Photo ${index + 1}`} className="h-28 w-full rounded-md object-cover" />
              <Button
                variant="destructive"
                className="mt-1 w-full"
                onClick={() => deletePhoto(photo.id)}
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
          onChange={handleChange}
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
  );
}
