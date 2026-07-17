import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { photoApi } from "../api/photos.js";

export function useListingPhotos(id: string | undefined) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: photos = [] } = useQuery({
    queryKey: ["host", "listings", id, "photos"],
    queryFn: () => photoApi.list(id!),
    enabled: !!id,
  });

  const upload = async (file: File) => {
    if (!id) return;
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

  const deletePhoto = async (photoId: string) => {
    await photoApi.deletePhoto(id!, photoId);
    await queryClient.invalidateQueries({ queryKey: ["host", "listings", id, "photos"] });
  };

  return { photos, isUploading, fileInputRef, upload, deletePhoto };
}
