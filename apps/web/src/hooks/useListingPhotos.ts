import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { photoApi } from "../api/photos.js";

export function useListingPhotos(id: string | undefined) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: photos = [] } = useQuery({
    queryKey: ["host", "listings", id, "photos"],
    queryFn: () => photoApi.list(id!),
    enabled: !!id,
  });

  const upload = async (file: File) => {
    if (!id) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const { url, key } = await photoApi.getUploadUrl(id, file.type);
      const res = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      await photoApi.register(id, key, photos.length);
      await queryClient.invalidateQueries({ queryKey: ["host", "listings", id, "photos"] });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deletePhoto = async (photoId: string) => {
    await photoApi.deletePhoto(id!, photoId);
    await queryClient.invalidateQueries({ queryKey: ["host", "listings", id, "photos"] });
  };

  return { photos, isUploading, uploadError, fileInputRef, upload, deletePhoto };
}
