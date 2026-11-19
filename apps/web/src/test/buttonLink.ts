import { expect } from "vitest";
import { buttonVariants } from "@nomadhome/ui";

type Variant = "primary" | "secondary" | "tertiary" | "destructive";

/** A CTA link is one anchor that carries every `buttonVariants` class and nests no button. */
export function expectButtonLink(
  link: HTMLElement,
  variant: Variant,
  extra: string[] = [],
  /** Variant classes that an extension deliberately overrides (tailwind-merge drops them). */
  overridden: string[] = [],
) {
  expect(link.tagName).toBe("A");
  expect(link.querySelector("button")).toBeNull();
  expect(link.closest("button")).toBeNull();
  for (const c of buttonVariants({ variant }).split(/\s+/).filter(Boolean)) {
    if (overridden.includes(c)) expect(link).not.toHaveClass(c);
    else expect(link).toHaveClass(c);
  }
  for (const c of extra) expect(link).toHaveClass(c);
  expect(link).not.toHaveClass("![box-shadow:none]");
}
