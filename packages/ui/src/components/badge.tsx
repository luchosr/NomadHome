import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn.js";

// State is carried by outline shape as well as colour (WCAG 1.4.1):
// solid = available / confirmed, dashed = tentative, struck = unavailable.
const badge = cva("inline-flex items-center rounded-pill border-2 px-3 py-1 text-xs font-bold", {
  variants: {
    tone: {
      neutral: "border-solid border-border-muted bg-surface-inset text-fg-muted",
      success: "border-solid border-success bg-success-bg text-success",
      warning: "border-dashed border-warning bg-warning-bg text-warning",
      danger: "border-solid border-danger bg-danger-bg text-danger line-through",
      info: "border-solid border-info bg-info-bg text-info",
      accent: "border-solid border-border bg-ember text-fg",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>;

/** Status panel, sentence case, no emoji. Shape-coded by tone. */
export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}
