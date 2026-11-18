import { t, type LocaleKey } from "@nomadhome/shared";
import { CHECKBOX_CLASS } from "./listingFormStyles.js";

interface Amenity {
  code: string;
  labelKey: LocaleKey;
}

interface Props {
  amenities: readonly Amenity[];
  selected: Set<string>;
  onToggle: (code: string) => void;
}

export function AmenityCheckboxGrid({ amenities, selected, onToggle }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {amenities.map(({ code, labelKey }) => (
        <label
          key={code}
          className="relative flex min-h-11 cursor-pointer items-center gap-3 break-words text-sm text-fg"
        >
          <input
            type="checkbox"
            checked={selected.has(code)}
            onChange={() => onToggle(code)}
            className={CHECKBOX_CLASS}
          />
          <svg
            aria-hidden="true"
            focusable={false}
            viewBox="0 0 20 20"
            className="pointer-events-none absolute left-0 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-fg-inverse peer-checked:block"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="square"
            strokeLinejoin="miter"
          >
            <path d="M4.5 10.5l3.5 3.5 7.5-8" />
          </svg>
          {t(labelKey)}
        </label>
      ))}
    </div>
  );
}
