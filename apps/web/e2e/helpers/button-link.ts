import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

// NH-138 (button-link-variants) shared contract for every migrated screen. The helper is written
// before the implementation and is red until the Button primitive is flat and CTA links are single
// anchors. Duplicated DOM (table plus list, desktop plus mobile) is handled by the callers with
// `.filter({ visible: true })`.

const PAPER_RGB = "rgb(247, 245, 242)";

export type ButtonLinkTargets = {
  /** CTA links (a single anchor each); each must be one Tab stop. */
  links?: Locator[];
  /** Secondary buttons: no box-shadow at rest, two-layer ring when focused. */
  secondaries?: Locator[];
  /** Cards: no box-shadow at rest. */
  cards?: Locator[];
};

export async function expectNoNestedInteractive(page: Page) {
  await expect(page.locator("a button")).toHaveCount(0);
  await expect(page.locator("button a")).toHaveCount(0);
}

async function isFocused(target: Locator): Promise<boolean> {
  return target.evaluate((el) => el === document.activeElement);
}

/** Reaches the target with the keyboard so :focus-visible applies. */
export async function tabTo(page: Page, target: Locator, maxTabs = 80) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press("Tab");
    if (await isFocused(target)) return;
  }
  throw new Error("target was not reached with the Tab key");
}

/** One Tab stop: after focusing the CTA, the next Tab leaves it and nothing inside it is focusable. */
export async function expectSingleTabStop(page: Page, link: Locator) {
  await expect(link).toBeVisible();
  const nested = await link.evaluate(
    (el) => el.querySelectorAll("a, button, input, select, textarea, [tabindex]").length,
  );
  expect(nested).toBe(0);
  await tabTo(page, link);
  await page.keyboard.press("Tab");
  const stillInside = await link.evaluate((el) => el.contains(document.activeElement));
  expect(stillInside).toBe(false);
}

export async function expectNoBoxShadowAtRest(page: Page, target: Locator) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await expect(target).toHaveCSS("box-shadow", "none");
}

/** Focused: 3px solid outline plus a 2px paper gap box shadow (the --focus-gap layer). */
export async function expectTwoLayerFocusRing(page: Page, target: Locator) {
  await tabTo(page, target);
  await expect(target).toHaveCSS("outline-width", "3px");
  await expect(target).toHaveCSS("outline-style", "solid");
  const shadow = await target.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(shadow).toContain(PAPER_RGB);
  expect(shadow).toMatch(/0px 0px 0px 2px/);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const m = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(m.scrollWidth).toBeLessThanOrEqual(m.innerWidth);
}

export async function expectButtonLinkContract(page: Page, targets: ButtonLinkTargets = {}) {
  await expectNoNestedInteractive(page);
  for (const link of targets.links ?? []) {
    await expectSingleTabStop(page, link);
  }
  for (const card of targets.cards ?? []) {
    await expectNoBoxShadowAtRest(page, card);
  }
  for (const secondary of targets.secondaries ?? []) {
    await expectNoBoxShadowAtRest(page, secondary);
    await expectTwoLayerFocusRing(page, secondary);
  }
  for (const link of targets.links ?? []) {
    await expectTwoLayerFocusRing(page, link);
  }
  await expectNoHorizontalOverflow(page);
}
