import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { toast } from "sonner";

import { api, BASE, getToken } from "./api";
import { useAuth } from "./use-auth";

/** شكل صفّ في صندوق الإشعارات — نفس ما يُرجعه NotificationController::present. */
export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  action: { type: string; id: string } | null;
  read_at: string | null;
  created_at: string;
};

type Page = { data: AppNotification[]; unread_count: number };

const QUERY_KEY = ["notifications"];

/**
 * صندوق العميل: يُقرأ من `/notifications` كما يقرؤه التطبيق، ويشترك على قناته الخاصة
 * (`App.Models.User.{id}`، انظر routes/channels.php) ليصل التنبيه فور صدوره — طلب تغيّرت
 * حالته، إشعار كياك، إلخ — بدل انتظار فتح الجرس من جديد.
 *
 * كالبث الحيّ للأسعار: عند وصول تنبيه لا نبني الصف يدويًا في الكاش، بل نُبطل الاستعلام
 * ونجلبه من جديد — نسخة واحدة من شكل البيانات، في الخادم لا في المتصفح.
 */
export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api<Page>("/notifications"),
    enabled: !!user,
    staleTime: 30_000,
  });

  useEffect(() => {
    const key = import.meta.env["VITE_REVERB_APP_KEY"];
    if (!user || !key) return;

    (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

    const echo = new Echo({
      broadcaster: "reverb",
      key,
      wsHost: import.meta.env["VITE_REVERB_HOST"],
      wsPort: Number(import.meta.env["VITE_REVERB_PORT"] ?? 8080),
      wssPort: Number(import.meta.env["VITE_REVERB_PORT"] ?? 443),
      forceTLS: (import.meta.env["VITE_REVERB_SCHEME"] ?? "https") === "https",
      enabledTransports: ["ws", "wss"],
      // قناة خاصة تحتاج تفويضًا. الموقع عميل SPA برمز Sanctum لا بجلسة، فنمرره في الهيدر
      // بدل الاعتماد على كوكي — بالضبط كما يفعل تطبيق الموبايل. انظر bootstrap/app.php.
      authEndpoint: `${BASE}/broadcasting/auth`,
      auth: { headers: { Authorization: `Bearer ${getToken()}` } },
    });

    echo.private(`App.Models.User.${user.id}`).listen(".notification", (n: AppNotification) => {
      toast(n.title, { description: n.body });
      void qc.invalidateQueries({ queryKey: QUERY_KEY });

      // كل إشعار طلب معناه أن حالته تغيّرت في نفس اللحظة.
      if (n.action?.type === "order") void qc.invalidateQueries({ queryKey: ["orders"] });
    });

    return () => {
      echo.leave(`App.Models.User.${user.id}`);
      echo.disconnect();
    };
  }, [user, qc]);

  const markRead = async (ids?: string[]) => {
    await api("/notifications/read", { method: "POST", body: { ids } });
    void qc.invalidateQueries({ queryKey: QUERY_KEY });
  };

  return {
    notifications: data?.data ?? [],
    unreadCount: data?.unread_count ?? 0,
    markRead,
  };
}
