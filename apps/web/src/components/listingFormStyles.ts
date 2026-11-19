// Shared field grammar for the host listing forms (host-identity, design D2). Mirrors the FormField
// label and error and the Input primitive so selects, textareas and checkboxes match the other forms.
export const LABEL_CLASS = "mb-2 block text-sm font-bold text-fg";

export const CONTROL_CLASS =
  "w-full rounded-sm border-2 border-border bg-surface-raised px-4 py-3 text-base text-fg placeholder:text-fg-subtle transition-colors duration-fast ease-out focus-visible:bg-surface aria-[invalid=true]:border-danger";

export const HINT_CLASS =
  "m-0 mt-2 border-l-4 border-solid border-border-muted pl-3 text-sm text-fg-muted";

export const ERROR_BAR_CLASS =
  "m-0 mt-2 break-words border-l-4 border-solid border-danger pl-3 text-sm font-bold text-danger";

export const CHECKBOX_CLASS =
  "peer h-5 w-5 shrink-0 appearance-none rounded-none border-2 border-border bg-surface-raised checked:bg-ink";
