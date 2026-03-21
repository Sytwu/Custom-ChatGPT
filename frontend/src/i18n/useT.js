import { useAppContext } from "../hooks/useAppContext.js";
import { translations } from "./translations.js";

/**
 * Returns a `t(key, ...args)` function that resolves UI strings for the current language.
 * If the value is a function (for dynamic strings like memoryHint), it is called with args.
 */
export function useT() {
  const { state } = useAppContext();
  const lang = state.language ?? "zh-TW";
  const dict = translations[lang] ?? translations["zh-TW"];

  return function t(key, ...args) {
    const val = dict[key];
    if (val === undefined) return key;
    if (typeof val === "function") return val(...args);
    return val;
  };
}
