import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn.js";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Lift on hover for clickable cards. */
  interactive?: boolean;
};

/** Elevated surface — 16px radius, hairline border, soft shadow. */
export function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-muted bg-elevated p-5 shadow-sm",
        interactive &&
          "cursor-pointer transition duration-med ease-out hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
      {...props}
    />
  );
}
