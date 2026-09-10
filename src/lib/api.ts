/**
 * عميل الـ API. كل نداء للباك إند يمرّ من هنا.
 *
 * الردّ ملفوف في `{status, msg, data}` — انظر ApiEnvelope في الباك إند — فنفكّه مرة واحدة
 * هنا بدل تكراره في كل شاشة. الرمز في localStorage: هذا موقع عام يُفتح من متصفح، والرمز
 * شخصي لهذا الجهاز.
 */

const BASE = import.meta.env["VITE_API_URL"] ?? "http://localhost:8000";

const TOKEN_KEY = "ora.token";

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
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* متصفح يمنع التخزين — الجلسة تعيش حتى إغلاق الصفحة فقط */
  }
  window.dispatchEvent(new Event("ora:auth"));
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

type Options = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** مفتاح التكرار لطلب لا يجوز أن يُنفَّذ مرتين. */
  idempotencyKey?: string;
};

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = { accept: "application/json" };
  if (options.body !== undefined) headers["content-type"] = "application/json";
  if (token) headers["authorization"] = `Bearer ${token}`;
  if (options.idempotencyKey) headers["idempotency-key"] = options.idempotencyKey;

  const res = await fetch(`${BASE}/api/v1${path}`, {
    method: options.method ?? "GET",
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });

  const body = (await res.json().catch(() => null)) as
    | { msg?: string; data?: T; errors?: Record<string, string[]>; message?: string }
    | null;

  if (!res.ok) {
    // رمز منتهٍ أو ملغى: ننهي الجلسة محليًا بدل ترك المستخدم يضغط أزرارًا لا تعمل.
    if (res.status === 401) setToken(null);

    throw new ApiError(
      res.status,
      body?.msg || body?.message || `request failed: ${res.status}`,
      body?.errors ?? {},
    );
  }

  return (body?.data ?? body) as T;
}

/**
 * رفع ملف. multipart وليس JSON — الوثائق تُرسل كملفات، ولا يمرّ محتواها بجسم JSON.
 */
export async function upload<T>(path: string, form: FormData): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = { accept: "application/json" };
  if (token) headers["authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api/v1${path}`, { method: "POST", headers, body: form });

  const body = (await res.json().catch(() => null)) as
    | { msg?: string; data?: T; errors?: Record<string, string[]>; message?: string }
    | null;

  if (!res.ok) {
    if (res.status === 401) setToken(null);
    throw new ApiError(
      res.status,
      body?.msg || body?.message || `upload failed: ${res.status}`,
      body?.errors ?? {},
    );
  }

  return (body?.data ?? body) as T;
}
