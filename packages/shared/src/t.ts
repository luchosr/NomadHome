import { en } from "./strings/en.js";

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${"" extends P ? "" : "."}${P}`
    : never
  : never;

type Paths<T> = T extends object
  ? { [K in keyof T]-?: K extends string ? Join<K, Paths<T[K]>> : never }[keyof T]
  : "";

/** Dot-joined leaf keys of the English dictionary (e.g. `common.app.name`). */
export type LocaleKey = Paths<typeof en>;

/**
 * Resolve a dictionary key to its English string.
 *
 * Misspelled keys fail at compile time via {@link LocaleKey}. The runtime guard
 * covers keys assembled from variables: a miss logs a warning and returns the
 * marker `<key-not-found: KEY>`. The helper never throws.
 */
export function t(key: LocaleKey): string {
  const parts = key.split(".");
  let node: unknown = en;
  for (const part of parts) {
    if (typeof node === "object" && node !== null && part in node) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return missing(key);
    }
  }
  return typeof node === "string" ? node : missing(key);
}

function missing(key: string): string {
  console.warn(`[i18n] key not found: ${key}`);
  return `<key-not-found: ${key}>`;
}
