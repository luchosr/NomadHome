import { t } from "@nomadhome/shared";
import { WRAP, FOOTER_NAV_COLS } from "./constants.js";

export function HomeFooter() {
  return (
    <footer className="border-t border-border-muted bg-surface-inset pb-10 pt-16">
      <div className={WRAP}>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:gap-10">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2.5">
              <svg width="30" height="30" viewBox="0 0 64 64">
                <rect width="64" height="64" rx="14" fill="#0A0A0A" />
                <path
                  d="M18 44 V32 a14 14 0 0 1 28 0 V44"
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
                <line
                  x1="12"
                  y1="48"
                  x2="52"
                  y2="48"
                  stroke="#FFC700"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <span className="font-display text-2xl text-fg">NomadHome</span>
            </div>
            <p className="mt-3.5 max-w-[30ch] text-sm leading-relaxed text-fg-subtle">
              {t("home.footer.tagline")}
            </p>
          </div>
          {FOOTER_NAV_COLS.map((col) => (
            <div key={col.hKey}>
              <h4 className="mb-4 text-xs font-medium uppercase tracking-widest text-fg-subtle">
                {t(col.hKey)}
              </h4>
              {col.links.map((l) => (
                <a
                  key={l}
                  href="#"
                  className="mb-2.5 block text-sm text-fg-muted no-underline transition-colors hover:text-fg"
                >
                  {t(l)}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border-muted pt-6 text-xs text-fg-subtle">
          <span>{t("home.footer.copyright")}</span>
          <span className="flex gap-4">
            <a href="#" className="text-fg-subtle no-underline hover:text-fg">
              {t("home.footer.privacy")}
            </a>
            <a href="#" className="text-fg-subtle no-underline hover:text-fg">
              {t("home.footer.terms")}
            </a>
            <a href="#" className="text-fg-subtle no-underline hover:text-fg">
              {t("home.footer.cookies")}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
