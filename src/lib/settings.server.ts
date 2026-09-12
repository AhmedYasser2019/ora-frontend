/**
 * بيانات المتجر من الباك إند: السطر التعريفي وقنوات التواصل وعناوين الفروع.
 *
 * `GET /api/v1/settings` عام ومترجم حسب Accept-Language، والعربية تحلّ محلّ الإنجليزية حين
 * لا تُكتب. كانت هذه البيانات مكتوبة في كود الموقع، فكان فتح فرع جديد يحتاج نشر نسخة.
 */

import { readLang } from "./i18n";

const API_URL = process.env["API_URL"] ?? "http://localhost:8000";

/** فرع واحد كما يكتبه المسؤول في الداشبورد — انظر SiteSettings في الباك إند. */
export type Branch = {
  city: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
};

export type SiteSettings = {
  general: {
    tagline: string | null;
    hours: string | null;
  };
  contact: {
    hotline: string | null;
    email: string | null;
    whatsapp: string | null;
    instagram: string | null;
    facebook: string | null;
    address: string | null;
  };
  branches: Branch[];
};

export async function fetchSettings(): Promise<SiteSettings> {
  const res = await fetch(`${API_URL}/api/v1/settings`, {
    headers: { accept: "application/json", "accept-language": readLang() },
  });

  if (!res.ok) throw new Error(`settings fetch failed: ${res.status}`);

  const body = (await res.json()) as { data: SiteSettings };

  return body.data;
}
