import type { ReactNode } from "react";

interface Props {
  title: string;
  titleId: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Ember title band over one paper form panel. The root <main> belongs to Layout. */
export function AuthShell({ title, titleId, subtitle, children, footer }: Props) {
  return (
    <div>
      <div className="border-b-2 border-border bg-ember text-fg">
        <div className="mx-auto w-full max-w-[32rem] px-4 py-6 md:py-14">
          <h1
            id={titleId}
            className="m-0 text-balance break-words text-4xl font-black leading-[0.95] tracking-[-0.03em]"
          >
            {title}
          </h1>
          {subtitle && (
            <p className="m-0 mt-3 max-w-[40ch] text-base font-medium text-fg">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="mx-auto mb-16 mt-6 w-full max-w-[32rem] px-4 sm:mt-8">
        <div className="min-w-0 rounded border-2 border-border bg-surface-raised">
          <div className="p-5 sm:p-8">{children}</div>
          {footer && (
            <div className="min-w-0 border-t-2 border-border bg-surface-inset px-5 py-4 text-sm text-fg">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
