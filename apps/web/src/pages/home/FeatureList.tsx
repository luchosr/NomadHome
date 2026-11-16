import { t, type LocaleKey } from "@nomadhome/shared";
import { CheckIcon } from "./CheckIcon.js";

interface Props {
  features: readonly LocaleKey[];
}

/** Ruled list that inherits the field's text colour, so it reads on white and on sign green. */
export function FeatureList({ features }: Props) {
  return (
    <ul className="m-0 mt-8 flex list-none flex-col border-b-2 border-current p-0">
      {features.map((key) => (
        <li
          key={key}
          className="flex items-center gap-4 border-t-2 border-current py-4 text-base font-bold"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-current">
            <CheckIcon />
          </span>
          {t(key)}
        </li>
      ))}
    </ul>
  );
}
