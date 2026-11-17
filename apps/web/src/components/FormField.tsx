import type { ReactNode } from "react";

interface Props {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

/** Id of the error element rendered for the field with the given id. */
export function errorIdFor(id: string): string {
  return `${id}-error`;
}

export function FormField({ id, label, error, children }: Props) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-fg">
        {label}
      </label>
      {children}
      {error && (
        <p
          id={errorIdFor(id)}
          className="m-0 mt-2 break-words border-l-4 border-solid border-danger pl-3 text-sm font-bold text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
