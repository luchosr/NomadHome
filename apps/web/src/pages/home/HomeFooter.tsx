import { t } from "@nomadhome/shared";
import { WRAP, FOOTER_NAV_COLS } from "./constants.js";

export function HomeFooter() {
  return (
    <footer className="border-t border-sand-300 bg-sand-50 pb-10 pt-16">
      <div className={WRAP}>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:gap-10">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2.5">
              <svg width="30" height="30" viewBox="0 0 64 64">
                <rect width="64" height="64" rx="14" fill="#2E4A3F" />
                <path
                  d="M18 44 V32 a14 14 0 0 1 28 0 V44"
                  stroke="#F5F0E8"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
                <line
                  x1="12"
                  y1="48"
                  x2="52"
                  y2="48"
                  stroke="#D97757"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <span className="font-serif text-2xl text-ink-900">NomadHome</span>
            </div>
            <p className="mt-3.5 max-w-[30ch] text-sm leading-relaxed text-ink-500">
              {t("home.footer.tagline")}
            </p>
          </div>
          {FOOTER_NAV_COLS.map((col) => (
            <div key={col.hKey}>
              <h4 className="mb-4 text-xs font-medium uppercase tracking-widest text-ink-500">
                {t(col.hKey)}
              </h4>
              {col.links.map((l) => (
                <a
                  key={l}
                  href="#"
                  className="mb-2.5 block text-sm text-ink-700 no-underline transition-colors hover:text-forest-700"
                >
                  {t(l)}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-sand-300 pt-6 text-xs text-ink-500">
          <span>{t("home.footer.copyright")}</span>
          <span className="flex gap-4">
            <a href="#" className="text-ink-500 no-underline hover:text-ink-900">
              {t("home.footer.privacy")}
            </a>
            <a href="#" className="text-ink-500 no-underline hover:text-ink-900">
              {t("home.footer.terms")}
            </a>
            <a href="#" className="text-ink-500 no-underline hover:text-ink-900">
              {t("home.footer.cookies")}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
