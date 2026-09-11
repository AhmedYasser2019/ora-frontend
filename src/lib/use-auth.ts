import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";

import { api, enterDemo, getToken, leaveDemo, setToken } from "./api";

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_demo?: boolean;
  [key: string]: unknown;
};

/** `setToken` يبثّ `ora:auth`، و`storage` يغطي تبويبًا آخر — فتتفق كل الشاشات على جلسة واحدة. */
const subscribe = (cb: () => void) => {
  window.addEventListener("ora:auth", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("ora:auth", cb);
    window.removeEventListener("storage", cb);
  };
};

/** الرمز كحالة تفاعلية. على الخادم لا رمز: الرمز يعيش في المتصفح وحده. */
export const useToken = () => useSyncExternalStore(subscribe, getToken, () => null);

/**
 * الجلسة الحالية عبر Sanctum.
 *
 * وجود رمز لا يعني جلسة صالحة — قد يكون ملغى من لوحة التحكم — فنسأل `GET /me`. الاستعلام
 * مشترك في react-query، فالشاشات التي تسأل عن المستخدم لا تكرّر النداء.
 */
export function useAuth() {
  const token = useToken();
  const qc = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: ["me"],
    queryFn: () => api<User>("/me"),
    enabled: !!token,
    retry: false,
    staleTime: 60_000,
  });

  const signOut = useCallback(async () => {
    setToken(null);
    // ما في الذاكرة يخصّ حسابًا انتهت جلسته — السلة والمفضلة والممتلكات معه.
    qc.clear();
  }, [qc]);

  /** بين الحساب الحقيقي وحساب الديمو المربوط به. كل ما في الذاكرة يخصّ الحساب السابق. */
  const switchDemo = useCallback(async () => {
    if (data?.is_demo) leaveDemo();
    else enterDemo((await api<{ token: string }>("/demo/enter", { method: "POST" })).token);
    await qc.resetQueries();
  }, [data, qc]);

  return {
    user: token ? (data ?? null) : null,
    loading: !!token && isPending,
    signOut,
    switchDemo,
  };
}

/** Keep only same-origin relative paths for post-auth redirects. */
export function safeNext(next: unknown): string {
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/account";
}
