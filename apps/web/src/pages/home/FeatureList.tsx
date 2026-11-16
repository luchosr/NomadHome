import { t, type LocaleKey } from "@nomadhome/shared";
import { CheckIcon } from "./CheckIcon.js";

interface Props {
  features: readonly LocaleKey[];
}

export function FeatureList({ features }: Props) {
  return (
    <ul className="mt-6 flex flex-col gap-3.5">
      {features.map((key) => (
        <li key={key} className="flex gap-3 text-base text-fg-muted">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-bg text-success">
            <CheckIcon />
          </span>
          {t(key)}
        </li>
      ))}
    </ul>
  );
}
