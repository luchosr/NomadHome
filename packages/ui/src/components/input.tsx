import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn.js";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/** Sign-panel text input: 2px black edge, flat. Disabled is dashed and inset; invalid uses the danger edge. */
export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-sm border-2 border-border bg-surface-raised px-4 py-3 text-base text-fg placeholder:text-fg-subtle transition-colors duration-fast ease-out focus-visible:bg-surface disabled:cursor-not-allowed disabled:border-dashed disabled:border-border-muted disabled:bg-surface-inset disabled:text-fg-subtle aria-[invalid=true]:border-danger",
        className,
      )}
      {...props}
    />
  );
}
