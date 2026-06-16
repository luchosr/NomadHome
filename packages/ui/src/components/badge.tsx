import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn.js";

const badge = cva("inline-flex items-center rounded-pill px-3 py-1 text-xs font-medium", {
  variants: {
    tone: {
      neutral: "bg-sand-200 text-ink-700",
      success: "bg-success-bg text-success",
      warning: "bg-warning-bg text-warning",
      danger: "bg-danger-bg text-danger",
      info: "bg-info-bg text-info",
      accent: "bg-terracotta-50 text-terracotta-700",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>;

/** Status pill — sentence case, no emoji. */
export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}
