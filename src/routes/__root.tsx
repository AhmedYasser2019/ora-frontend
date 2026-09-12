import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { LangProvider, readLang, tr } from "@/lib/i18n";
import { settingsQuery } from "@/lib/settings.queries";
import { CartProvider } from "../lib/cart";
import { FavoritesProvider } from "@/lib/favorites";
import { Toaster } from "@/components/ui/sonner";

/**
 * تُرسم أحيانًا خارج <LangProvider> (لو فشل RootComponent قبل تركيب الـ provider)،
 * لذا تستخدم `tr` المستقلة عن السياق بدل `useT`.
 */
function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{tr("الصفحة غير موجودة")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {tr("الصفحة التي تبحث عنها غير موجودة أو تم نقلها.")}
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {tr("العودة للرئيسية")}
          </Link>
        </div>
      </div>
    </div>
  );
}

// نفس السبب: قد تُرسم قبل تركيب <LangProvider>، فتستخدم `tr` لا `useT`.
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {tr("تعذّر تحميل الصفحة")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {tr("حدث خطأ من جانبنا. جرّب تحديث الصفحة أو العودة للرئيسية.")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {tr("حاول مرة أخرى")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {tr("العودة للرئيسية")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => {
    const title = tr("ORA | أورا للذهب والسبائك");

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title },
        {
          name: "description",
          content: tr("استثمر في الذهب والفضة بثقة مع أورا: سبائك وعملات ذهبية وأسعار لحظية."),
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: tr("سبائك وعملات ذهبية معتمدة وأسعار لحظية للذهب في مصر."),
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [
        {
          rel: "stylesheet",
          href: appCss,
        },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&family=Marcellus&display=swap",
        },
      ],
    };
  },

  /**
   * بيانات المتجر — الفوتر يطبع أرقام التواصل في كل صفحة، فتُجلب هنا مرة واحدة بدل مرة في
   * كل شاشة. `prefetchQuery` لا `ensureQueryData`: هذه البيانات تزيّن الصفحة ولا تصنعها،
   * وباك إند بعيد يجب أن يُفقد الفوتر أرقامه لا أن يُسقط الموقع كله.
   */
  loader: ({ context }) => context.queryClient.prefetchQuery(settingsQuery(readLang())),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const lang = readLang();

  return (
    <html lang={lang} dir={lang === "en" ? "ltr" : "rtl"}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <CartProvider>
          <FavoritesProvider>
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
            <Toaster position="top-center" richColors />
          </FavoritesProvider>
        </CartProvider>
      </LangProvider>
    </QueryClientProvider>
  );
}
