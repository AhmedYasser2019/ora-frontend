/**
 * إشعارات المتصفح عبر Firebase — نفس `/devices` الذي يسجّل فيه التطبيق هاتفه، بمنصة `web`.
 *
 * بلا متغيرات VITE_FIREBASE_* كل هذا لا يفعل شيئًا، والجرس وReverb يعملان كما هما.
 */

import { getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

import { api } from "./api";
import { lang } from "./i18n";

const env = import.meta.env;

const config = {
  apiKey: env["VITE_FIREBASE_API_KEY"],
  projectId: env["VITE_FIREBASE_PROJECT_ID"],
  messagingSenderId: env["VITE_FIREBASE_MESSAGING_SENDER_ID"],
  appId: env["VITE_FIREBASE_APP_ID"],
};
const vapidKey = env["VITE_FIREBASE_VAPID_KEY"];

/** الرمز المسجَّل من هذا المتصفح، ليُحذف عند الخروج. */
let registered: string | null = null;

/** هل يستطيع هذا المتصفح استقبال إشعارات، وهل Firebase مضبوط أصلًا. */
export async function pushAvailable(): Promise<boolean> {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    !!(config.apiKey && config.appId && vapidKey) &&
    (await isSupported().catch(() => false))
  );
}

/**
 * يسجّل المتصفح لدى الباك إند. يُنادى عند كل فتح والإذن ممنوح — FCM يغيّر الرمز من وقت
 * لآخر — ومن زر عند الضغط، لأن المتصفحات تتجاهل طلب إذن لم يأتِ من المستخدم.
 */
export async function registerPush(ask = false): Promise<boolean> {
  if (!(await pushAvailable())) return false;
  if (Notification.permission === "denied") return false;
  if (Notification.permission === "default") {
    if (!ask || (await Notification.requestPermission()) !== "granted") return false;
  }

  await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const token = await getToken(getMessaging(getApps()[0] ?? initializeApp(config)), {
    vapidKey,
    serviceWorkerRegistration: await navigator.serviceWorker.ready,
  });

  await api("/devices", { method: "POST", body: { token, platform: "web", locale: lang() } });
  registered = token;
  return true;
}

/** عند الخروج: الحساب يحتفظ بصندوقه، وهذا المتصفح يتوقف عن التنبيه له. */
export async function unregisterPush() {
  if (!registered) return;
  const token = registered;
  registered = null;
  await api("/devices", { method: "DELETE", body: { token } }).catch(() => {});
}
