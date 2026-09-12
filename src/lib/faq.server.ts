/**
 * الأسئلة الشائعة من الباك إند.
 *
 * `GET /api/v1/faqs` يعيد الأسئلة بالترتيب الذي رتّبته لوحة التحكم، مترجمة حسب
 * Accept-Language، ومسطّحة: القسم حقل على كل سؤال، والشاشة تجمع عليه.
 */

import { readLang } from "./i18n";

const API_URL = process.env["API_URL"] ?? "http://localhost:8000";

export type Faq = {
  id: number;
  /** عنوان القسم الذي يظهر السؤال تحته. */
  group: string;
  question: string;
  answer: string;
};

export async function fetchFaqs(): Promise<Faq[]> {
  const res = await fetch(`${API_URL}/api/v1/faqs`, {
    headers: { accept: "application/json", "accept-language": readLang() },
  });

  if (!res.ok) throw new Error(`faqs fetch failed: ${res.status}`);

  const body = (await res.json()) as { data: Faq[] };

  return body.data;
}
