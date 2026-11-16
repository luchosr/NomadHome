import { t, type LocaleKey } from "@nomadhome/shared";
import { CheckIcon } from "./CheckIcon.js";

interface Props {
  features: readonly LocaleKey[];
  /** Full-width rules that merge with the edges of the panel around the list. */
  flush?: boolean;
  className?: string;
}

/** Ruled list that inherits the field's text colour, so it reads on white and on sign green. */
export function FeatureList({ features, flush = false, className = "mt-8" }: Props) {
  return (
    <ul
      className={`m-0 flex list-none flex-col border-b-2 border-current p-0 ${flush ? "-my-[2px]" : className}`}
    >
      {features.map((key) => (
        <li
          key={key}
          className={`flex items-center gap-4 border-t-2 border-current py-4 text-base font-bold ${flush ? "px-6" : ""}`}
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
