import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { ListingPhotosCard } from "./ListingPhotosCard.js";

// NH-122 identity tests (host-identity, task 1.8). jsdom does not compute Tailwind, so shape is
// asserted through class tokens. Selector assumptions: photo = img with alt "Photo N" (the alt stays
// hard-coded, a recorded follow-up); Delete = button named "Delete"; error = the single role="alert".
// Tests marked GUARD pass before the restyle and must keep passing.

const PHOTOS = [
  { id: "p1", url: "https://example.com/1.jpg" },
  { id: "p2", url: "https://example.com/2.jpg" },
];

function setup(overrides: Partial<Parameters<typeof ListingPhotosCard>[0]> = {}) {
  const upload = vi.fn().mockResolvedValue(undefined);
  const deletePhoto = vi.fn().mockResolvedValue(undefined);
  const fileInputRef = createRef<HTMLInputElement>();
  const utils = render(
    <ListingPhotosCard
      photos={PHOTOS}
      isUploading={false}
      uploadError={null}
      fileInputRef={fileInputRef}
      upload={upload}
      deletePhoto={deletePhoto}
      {...overrides}
    />,
  );
  return { upload, deletePhoto, fileInputRef, ...utils };
}

describe("ListingPhotosCard identity", () => {
  it("the heading is a bold ink h2", () => {
    setup();
    expect(screen.getByRole("heading", { level: 2, name: "Photos" })).toHaveClass(
      "font-bold",
      "text-fg",
    );
  });

  it("each photo is a framed square with the same alt text", () => {
    setup();
    for (const [i, alt] of ["Photo 1", "Photo 2"].entries()) {
      const img = screen.getByRole("img", { name: alt });
      expect(img, alt).toHaveAttribute("src", PHOTOS[i]?.url);
      expect(img, alt).toHaveClass("aspect-square", "border-2", "border-border", "rounded-none");
      expect(img, alt).not.toHaveClass("rounded-md");
    }
  });

  it("Delete stays destructive and is a 44px target that calls deletePhoto", async () => {
    const { deletePhoto } = setup();
    const buttons = screen.getAllByRole("button", { name: "Delete" });
    expect(buttons).toHaveLength(2);
    for (const b of buttons) expect(b).toHaveClass("bg-danger", "min-h-11");
    await userEvent.click(buttons[1] as HTMLElement);
    expect(deletePhoto).toHaveBeenCalledWith("p2");
  });

  it("GUARD: the hidden file input keeps its ref and forwards the chosen file", async () => {
    const { fileInputRef, upload, container } = setup();
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();
    expect(fileInputRef.current).toBe(input);
    expect(input).toHaveClass("hidden");
    expect(input).toHaveAttribute("accept", "image/*");
    const file = new File(["x"], "a.png", { type: "image/png" });
    await userEvent.upload(input as HTMLInputElement, file);
    expect(upload).toHaveBeenCalledWith(file);
  });

  it("GUARD: Upload keeps its disabled condition", () => {
    const { unmount } = setup({ isUploading: false });
    expect(screen.getByRole("button", { name: "Upload photo" })).toBeEnabled();
    unmount();
    setup({ isUploading: true });
    expect(screen.getByRole("button", { name: "Uploading..." })).toBeDisabled();
  });

  it("Upload is a secondary button with the flat 2px edge", () => {
    setup();
    const upload = screen.getByRole("button", { name: "Upload photo" });
    expect(upload).toHaveClass("border-2", "text-fg");
    expect(upload).not.toHaveClass("bg-action");
  });

  it("an upload error renders one shared alert and no red-600 text", () => {
    const { container } = setup({ uploadError: "Upload failed (500)" });
    const alert = screen.getByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(alert).toHaveTextContent("Upload failed (500)");
    expect(alert).toHaveClass("border-2", "border-solid", "border-danger", "bg-danger-bg");
    expect(container.innerHTML).not.toMatch(/text-red-600/);
  });

  it("GUARD: no error means no alert, and no photos shows the existing text", () => {
    setup({ photos: [] });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("No photos yet.")).toBeInTheDocument();
  });
});
