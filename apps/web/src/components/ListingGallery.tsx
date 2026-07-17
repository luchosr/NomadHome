interface Photo {
  id: string;
  url: string;
}

interface Props {
  primaryPhoto: Photo | undefined;
  thumbnails: Photo[];
  title: string;
}

export function ListingGallery({ primaryPhoto, thumbnails, title }: Props) {
  if (!primaryPhoto) {
    return <div className="mb-4 h-64 w-full rounded-xl bg-slate-100" />;
  }

  return (
    <div className="mb-4">
      <img
        src={primaryPhoto.url}
        alt={title}
        className="w-full rounded-xl object-cover"
        style={{ maxHeight: "480px" }}
      />
      {thumbnails.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {thumbnails.map((photo) => (
            <img
              key={photo.id}
              src={photo.url}
              alt={title}
              className="h-20 w-32 flex-shrink-0 rounded-lg object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
}
