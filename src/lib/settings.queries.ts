import { queryOptions, useQuery } from "@tanstack/react-query";

import { useLang, type Lang } from "./i18n";
import { getSettings } from "./settings.functions";

/**
 * العناوين وأرقام التواصل تتغيّر بوتيرة فتح فرع جديد، فالفاصل طويل.
 *
 * اللغة جزء من المفتاح: الخادم يترجم حسب Accept-Language، وتبديل اللغة في المتصفح لا يعيد
 * تحميل الصفحة — فبدون اللغة في المفتاح يبقى النصّ بلغته الأولى حتى أوّل تنقّل.
 */
export const settingsQuery = (lang: Lang) =>
  queryOptions({
    queryKey: ["settings", lang],
    queryFn: () => getSettings(),
    staleTime: 600_000,
  });

/**
 * بيانات المتجر لأي شاشة. تُجلب مرة واحدة في الجذر — انظر loader في `__root` — فلا شاشة
 * هنا تنتظر الشبكة. وحين يكون الباك إند بعيدًا تعود `undefined`، والشاشة تتجاهل ما لا تجده
 * بدل أن تسقط: الفوتر يظهر في كل صفحة، ومنها صفحات لا تحتاج الباك إند أصلًا.
 */
export const useSiteSettings = () => useQuery(settingsQuery(useLang().lang)).data;
