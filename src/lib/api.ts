/**
 * عميل الـ API. كل نداء للباك إند يمرّ من هنا.
 *
 * الردّ ملفوف في `{status, msg, data}` — انظر ApiEnvelope في الباك إند — فنفكّه مرة واحدة
 * هنا بدل تكراره في كل شاشة. الرمز في localStorage: هذا موقع عام يُفتح من متصفح، والرمز
 * شخصي لهذا الجهاز.
 */

import { lang } from "./i18n";

// `?.` لأن الاختبارات تشغّل هذه الوحدة في node، حيث لا `import.meta.env`.
const BASE = import.meta.env?.["VITE_API_URL"] ?? "http://localhost:8000";

const TOKEN_KEY = "ora.token";

/** رمز الحساب الحقيقي، محفوظ جانبًا ما دام المستخدم في حساب الديمو المربوط به. */
const REAL_TOKEN_KEY = "ora.token.real";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else {
      // خروج أو رمز ملغى: لا يبقى رمز حقيقي مخبّأ خلف جلسة انتهت.
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REAL_TOKEN_KEY);
    }
  } catch {
    /* متصفح يمنع التخزين — الجلسة تعيش حتى إغلاق الصفحة فقط */
  }
  window.dispatchEvent(new Event("ora:auth"));
};

/**
 * الانتقال لحساب الديمو والعودة منه. العودة تستعمل الرمز الحقيقي المحفوظ ولا تسأل الخادم —
 * رمز الديمو لا يُستبدل برمز حقيقي أبدًا.
 */
export const enterDemo = (demoToken: string) => {
  try {
    const real = localStorage.getItem(TOKEN_KEY);
    if (real) localStorage.setItem(REAL_TOKEN_KEY, real);
  } catch {
    /* بلا تخزين لا عودة — الخروج والدخول من جديد يكفيان */
  }
  setToken(demoToken);
};

export const leaveDemo = () => {
  let real: string | null = null;
  try {
    real = localStorage.getItem(REAL_TOKEN_KEY);
    localStorage.removeItem(REAL_TOKEN_KEY);
  } catch {
    /* كما فوق */
  }
  setToken(real);
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** أخطاء التحقق من Laravel: حقل ← رسائله. */
    public errors: Record<string, string[]> = {},
  ) {
    super(message);
  }

  /** أول رسالة يفهمها المستخدم، أيًّا كان شكل الخطأ. */
  get firstMessage(): string {
    return Object.values(this.errors)[0]?.[0] ?? this.message;
  }
}

/**
 * جسم أي ردّ من الباك إند. عند الفشل يضع ApiEnvelope أخطاء التحقق في `data` لا في `errors`،
 * فنقرأ الاثنين: `data` هو ما يرسله الخادم فعلًا، و`errors` احتياط لو تغيّر الغلاف.
 */
type Envelope<T> = {
  msg?: string;
  message?: string;
  data?: T | Record<string, string[]> | { reason?: string } | null;
  errors?: Record<string, string[]>;
};

/** أخطاء التحقق حقلًا بحقل، أيًّا كان المكان الذي وضعها فيه الغلاف. */
export function fieldErrors(body: Envelope<unknown> | null): Record<string, string[]> {
  if (body?.errors) return body.errors;

  const data = body?.data;
  if (!data || typeof data !== "object") return {};

  // `data` عند الفشل إمّا خريطة حقل ← رسائل، وإمّا `{reason}` لرفض تجاري — والثاني ليس خطأ حقل.
  return Object.fromEntries(
    Object.entries(data as Record<string, unknown>).filter(
      (entry): entry is [string, string[]] =>
        Array.isArray(entry[1]) && entry[1].every((m) => typeof m === "string"),
    ),
  );
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** مفتاح التكرار لطلب لا يجوز أن يُنفَّذ مرتين. */
  idempotencyKey?: string;
};

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const token = getToken();

  // الباك إند يترجم من Accept-Language — بدونه تعود كل رسائله بالعربية مهما اختار المستخدم.
  const headers: Record<string, string> = {
    accept: "application/json",
    "accept-language": lang(),
  };
  if (options.body !== undefined) headers["content-type"] = "application/json";
  if (token) headers["authorization"] = `Bearer ${token}`;
  if (options.idempotencyKey) headers["idempotency-key"] = options.idempotencyKey;

  const res = await fetch(`${BASE}/api/v1${path}`, {
    method: options.method ?? "GET",
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });

  const body = (await res.json().catch(() => null)) as Envelope<T> | null;

  if (!res.ok) {
    // رمز منتهٍ أو ملغى: ننهي الجلسة محليًا بدل ترك المستخدم يضغط أزرارًا لا تعمل.
    if (res.status === 401) setToken(null);

    throw new ApiError(
      res.status,
      body?.msg || body?.message || `request failed: ${res.status}`,
      fieldErrors(body),
    );
  }

  return (body?.data ?? body) as T;
}

/**
 * رفع ملف. multipart وليس JSON — الوثائق تُرسل كملفات، ولا يمرّ محتواها بجسم JSON.
 */
export async function upload<T>(path: string, form: FormData): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    accept: "application/json",
    "accept-language": lang(),
  };
  if (token) headers["authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api/v1${path}`, { method: "POST", headers, body: form });

  const body = (await res.json().catch(() => null)) as Envelope<T> | null;

  if (!res.ok) {
    if (res.status === 401) setToken(null);
    throw new ApiError(
      res.status,
      body?.msg || body?.message || `upload failed: ${res.status}`,
      fieldErrors(body),
    );
  }

  return (body?.data ?? body) as T;
}
