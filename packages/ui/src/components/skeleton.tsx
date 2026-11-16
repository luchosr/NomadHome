import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn.js";

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

/** Flat placeholder block; pulse is disabled under prefers-reduced-motion. Compose layouts at the call site. */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-sm bg-surface-inset motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
