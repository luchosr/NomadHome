import { t } from "@nomadhome/shared";
import { Button } from "@nomadhome/ui";

/** Placeholder application shell. All visible text is routed through `t()`. */
export function App() {
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">{t("common.app.name")}</h1>
      <p className="mt-2 text-slate-600">{t("common.app.tagline")}</p>
      <Button className="mt-4">{t("common.action.close")}</Button>
    </main>
  );
}
