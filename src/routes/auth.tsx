import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogIn, Mail, Lock, User, Phone, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { safeNext, useAuth } from "@/lib/use-auth";

const searchSchema = z.object({
  next: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | أورا للذهب" },
      { name: "description", content: "سجّل الدخول أو أنشئ حسابك في أورا للذهب لمتابعة طلباتك وحفظ بياناتك." },
      { property: "og:title", content: "تسجيل الدخول | أورا للذهب" },
      { property: "og:description", content: "حسابك في أورا للذهب والسبائك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function Field({
  id,
  label,
  icon: Icon,
  ...props
}: {
  id: string;
  label: string;
  icon: typeof Mail;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-primary">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          {...props}
          className="w-full rounded-xl border border-input bg-background py-2.5 pl-3 pr-10 text-sm outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold"
        />
      </div>
    </div>
  );
}

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });

  const target = safeNext(next);

  useEffect(() => {
    if (!loading && user) navigate({ to: target });
  }, [loading, user, navigate, target]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
        toast.success("مرحبًا بعودتك");
        navigate({ to: target });
      } else {
        if (form.password.length < 6) {
          toast.error("كلمة المرور يجب ألا تقل عن 6 أحرف");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: { full_name: form.name.trim(), phone: form.phone.trim() },
            emailRedirectTo: window.location.origin + target,
          },
        });
        if (error) throw error;
        toast.success("تم إنشاء حسابك", {
          description: "تحقق من بريدك الإلكتروني لتأكيد الحساب ثم سجّل الدخول.",
        });
        setMode("login");
      }
    } catch (err) {
      toast.error("تعذر إتمام العملية", {
        description: err instanceof Error ? err.message : "حاول مرة أخرى",
      });
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    sessionStorage.setItem("ora.auth.next", target);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + target },
    });
    if (error) {
      setBusy(false);
      toast.error("تعذر تسجيل الدخول بحساب Google", { description: error.message });
    }
    // المستخدم بيتحول لصفحة جوجل، وuseEffect هيتولى التوجيه بعد الرجوع
  };

  return (
    <PageShell title="حسابك في أورا" description="سجّل الدخول لمتابعة طلباتك وحفظ بياناتك بأمان.">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
          {/* التبويبات */}
          <div className="mb-6 grid grid-cols-2 rounded-full bg-secondary p-1 text-sm font-semibold">
            {(
              [
                ["login", "تسجيل الدخول"],
                ["signup", "حساب جديد"],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-full py-2 transition-colors ${
                  mode === m ? "bg-primary text-primary-foreground" : "text-primary/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="grid gap-4">
            {mode === "signup" && (
              <>
                <Field
                  id="name"
                  label="الاسم الكامل"
                  icon={User}
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="أحمد الباز"
                />
                <Field
                  id="phone"
                  label="رقم الموبايل"
                  icon={Phone}
                  type="tel"
                  dir="ltr"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="01xxxxxxxxx"
                />
              </>
            )}
            <Field
              id="email"
              label="البريد الإلكتروني"
              icon={Mail}
              type="email"
              dir="ltr"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
            <Field
              id="password"
              label="كلمة المرور"
              icon={Lock}
              type="password"
              dir="ltr"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
            <button
              type="submit"
              disabled={busy}
              className="mt-1 flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {mode === "login" ? "دخول" : "إنشاء الحساب"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> أو <span className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={google}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background py-3 text-sm font-semibold text-primary transition-colors hover:bg-secondary disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.2 3.7-8.8z" />
              <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.9-2.1-6.8-5l-3.9 3C3.3 21.3 7.3 24 12 24z" />
              <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-3.9-3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l3.9-3z" />
              <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l3.9 3c.9-2.8 3.6-4.9 6.8-4.9z" />
            </svg>
            المتابعة بحساب Google
          </button>
        </div>
      </div>
    </PageShell>
  );
}
