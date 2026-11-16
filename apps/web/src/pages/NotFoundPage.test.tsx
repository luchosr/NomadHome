import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { t } from "@nomadhome/shared";
import { NotFoundPage } from "./NotFoundPage.js";

describe("NotFoundPage", () => {
  it("shows the title and a link home", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: t("error.not_found.title") })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: t("error.not_found.home") })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
