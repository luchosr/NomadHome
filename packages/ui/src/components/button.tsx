import type { ComponentPropsWithRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn.js";

// Sign-panel buttons: near-square, bold, flat. Disabled is expressed by shape
// (dashed outline, no fill) as well as colour. Focus uses the global focus ring.
const button = cva(
  "inline-flex items-center justify-center rounded-sm border-2 px-[22px] py-[14px] text-sm font-bold transition-colors duration-med ease-out active:translate-y-px disabled:pointer-events-none disabled:border-dashed disabled:border-border-muted disabled:bg-surface-inset disabled:text-fg-subtle",
  {
    variants: {
      variant: {
        // black action panel, signal lettering
        primary: "border-border bg-action text-signal hover:bg-action-hover",
        // outlined panel on white
        // 1px border plus a 1px inset ring keeps the 2px panel edge
        secondary:
          "border border-border bg-transparent text-fg ring-1 ring-inset ring-border hover:bg-surface-inset disabled:ring-0",
        // link-style, underline on hover only
        tertiary:
          "border-transparent bg-transparent px-0 py-0 text-fg underline-offset-4 hover:underline disabled:border-transparent disabled:bg-transparent disabled:line-through",
        // danger panel, white lettering
        destructive:
          "border-danger bg-danger text-fg-inverse hover:border-danger-hover hover:bg-danger-hover",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export type ButtonProps = ComponentPropsWithRef<"button"> & VariantProps<typeof button>;

/** Shared button following the NomadHome design system. */
export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(button({ variant }), className)} {...props} />;
}
