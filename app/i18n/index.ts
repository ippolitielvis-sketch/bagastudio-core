import { it } from "./it";
import { en } from "./en";

export const DICTIONARY = {
  it,
  en,
} as const;

export type Language = keyof typeof DICTIONARY;
export type Dictionary = typeof DICTIONARY;
export type DictionaryEntry = typeof DICTIONARY.it;
