/**
 * مفاتيح المرور (Passkeys): الدخول ببصمة الإصبع أو الوجه أو قفل شاشة الجهاز بدل كلمة المرور.
 * المفتاح الخاص لا يغادر الجهاز، والمتصفح لا يوقّع إلا لموقعنا، فصفحة مزيّفة لا تأخذ شيئًا.
 *
 * كل عملية نداءان: الخادم يعطي تحديًا (challenge)، والجهاز يوقّعه. الحقول الثنائية تسافر
 * base64url في JSON — نفكّها قبل المتصفح ونعيد ترميزها بعده. انظر PasskeyController.
 */

import { api } from "./api";

export const toBytes = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

export const toB64u = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

type Descriptor = { id: string; type: "public-key"; transports?: AuthenticatorTransport[] };

export type Passkey = { id: string; name: string | null; created_at: string; last_used_at: string };

/** متصفح بلا WebAuthn (قديم أو داخل تطبيق) لا يرى الزر أصلًا. */
export const passkeysSupported = () =>
  typeof window !== "undefined" && typeof window.PublicKeyCredential === "function";

/** المستخدم أغلق نافذة البصمة أو انتهى وقتها — ليس خطأ يستحق رسالة. */
export const cancelled = (err: unknown) =>
  err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "AbortError");

/** اسم يميّز المفتاح في القائمة. ponytail: تخمين من الـ user agent، يكفي لـ «iPhone» و«Mac». */
const deviceName = () =>
  ["iPhone", "iPad", "Android", "Mac", "Windows"].find((n) => navigator.userAgent.includes(n)) ??
  "web";

export async function signInWithPasskey() {
  const o = await api<{ challenge: string; allowCredentials?: Descriptor[] }>(
    "/auth/passkey/options",
    { method: "POST" },
  );

  const cred = (await navigator.credentials.get({
    publicKey: {
      ...o,
      challenge: toBytes(o.challenge),
      allowCredentials: (o.allowCredentials ?? []).map((c) => ({ ...c, id: toBytes(c.id) })),
    },
  })) as PublicKeyCredential;
  const r = cred.response as AuthenticatorAssertionResponse;

  return api<{ token: string }>("/auth/passkey", {
    method: "POST",
    body: {
      id: cred.id,
      rawId: toB64u(cred.rawId),
      type: cred.type,
      response: {
        authenticatorData: toB64u(r.authenticatorData),
        clientDataJSON: toB64u(r.clientDataJSON),
        signature: toB64u(r.signature),
        userHandle: r.userHandle ? toB64u(r.userHandle) : null,
      },
      device_name: "web",
    },
  });
}

/** كلمة المرور شرط: مفتاح المرور يعيش أطول من أي جلسة، فرمز مسروق وحده لا يزرع واحدًا. */
export async function addPasskey(currentPassword: string) {
  const o = await api<
    Omit<PublicKeyCredentialCreationOptions, "challenge" | "user" | "excludeCredentials"> & {
      challenge: string;
      user: { id: string; name: string; displayName: string };
      excludeCredentials?: Descriptor[];
    }
  >("/me/passkeys/options", { method: "POST", body: { current_password: currentPassword } });

  const cred = (await navigator.credentials.create({
    publicKey: {
      ...o,
      challenge: toBytes(o.challenge),
      user: { ...o.user, id: toBytes(o.user.id) },
      excludeCredentials: (o.excludeCredentials ?? []).map((c) => ({ ...c, id: toBytes(c.id) })),
    },
  })) as PublicKeyCredential;
  const r = cred.response as AuthenticatorAttestationResponse;

  return api<{ id: string; name: string | null }>("/me/passkeys", {
    method: "POST",
    body: {
      id: cred.id,
      rawId: toB64u(cred.rawId),
      type: cred.type,
      response: {
        clientDataJSON: toB64u(r.clientDataJSON),
        attestationObject: toB64u(r.attestationObject),
        transports: r.getTransports?.() ?? [],
      },
      name: deviceName(),
    },
  });
}
