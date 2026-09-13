import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { intlLocale, useT } from "@/lib/i18n";
import { useAuth } from "@/lib/use-auth";
import { useNotifications, type AppNotification } from "@/lib/use-notifications";

const when = (iso: string) =>
  new Intl.DateTimeFormat(intlLocale(), { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );

/** أين يفتح النقر على تنبيه — طلب حاليًا فقط، انظر Order::record. */
const actionTo = (action: AppNotification["action"]) =>
  action?.type === "order" ? "/orders" : null;

export function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, markRead } = useNotifications();
  const t = useT();

  if (!user) return null;

  return (
    <DropdownMenu onOpenChange={(open) => open && unreadCount > 0 && void markRead()}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={t("الإشعارات")}
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-primary">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between text-primary">
          {t("الإشعارات")}
          {unreadCount > 0 && <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            {t("لا توجد إشعارات بعد")}
          </p>
        ) : (
          notifications.map((n) => {
            const to = actionTo(n.action);
            const body = (
              <>
                <p className={`text-sm ${n.read_at ? "text-muted-foreground" : "text-primary"}`}>
                  {n.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[10px] text-muted-foreground/70">{when(n.created_at)}</p>
              </>
            );

            return (
              <DropdownMenuItem
                key={n.id}
                asChild={!!to}
                className="flex-col items-start gap-0 whitespace-normal py-2"
              >
                {to ? <Link to={to}>{body}</Link> : <div>{body}</div>}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
