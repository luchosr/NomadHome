import type { SelectHTMLAttributes } from "react";
import type { OptionGroup } from "../lib/listingData.js";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  groups: OptionGroup[];
  placeholder?: string;
}

export function GroupedSelect({ id, groups, placeholder, ...rest }: Props) {
  return (
    <select id={id} {...rest}>
      {placeholder && <option value="">{placeholder}</option>}
      {groups.map(({ group, options }) => (
        <optgroup key={group} label={group}>
          {options.map(({ code, label }) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
