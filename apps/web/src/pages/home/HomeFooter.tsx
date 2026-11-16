import { t } from "@nomadhome/shared";
import { WRAP, FOOTER_NAV_COLS } from "./constants.js";

const footerLink =
  "block py-1 text-sm font-medium text-fg-inverse underline-offset-4 no-underline hover:underline";

export function HomeFooter() {
  return (
    <footer className="bg-surface-inverse pb-10 pt-16 text-fg-inverse [--focus:var(--signal)]">
      <div className={WRAP}>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-3">
              <svg width="32" height="32" viewBox="0 0 64 64" aria-hidden="true">
                <rect width="64" height="64" fill="#FFC700" />
                <path
                  d="M16 46 V30 a16 16 0 0 1 32 0 V46"
                  stroke="#0A0A0A"
                  strokeWidth="6"
                  strokeLinecap="square"
                  fill="none"
                />
                <rect x="10" y="46" width="44" height="6" fill="#0A0A0A" />
              </svg>
              <span className="font-display text-xl font-black leading-none tracking-tight">
                {t("common.app.name")}
              </span>
            </div>
            <p className="mt-4 max-w-[30ch] text-sm leading-relaxed">{t("home.footer.tagline")}</p>
          </div>
          {FOOTER_NAV_COLS.map((col) => (
            <div key={col.hKey}>
              <h3 className="mb-3 text-base font-black text-signal">{t(col.hKey)}</h3>
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
