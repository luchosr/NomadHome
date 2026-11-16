import { t } from "@nomadhome/shared";

/** Gantry mark (signal square, black arch) plus the product name. Not a link; wrap it where needed. */
export function Logo() {
  return (
    <span className="flex items-center gap-3">
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
    </span>
  );
}
