/**
 * بيانات المتجر من الباك إند: السطر التعريفي وقنوات التواصل وعناوين الفروع.
 *
 * `GET /api/v1/settings` عام ومترجم حسب Accept-Language، والعربية تحلّ محلّ الإنجليزية حين
 * لا تُكتب. كانت هذه البيانات مكتوبة في كود الموقع، فكان فتح فرع جديد يحتاج نشر نسخة.
 */

import { readLang } from "./i18n";

import { API_URL, backend } from "./backend.server";

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
  /** ما يُنسخ في تطبيق البنك على صفحة طرق الدفع. الفارغ لا يظهر — ولا بديل وهمي له. */
  payment: {
    instapay: string | null;
    bank_name: string | null;
    bank_beneficiary: string | null;
    bank_account: string | null;
    bank_iban: string | null;
  };
  /** روابط المتجرين. الفارغ = التطبيق لم ينزل بعد، والزر يقول «قريبًا». */
  app: {
    android: string | null;
    ios: string | null;
  };
  branches: Branch[];
};

export async function fetchSettings(): Promise<SiteSettings> {
  const res = await fetch(`${API_URL}/api/v1/settings`, {
    headers: backend({ accept: "application/json", "accept-language": readLang() }),
  });

  if (!res.ok) throw new Error(`settings fetch failed: ${res.status}`);

  const body = (await res.json()) as { data: SiteSettings };

  return body.data;
}
