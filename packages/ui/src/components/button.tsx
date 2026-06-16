import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn.js";

const button = cva(
  "inline-flex items-center justify-center rounded-md px-[22px] py-[14px] text-sm font-medium transition-colors duration-med ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // forest fill, sand text — the default CTA
        primary: "bg-forest-700 text-sand-50 hover:bg-forest-900",
        // transparent with forest border
        secondary: "border border-forest-700 bg-transparent text-forest-700 hover:bg-sand-200",
        // link-style, underline on hover only
        tertiary: "bg-transparent px-0 py-0 text-forest-700 hover:underline",
        // terracotta — used sparingly
        destructive: "bg-terracotta-500 text-sand-50 hover:bg-terracotta-700",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>;

/** Shared button following the NomadHome design system. */
export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(button({ variant }), className)} {...props} />;
}
