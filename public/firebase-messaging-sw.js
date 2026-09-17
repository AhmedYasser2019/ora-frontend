/*
 * إشعارات المتصفح (FCM). لا نستورد Firebase هنا: الرسالة تصل كـ JSON عادي في حدث `push`،
 * وعرضها وفتح رابطها سطور قليلة — فلا يحتاج هذا الملف إعدادات Firebase ولا مكتبة من CDN.
 *
 * الشكل من App\Notifications\FcmChannel: `notification: {title, body}` و`data: {type,
 * action_type, action_id}`.
 */

self.addEventListener("push", (event) => {
  const payload = event.data?.json() ?? {};
  const { title, body } = payload.notification ?? {};
  if (!title) return;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((tabs) => {
      // تبويب مفتوح أمام المستخدم وصله التنبيه من Reverb كـ toast — لا نكرره.
      if (tabs.some((tab) => tab.focused)) return;

      return self.registration.showNotification(title, {
        body,
        data: payload.data ?? {},
        dir: "auto",
      });
    }),
  );
});

/** نفس ما يفتحه النقر على التنبيه في الجرس. */
const pathFor = ({ action_type: type, action_id: id } = {}) =>
  type === "order"
    ? "/orders"
    : type === "cart"
      ? "/cart"
      : type === "news" && id
        ? `/news/${id}`
        : "/";

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(pathFor(event.notification.data)));
});
