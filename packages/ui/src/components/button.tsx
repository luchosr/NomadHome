import type { ComponentPropsWithRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn.js";

// Sign-panel buttons: near-square, bold, flat. Disabled is expressed by shape
// (dashed outline, no fill) as well as colour. Focus uses the global focus ring.
// Panel variants share padding and the dashed, unfilled disabled shape. The tertiary link-style
// variant sets its own, so no class here is overridden by another (tailwind-merge safe).
const PANEL =
  "px-[22px] py-[14px] disabled:border-dashed disabled:border-border-muted disabled:bg-surface-inset disabled:text-fg-subtle";

/** Shared recipe for buttons and for anchors that look like buttons. */
export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center rounded-sm border-2 text-sm font-bold no-underline transition-colors duration-med ease-out active:translate-y-px disabled:pointer-events-none",
  {
    variants: {
      variant: {
        // ink action panel, paper lettering
        primary: `${PANEL} border-border bg-action text-action-fg hover:bg-action-hover`,
        // outlined panel on paper
        secondary: `${PANEL} border-border bg-transparent text-fg hover:bg-surface-inset`,
        // link-style, underline on hover only
        tertiary:
          "border-transparent bg-transparent px-0 py-0 text-fg underline-offset-4 hover:underline disabled:border-transparent disabled:bg-transparent disabled:line-through",
        // danger panel, paper lettering
        destructive: `${PANEL} border-danger bg-danger text-fg-inverse hover:border-danger-hover hover:bg-danger-hover`,
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export type ButtonProps = ComponentPropsWithRef<"button"> & ButtonVariantProps;

/** Shared button following the NomadHome design system. */
export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
