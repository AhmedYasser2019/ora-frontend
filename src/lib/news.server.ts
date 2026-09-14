/**
 * الأخبار من الباك إند.
 *
 * `GET /api/v1/news` يعيد المنشور فقط — المسودّة والمجدولة ليستا هناك أصلًا — مترجمًا
 * حسب Accept-Language. الصفحة تُقرأ على الخادم لأن محرّكات البحث تقرأ هذه الصفحة.
 */

import { readLang } from "./i18n";

import { API_URL, backend } from "./backend.server";

/** ما يعيده الباك إند لكل مقال — انظر NewsController::present. */
type ApiArticle = {
  id: number;
  category: "global" | "local";
  title: string;
  excerpt: string;
  image_url: string | null;
  published_at: string;
};

export type Article = {
  id: number;
  category: "global" | "local";
  title: string;
  excerpt: string;
  /** null = لا صورة على المقال، والشاشة تضع صورة القسم الافتراضية. */
  img: string | null;
  publishedAt: string;
};

const toArticle = (a: ApiArticle): Article => ({
  id: a.id,
  category: a.category,
  title: a.title,
  excerpt: a.excerpt,
  img: a.image_url,
  publishedAt: a.published_at,
});

export async function fetchNews(): Promise<Article[]> {
  const res = await fetch(`${API_URL}/api/v1/news`, {
    headers: backend({ accept: "application/json", "accept-language": readLang() }),
  });

  if (!res.ok) throw new Error(`news fetch failed: ${res.status}`);

  // مُرقَّم: الغلاف يلفّ صفحة Laravel، فالمقالات في `data.data`.
  const body = (await res.json()) as { data: { data: ApiArticle[] } };

  return body.data.data.map(toArticle);
}

/** null = غير موجود أو لم يُنشر بعد. `body` HTML منظّف — انظر NewsController::show. */
export async function fetchArticle(id: number): Promise<(Article & { body: string }) | null> {
  const res = await fetch(`${API_URL}/api/v1/news/${id}`, {
    headers: backend({ accept: "application/json", "accept-language": readLang() }),
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`article fetch failed: ${res.status}`);

  const { data } = (await res.json()) as { data: ApiArticle & { body: string } };

  return { ...toArticle(data), body: data.body };
}
