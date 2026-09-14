/**
 * الصفحات الثابتة (من نحن والسياسات) من الباك إند.
 *
 * `GET /api/v1/pages/{slug}` يعيد نص الصفحة HTML كما كتبه المسؤول في الداشبورد، مترجمًا حسب
 * Accept-Language ومنظّفًا من أي script على الخادم. الصفحة التي لم تُكتب بعد تعود 404.
 */

import { readLang } from "./i18n";

import { API_URL, backend } from "./backend.server";

export const PAGE_SLUGS = ["about", "privacy", "terms", "shipping", "refund"] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

export type ContentPage = {
  title: string;
  /** HTML منظّف — انظر PageController::show. */
  body: string;
  updatedAt: string;
};

/** null = الصفحة لم تُكتب بعد. */
export async function fetchPage(slug: PageSlug): Promise<ContentPage | null> {
  const res = await fetch(`${API_URL}/api/v1/pages/${slug}`, {
    headers: backend({ accept: "application/json", "accept-language": readLang() }),
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`page fetch failed: ${res.status}`);

  const { data } = (await res.json()) as {
    data: { title: string; body: string; updated_at: string };
  };

  return { title: data.title, body: data.body, updatedAt: data.updated_at };
}
