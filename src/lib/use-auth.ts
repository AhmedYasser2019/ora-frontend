import { useCallback, useEffect, useState } from "react";

import { api, getToken, setToken } from "./api";

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  [key: string]: unknown;
};

/**
 * الجلسة الحالية عبر Sanctum.
 *
 * وجود رمز لا يعني جلسة صالحة — قد يكون ملغى من لوحة التحكم — فنسأل `GET /me` مرة عند
 * الإقلاع، وهو أيضًا ما يملأ اسم المستخدم في الترويسة دون نداء ثانٍ.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }

    api<User>("/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();

    // setToken يبثّ هذا الحدث، فتتفق كل الشاشات المفتوحة على نفس الجلسة.
    window.addEventListener("ora:auth", load);
    return () => window.removeEventListener("ora:auth", load);
  }, [load]);

  const signOut = async () => {
    setToken(null);
    setUser(null);
  };

  return { user, loading, signOut };
}

/** Keep only same-origin relative paths for post-auth redirects. */
export function safeNext(next: unknown): string {
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/account";
}
