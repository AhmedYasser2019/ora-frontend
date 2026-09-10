# أورا — واجهة المتجر

TanStack Start (React 19). تقرأ كل شيء من الباك إند في `ora-backend` عبر `/api/v1`.

## من أين تأتي الأسعار

من مكتب التسعير، ولا شيء غيره:

- `GET /api/v1/prices` — سعر الجرام لكل عيار، بالجنيه. الحمولة نفسها التي يتوقعها `LivePrices`.
- `GET /api/v1/products` — الكتالوج بأسعاره، محسوبة على الخادم لحظة القراءة.
- قناة `prices` على Reverb، الحدث `board.updated` — يحمل `snapshot` بنفس شكل نقطة `/prices`،
  فتُوضع في الكاش كما هي.

**لا سعر يُحسب في الواجهة.** حساب السعر هنا نسخة ثانية من قواعد التسعير، وأول مرة تختلف
النسختان يرى العميل رقمًا لا نُنفّذ عليه. `buyPrice`/`sellPrice` القديمتان — والكتالوج
الثابت، ومصدر `api.gold-api.com` — حُذفت لهذا السبب.

الشراء يمرّ بعرض سعر مثبَّت من الخادم ثم أمر يحمل رقم العرض فقط: لا حقل سعر يغادر المتصفح.

## التشغيل محليًا

```bash
bun install
bun dev            # المنفذ 3000
```

يحتاج الباك إند شغّالًا:

```bash
cd ../ora-backend
php artisan serve --port=8000
php artisan reverb:start --port=8090      # البثّ الحيّ
php artisan schedule:work                 # ora:broadcast-board كل ثانية
```

## المتغيّرات

انسخ `.env` وعدّل:

| المتغيّر | ماذا يفعل |
|---|---|
| `API_URL` | يُقرأ على الخادم فقط — دوال SSR |
| `VITE_API_URL` | يصل للمتصفح |
| `VITE_REVERB_APP_KEY` | من `REVERB_APP_KEY` في الباك إند |
| `VITE_REVERB_HOST` / `_PORT` / `_SCHEME` | عنوان Reverb |

`VITE_*` تُحقن وقت البناء، فتغييرها يحتاج إعادة بناء لا إعادة تشغيل.

## البناء والنشر

```bash
bun run build
node .output/server/index.mjs
```

Nitro بإعداد `node-server` — عملية Node طويلة العمر خلف ALB، لأن الصفحة تحتفظ بسوكت
لكل تبويب مفتوح. تفاصيل النشر في `../ora-backend/docs/deploy-aws.md`.

## الاختبارات

ملفات `assert` عادية، تُشغَّل مباشرة:

```bash
bun run src/lib/holdings.test.ts
bun run src/lib/zakat.test.ts
bun run src/lib/market-hours.test.ts
bunx tsc --noEmit
```
