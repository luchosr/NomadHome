import type { Page } from "@playwright/test";

export async function mockSession(
  page: Page,
  { email, roles }: { email: string; roles: string[] },
) {
  try {
    const refreshToken = crypto.randomUUID();
    const accessToken = crypto.randomUUID();
    const nextRefreshToken = crypto.randomUUID();
    await page.addInitScript(
      (token) => localStorage.setItem("nh_refresh_token", token),
      refreshToken,
    );
    await page.route("**/auth/refresh", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          accessToken,
          refreshToken: nextRefreshToken,
          user: { id: crypto.randomUUID(), email, roles },
        }),
      }),
    );
  } catch (err) {
    throw new Error(`mockSession setup failed: ${String(err)}`);
  }
}
