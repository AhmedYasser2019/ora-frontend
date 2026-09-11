/**
 * التقارير من الباك إند.
 *
 * `GET /api/v1/reports` بنفس شكل الأخبار تمامًا — المنشور فقط ومترجمًا حسب Accept-Language —
 * مع `kind` (دورية التقرير) مكان `category`.
 */

import { readLang } from "./i18n";

const API_URL = process.env["API_URL"] ?? "http://localhost:8000";

export type ReportKind = "weekly" | "monthly" | "quarterly" | "annual";

/** ما يعيده الباك إند لكل تقرير — انظر ReportController::present. */
type ApiReport = {
  id: number;
  kind: ReportKind;
  title: string;
  excerpt: string;
  image_url: string | null;
  published_at: string;
};

export type Report = {
  id: number;
  kind: ReportKind;
  title: string;
  excerpt: string;
  /** null = لا صورة على التقرير، والشاشة تضع صورة افتراضية. */
  img: string | null;
  publishedAt: string;
};

export async function fetchReports(): Promise<Report[]> {
  const res = await fetch(`${API_URL}/api/v1/reports`, {
    headers: { accept: "application/json", "accept-language": readLang() },
  });

  if (!res.ok) throw new Error(`reports fetch failed: ${res.status}`);

  // مُرقَّم مثل الأخبار: التقارير في `data.data`.
  const body = (await res.json()) as { data: { data: ApiReport[] } };

  return body.data.data.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    excerpt: r.excerpt,
    img: r.image_url,
    publishedAt: r.published_at,
  }));
}
