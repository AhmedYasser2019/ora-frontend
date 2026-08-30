import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LoaderCircle, LogOut, Save, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "حسابي | أورا للذهب" },
      { name: "description", content: "إدارة بيانات حسابك في أورا للذهب." },
      { property: "og:title", content: "حسابي | أورا للذهب" },
      { property: "og:description", content: "إدارة بيانات حسابك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ full_name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth", search: { next: "/account" } });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile({
          full_name: data?.full_name ?? (user.user_metadata?.full_name as string) ?? "",
          phone: data?.phone ?? "",
        });
        setFetching(false);
      });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profile.full_name.trim(), phone: profile.phone.trim(), updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error("تعذر حفظ البيانات");
    else toast.success("تم حفظ بياناتك");
  };

  const logout = async () => {
    await signOut();
    toast.success("تم تسجيل الخروج");
    navigate({ to: "/" });
  };

  if (loading || !user) {
    return (
      <PageShell title="حسابي">
        <div className="flex justify-center py-20">
          <LoaderCircle className="h-8 w-8 animate-spin text-gold-deep" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="حسابي" description="بياناتك محفوظة بأمان وتُستخدم لتسريع إتمام طلباتك.">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
          <div className="mb-6 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-green text-gold">
              <User className="h-7 w-7" />
            </span>
            <div>
              <p className="font-display text-lg text-primary">{profile.full_name || "عميل أورا"}</p>
              <p dir="ltr" className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {fetching ? (
            <div className="flex justify-center py-8">
              <LoaderCircle className="h-6 w-6 animate-spin text-gold-deep" />
            </div>
          ) : (
            <form onSubmit={save} className="grid gap-4">
              <div>
                <label htmlFor="full_name" className="mb-1.5 block text-xs font-semibold text-primary">الاسم الكامل</label>
                <input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-xs font-semibold text-primary">رقم الموبايل</label>
                <input
                  id="phone"
                  dir="ltr"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="01xxxxxxxxx"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                حفظ البيانات
              </button>
            </form>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-gold-deep" /> حساب موثّق بالبريد الإلكتروني
            </span>
            <button onClick={logout} className="flex items-center gap-1.5 text-xs font-semibold text-destructive hover:underline">
              <LogOut className="h-3.5 w-3.5" /> تسجيل الخروج
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          لديك طلبات؟ <Link to="/cart" className="font-semibold text-gold-deep hover:underline">تابع سلتك من هنا</Link>
        </p>
      </div>
    </PageShell>
  );
}
