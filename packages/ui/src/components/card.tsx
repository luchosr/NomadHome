import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn.js";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Invert to the inset surface on hover for clickable cards. */
  interactive?: boolean;
};

/** Flat sign panel: 2px ink edge, no shadow, no gradient. */
export function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border-2 border-border bg-surface-raised p-5",
        interactive &&
          "cursor-pointer transition-colors duration-med ease-out hover:bg-surface-inset",
        className,
      )}
      {...props}
    />
  );
}
