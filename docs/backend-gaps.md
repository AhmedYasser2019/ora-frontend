# أجزاء الموقع اللي لسه مش متربطة بالباك إند

كل بند في شات لوحده. في أول الشات قول: «اقرأ dahabzaman-reimagined/docs/backend-gaps.md واشتغل على رقم X».
لما بند يخلص: غيّر حالته هنا لـ ✅ واكتب التاريخ وأهم الملفات.

المراجعة اتعملت 2026-09-14 بمقارنة `src/` بـ `ora-backend/routes/api.php`.
المتربط فعلًا: الأسعار (REST + Reverb) والسجل، المنتجات، الأخبار، التقارير، FAQ، الإعدادات، الدخول/التسجيل/رفع الهوية، `/me`، `/kyc`، الديمو، السلة، المفضلة، الطلبات، المحفظة وشراء الذهب، الممتلكات، الإشعارات، `/tickets`.

## ✅ 1. مواعيد السوق (bug) — 2026-09-14
- اتعمل: `MarketCountdown.tsx` بياخد من `GET /v1/market` (من المتصفح) ويعدّ لـ `closes_at`/`opens_at` بساعة الخادم، ولما يوصل صفر يسأل تاني. الحساب المحلي للأيام اتشال من `market-hours.ts` (فضل `secondsToNext` + `splitDuration`)، والاختبار اتحدّث.
- `src/lib/market-hours.ts` مكتوب فيه الاثنين–السبت (الأحد إجازة)، والباك إند `config/market.php` السبت–الخميس (الجمعة إجازة).
- `GET /v1/market` بيرجع `open`, `server_time`, `opens_at` / `closes_at`.
- المستخدم: `src/components/MarketCountdown.tsx` (في `routes/index.tsx`). فيه `market-hours.test.ts`.
- الهدف: العدّاد ياخد من `/market` بدل الحساب المحلي.

## ✅ 2. شحن المحفظة (طلبات الإيداع) — 2026-09-14
- اتعمل: تبويب «شحن رصيد» في `src/routes/wallet.tsx` بقى فورم (مبلغ + رقم التحويل + الإيصال) بيبعت `upload("/deposits")`، وكارت «طلبات الشحن» تحت الحركات بالحالة (`status_label`) وملاحظة المكتب. اتشال نص «الحد الأدنى 100 · التنفيذ فوري» الغلط، ولينك لـ `/payment-methods`. الترجمة في `i18n.en.ts`.
- `src/routes/wallet.tsx:140` بيطلع toast بس وفيه تعليق قديم «لا endpoint للشحن».
- الموجود: `GET/POST /v1/deposits` في `DepositController` — `amount` (جنيه) + `reference` + `receipt` (jpg/png/pdf ≤ 8MB)، multipart. الديمو 403.
- الرفع multipart موجود كـ `upload()` في `src/lib/api.ts` (مستخدم في auth.tsx).
- الهدف: فورم الشحن يبعت الطلب، وقائمة بطلبات الإيداع وحالتها.

## ✅ 3. الصفحات الثابتة من الداشبورد — 2026-09-14
- اتعمل: slug جديد `refund` (`PageSlug` + الترجمة)، وmigration `2026_09_14_120000_add_refund_page_and_site_copy` بتضيف صفه وبتنقل نص الموقع القديم (عربي + إنجليزي) للصفحات الفاضية بس. `PageController::show` بقى بينضّف الـ HTML (`Str::sanitizeHtml`).
- الموقع: `src/lib/pages.{server,functions,queries}.ts` + `loadPage` في الـ loader (الصفحة الفاضية = 404)، و`components/Policy.tsx` بقى بيعرض HTML الداشبورد وتاريخ `updated_at`. `about.tsx` النص بس من الداشبورد (الصورة والكروت ثابتة). النصوص القديمة اتشالت من `i18n.en.ts`.
- `usage` لسه مالهاش صفحة في الموقع (مش مطلوبة). **محتاج `php artisan migrate` على السيرفر.**
- hardcoded: `routes/about.tsx`, `privacy.tsx`, `terms.tsx`, `shipping-policy.tsx`, `refund-policy.tsx`.
- الموجود: `GET /v1/pages` و`GET /v1/pages/{slug}` — slugs: `about, privacy, terms, usage, shipping` (`App\Enums\PageSlug`).
- **محتاج قرار:** `refund-policy` مالهاش slug، و`usage` مالهاش صفحة في الموقع.
- اتبع نفس نمط `news.server.ts` / `news.functions.ts` / `news.queries.ts`.

## ✅ 4. أخبار الصفحة الرئيسية — 2026-09-14
- اتعمل: `FinancialNews.tsx` بياخد أحدث 6 من `newsQuery` (عنوان/مقتطف مترجمين من الخادم + `newsDate`)، والقسم بيختفي لو مفيش أخبار. الـ loader في `routes/index.tsx` بيجيبها على الخادم، وفشلها مش بيوقع الصفحة. صورة القسم الافتراضية واسم القسم اتنقلوا لـ `news.queries.ts` (مشتركين مع `routes/news.tsx`). ترجمات المقالات الثابتة اتشالت من `i18n.en.ts`.
- `src/components/FinancialNews.tsx` فيه 4 مقالات ثابتة.
- استخدم `newsQuery` من `src/lib/news.queries.ts` (زي `routes/news.tsx`).

## ✅ 5. طرق الدفع وبيانات البنك — 2026-09-14
- اتعمل: migration `2026_09_14_130000_add_payment_details_to_site_settings` (`instapay, bank_name, bank_beneficiary, bank_account, bank_iban`) من غير seed — الأرقام الوهمية اتشالت. تبويب «الدفع» في `SiteSettings` (IBAN لازم EG + 27 رقم، والمسافات بتتشال). `/settings` بقى فيه `payment`. `OrderController` بقى `in:instapay,bank,wallet,cash`. الاختبارات في `SiteSettingsTest` و`PhysicalOrderTest`.
- الموقع: `payment-methods.tsx` بياخد من `useSiteSettings().payment`، وأي قيمة فاضية صندوقها بيختفي، وكارت الحساب البنكي مش بيظهر غير لو فيه IBAN أو رقم حساب. **محتاج `php artisan migrate` على السيرفر + تعبئة بيانات الدفع من الداشبورد.**
- `src/routes/payment-methods.tsx:28-38`: IBAN ورقم الحساب وInstaPay ثابتين وشكلهم placeholder.
- `/settings` مفيهوش بيانات دفع → محتاج إضافة في الباك إند (SiteSettings + الداشبورد) الأول.
- كمان: `OrderController` بيقبل `payment_method` أي string ≤ 24 — يتقفل على `instapay, bank, wallet, cash` (نفس `PAYMENTS` في `checkout.tsx`).

## ⬜ 6. خطوة OTP في التسجيل
- `src/routes/auth.tsx:257-268` بتقبل أي 6 أرقام.
- الباك إند مش بيتحقق من الموبايل في التسجيل، وبوابة SMS مش مشتراة (الكود في اللوج).
- الهدف: يا إما تتشال الخطوة، يا إما تتربط بـ `/auth/otp` + `/auth/otp/verify` لما البوابة تيجي.

## ⬜ 7. نسيت كلمة المرور
- مفيش شاشة ولا لينك في `auth.tsx`.
- الموجود: `POST /auth/otp` → `/auth/otp/verify` → `/auth/password` (throttle `otp`).
- مش هتشتغل فعليًا غير لما SMS يتظبط (زي رقم 6).

## ⬜ 8. حاجات صغيرة
- صفحة تفاصيل للأخبار والتقارير (`GET /news/{id}`, `/reports/{id}`) — الكروت دلوقتي مش بتفتح.
- أزرار Google Play / App Store في `routes/index.tsx:260-278` — لينكات لما التطبيق ينزل (ممكن من `/settings`).
- مش مطلوب: `GOVERNORATES` ثابتة في `site.ts`، و`/devices` للموبايل بس.
