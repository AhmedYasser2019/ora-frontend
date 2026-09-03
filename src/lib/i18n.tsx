import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import { en } from "./i18n.en";

export type Lang = "ar" | "en";

const COOKIE = "ora-lang";

const parse = (raw: string | null | undefined): Lang =>
  raw && /(?:^|;\s*)ora-lang=en(?:;|$)/.test(raw) ? "en" : "ar";

/** يقرأ اللغة من الكوكي على السيرفر والكلاينت، فلا يحدث اختلاف بين SSR والهيدريشن. */
export const readLang = createIsomorphicFn()
  .server(() => parse(getRequest().headers.get("cookie")))
  .client(() => parse(document.cookie));

/**
 * اللغة الحالية خارج شجرة React — للدوال الخالصة مثل تنسيق الأرقام والتواريخ.
 * تُحدَّث من الـ provider قبل أول render.
 */
let current: Lang = "ar";
export const lang = () => current;
export const intlLocale = () => (current === "en" ? "en-EG" : "ar-EG");

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (ar: string) => string };

const LangContext = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<Lang>(() => (current = readLang()));

  const setLang = useCallback((l: Lang) => {
    current = l;
    document.cookie = `${COOKIE}=${l};path=/;max-age=31536000;samesite=lax`;
    document.documentElement.lang = l;
    document.documentElement.dir = l === "en" ? "ltr" : "rtl";
    setValue(l);
  }, []);

  const t = useCallback((ar: string) => (value === "en" ? (en[ar] ?? ar) : ar), [value]);
  current = value;

  return (
    <LangContext.Provider value={{ lang: value, setLang, t }}>{children}</LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}

/** ترجمة خارج شجرة React — لبيانات الـ `head` (العنوان والوصف). */
export const tr = (ar: string) => (readLang() === "en" ? (en[ar] ?? ar) : ar);

/** اختصار: `const t = useT()` ثم `t("نص عربي")`. */
export const useT = () => useLang().t;
