import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn.js";

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

/** Pulsing placeholder block — compose rows/layouts at the call site with multiple instances. */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-sm bg-inset", className)} {...props} />;
}
