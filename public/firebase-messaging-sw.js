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

/** نفس ما يفتحه النقر على التنبيه في الجرس — انظر linkFor في NotificationBell. */
const pathFor = ({ type = "", action_type, action_id = "" } = {}) => {
  const id = encodeURIComponent(action_id);
  switch (action_type || type.split(".")[0]) {
    case "order":
      return "/orders";
    case "news":
      return id ? `/news/${id}` : "/news";
    case "product":
      return id ? `/products/${id}` : "/collection";
    case "cart":
      return "/cart";
    case "deposit":
      return "/wallet";
    case "kyc":
      return "/account";
    case "zakat":
      return "/zakat";
    default:
      return "/";
  }
};

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(pathFor(event.notification.data)));
});
