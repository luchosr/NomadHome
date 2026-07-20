import { t, type LocaleKey } from "@nomadhome/shared";

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
        <label key={code} className="flex items-center gap-2 text-sm text-fg-2">
          <input
            type="checkbox"
            checked={selected.has(code)}
            onChange={() => onToggle(code)}
            className="h-4 w-4 rounded border-muted accent-forest-700"
          />
          {t(labelKey)}
        </label>
      ))}
    </div>
  );
}
