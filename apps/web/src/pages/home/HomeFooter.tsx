import { t } from "@nomadhome/shared";
import { Logo } from "../../components/Logo.js";
import { WRAP, FOOTER_NAV_COLS } from "./constants.js";

const footerLink =
  "block py-1 text-sm font-medium text-fg-inverse underline-offset-4 no-underline hover:underline";

export function HomeFooter() {
  return (
    <footer className="bg-surface-inverse pb-10 pt-16 text-fg-inverse [--focus:var(--paper)] [--focus-gap:var(--ink)]">
      <div className={WRAP}>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Logo />
            <p className="mt-4 max-w-[30ch] text-sm leading-relaxed">{t("home.footer.tagline")}</p>
          </div>
          {FOOTER_NAV_COLS.map((col) => (
            <div key={col.hKey}>
              <h3 className="mb-3 text-lg font-black text-ember">{t(col.hKey)}</h3>
              {col.links.map((l) => (
                <a key={l} href="#" className={footerLink}>
                  {t(l)}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t-2 border-fg-inverse pt-6 text-sm">
          <span>{t("home.footer.copyright")}</span>
          <span className="flex gap-6">
            <a href="#" className={footerLink}>
              {t("home.footer.privacy")}
            </a>
            <a href="#" className={footerLink}>
              {t("home.footer.terms")}
            </a>
            <a href="#" className={footerLink}>
              {t("home.footer.cookies")}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
