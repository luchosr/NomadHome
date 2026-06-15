import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn.js";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** Minimal shared button — proves the shadcn/ui + Tailwind pipeline. */
export function Button({ className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700",
        className,
      )}
      {...props}
    />
  );
}
