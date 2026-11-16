import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import { t } from "@nomadhome/shared";
import type { SearchFormValues } from "../hooks/useSearchPage.js";
import { SearchFilterPanel } from "./SearchFilterPanel.js";

function Harness({ onClose }: { onClose: () => void }) {
  const { register } = useForm<SearchFormValues>();
  return <SearchFilterPanel id="p" register={register} onReset={() => {}} onClose={onClose} />;
}

function stubViewport(isDesktop: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation(() => ({
      matches: isDesktop,
      addEventListener() {},
      removeEventListener() {},
    })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("SearchFilterPanel focus handling", () => {
  it("keeps Tab and Shift+Tab inside the sheet below md", async () => {
    stubViewport(false);
    const user = userEvent.setup();
    render(<Harness onClose={() => {}} />);
    const panel = screen.getByRole("complementary", { name: t("search.filter_title") });
    const close = screen.getByRole("button", { name: t("search.filter_close") });
    const reset = screen.getByRole("button", { name: t("search.filter_reset") });
    expect(panel).toHaveFocus();
    await user.tab({ shift: true });
    expect(panel.contains(document.activeElement)).toBe(true);
    reset.focus();
    await user.tab();
    expect(panel.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(close);
  });

  it("does not trap Tab in the desktop side panel", async () => {
    stubViewport(true);
    const user = userEvent.setup();
    render(<Harness onClose={() => {}} />);
    screen.getByRole("button", { name: t("search.filter_reset") }).focus();
    await user.tab();
    expect(document.activeElement).toBe(document.body);
  });

  it("closes on Escape", async () => {
    stubViewport(false);
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
