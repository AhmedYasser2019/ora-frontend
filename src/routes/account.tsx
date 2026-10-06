import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  FlaskConical,
  KeyRound,
  LoaderCircle,
  LogOut,
  Save,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { useT } from "@/lib/i18n";
import { BAD_IMAGE, ImageDrop, isIdImage } from "@/components/ImageDrop";
import { PageShell } from "@/components/PageShell";
import { api, ApiError, hasRealToken, upload } from "@/lib/api";
import { fullName } from "@/lib/auth-validation";
import { useAuth } from "@/lib/use-auth";

import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: tr("حسابي | زاد جولد") },
      { name: "description", content: tr("إدارة بيانات حسابك في زاد جولد.") },
      { property: "og:title", content: tr("حسابي | زاد جولد") },
      { property: "og:description", content: tr("إدارة بيانات حسابك.") },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

/**
 * حالة التوثيق كما يراها الخادم — `GET /kyc`. الشاشة كانت تكتب "حساب موثّق" لكل زائر،
 * وهي جملة عن حالة لا تعرفها: الوثائق تُرفع عند التسجيل وتُراجَع بعده، فالحالة تُقرأ ولا تُفترض.
 */
type KycStatus = "unverified" | "pending" | "approved" | "rejected";
type Kyc = {
  status: KycStatus;
  status_label: string;
  /** الأحدث أولًا. `note` سبب الرفض كما كتبه المراجع. */
  documents: { id: number; type: string; status: KycStatus; note: string | null }[];
};

const SIDE_LABEL: Record<string, string> = {
  national_id_front: "الوجه الأمامي للبطاقة",
  national_id_back: "الوجه الخلفي للبطاقة",
  selfie: "صورة شخصية",
};

/** الأيقونة ولونها لكل حالة. النص نفسه يأتي مترجمًا من الخادم في status_label. */
const KYC_LOOK = {
  approved: { Icon: ShieldCheck, tone: "text-gold-deep" },
  pending: { Icon: ShieldQuestion, tone: "text-muted-foreground" },
  rejected: { Icon: ShieldAlert, tone: "text-destructive" },
  unverified: { Icon: ShieldQuestion, tone: "text-muted-foreground" },
} as const;

function AccountPage() {
  const { user, loading, signOut, switchDemo } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const [profile, setProfile] = useState({ full_name: "", phone: "", current_password: "" });
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth", search: { next: "/account" } });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    // useAuth حمّل /me بالفعل، فالبيانات هنا هي نفسها بلا نداء ثانٍ.
    setProfile({ full_name: user.name ?? "", phone: user.phone ?? "", current_password: "" });
    setFetching(false);
  }, [user]);

  // رقم جديد يطلب كلمة المرور الحالية: الرمز المسروق وحده لا ينقل الحساب لرقم آخر.
  const phoneChanged = !!user && profile.phone.trim() !== (user.phone ?? "");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const name = fullName.safeParse(profile.full_name);
    if (!name.success) {
      toast.error(t(name.error.issues[0]?.message ?? ""));
      return;
    }
    setSaving(true);
    try {
      await api("/me", {
        method: "PATCH",
        body: {
          name: name.data,
          ...(phoneChanged
            ? { phone: profile.phone.trim(), current_password: profile.current_password }
            : {}),
        },
      });
      setProfile((p) => ({ ...p, current_password: "" }));
      toast.success(t("تم حفظ بياناتك"));
    } catch (e) {
      toast.error(t(e instanceof ApiError ? e.firstMessage : "تعذر حفظ البيانات"));
    } finally {
      setSaving(false);
    }
  };

  const toggleDemo = async () => {
    setSwitching(true);
    try {
      await switchDemo();
      toast.success(t(user?.is_demo ? "رجعت لحسابك الحقيقي" : "أنت الآن في وضع الديمو"));
    } catch (e) {
      toast.error(t(e instanceof ApiError ? e.firstMessage : "تعذر التبديل"));
    } finally {
      setSwitching(false);
    }
  };

  const topUp = async () => {
    try {
      const r = await api<{ granted_egp: string }>("/demo/topup", { method: "POST" });
      toast.success(`${t("تمت إضافة رصيد تجريبي")}: ${r.granted_egp}`);
    } catch (e) {
      toast.error(t(e instanceof ApiError ? e.firstMessage : "تعذر الشحن"));
    }
  };

  const logout = async () => {
    await signOut();
    toast.success(t("تم تسجيل الخروج"));
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
    <PageShell title="حسابي" subtitle="بياناتك محفوظة بأمان وتُستخدم لتسريع إتمام طلباتك.">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
          <div className="mb-6 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-green text-gold">
              <User className="h-7 w-7" />
            </span>
            <div>
              <p className="font-display text-lg text-primary">
                {profile.full_name || t("عميل زاد جولد")}
              </p>
              {user.is_demo ? (
                <p className="text-xs font-semibold text-gold-deep">
                  {t("وضع الديمو — فلوس تجريبية")}
                </p>
              ) : (
                <p dir="ltr" className="text-xs text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
          </div>

          {fetching ? (
            <div className="flex justify-center py-8">
              <LoaderCircle className="h-6 w-6 animate-spin text-gold-deep" />
            </div>
          ) : (
            <form onSubmit={save} className="grid gap-4">
              <div>
                <label
                  htmlFor="full_name"
                  className="mb-1.5 block text-xs font-semibold text-primary"
                >
                  {t("الاسم الكامل")}
                </label>
                <input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-xs font-semibold text-primary">
                  {t("رقم الموبايل")}
                </label>
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
              {phoneChanged && (
                <div>
                  <label
                    htmlFor="current_password"
                    className="mb-1.5 block text-xs font-semibold text-primary"
                  >
                    {t("كلمة المرور الحالية")}
                  </label>
                  <PasswordInput
                    id="current_password"
                    autoComplete="current-password"
                    required
                    value={profile.current_password}
                    onChange={(e) => setProfile({ ...profile, current_password: e.target.value })}
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t("حفظ البيانات")}
              </button>
            </form>
          )}

          {/* الديمو لا يُوثَّق: فلوسه تجريبية. */}
          {!user.is_demo && <KycSection />}

          {/* حساب الديمو كلمة مروره عشوائية لا يعرفها أحد. */}
          {!user.is_demo && <ChangePassword />}

          <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
            {/* حساب ديمو مستقل مالوش حساب حقيقي يرجع له — الزر كان هيخرّجه بس. */}
            {(!user.is_demo || hasRealToken()) && (
              <button
                onClick={toggleDemo}
                disabled={switching}
                className="flex items-center gap-1.5 rounded-full border border-gold px-4 py-2 text-xs font-semibold text-gold-deep hover:bg-gold/10 disabled:opacity-60"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                {t(user.is_demo ? "رجوع لحسابي الحقيقي" : "جرّب وضع الديمو")}
              </button>
            )}
            {user.is_demo && (
              <button
                onClick={topUp}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-primary hover:bg-muted"
              >
                {t("اشحن رصيد تجريبي")}
              </button>
            )}
          </div>

          <div className="mt-5 flex justify-end border-t border-border pt-5">
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs font-semibold text-destructive hover:underline"
            >
              <LogOut className="h-3.5 w-3.5" /> {t("تسجيل الخروج")}
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/wallet" className="font-semibold text-gold-deep hover:underline">
            {t("افتح محفظتك")}
          </Link>
          {" · "}
          <Link to="/cart" className="font-semibold text-gold-deep hover:underline">
            {t("تابع سلتك من هنا")}
          </Link>
        </p>
      </div>
    </PageShell>
  );
}

/**
 * `PUT /me/password`. الخادم يُنهي جلسات الأجهزة الأخرى ويُبقي هذه، فلا خروج هنا.
 */
function ChangePassword() {
  const t = useT();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/me/password", {
        method: "PUT",
        body: { current_password: current, password: next, password_confirmation: next },
      });
      setCurrent("");
      setNext("");
      toast.success(t("تم تغيير كلمة المرور"), {
        description: t("تم تسجيل خروج أجهزتك الأخرى."),
      });
    } catch (e) {
      toast.error(t(e instanceof ApiError ? e.firstMessage : "تعذر تغيير كلمة المرور"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="mt-6 border-t border-border pt-5">
      <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary">
        <KeyRound className="h-3.5 w-3.5" /> {t("تغيير كلمة المرور")}
      </summary>
      <form onSubmit={submit} className="mt-4 grid gap-4">
        <div>
          <label htmlFor="cp_current" className="mb-1.5 block text-xs font-semibold text-primary">
            {t("كلمة المرور الحالية")}
          </label>
          <PasswordInput
            id="cp_current"
            autoComplete="current-password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="cp_new" className="mb-1.5 block text-xs font-semibold text-primary">
            {t("كلمة المرور الجديدة")}
          </label>
          <PasswordInput
            id="cp_new"
            autoComplete="new-password"
            required
            minLength={8}
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="flex items-center justify-center gap-2 rounded-full border border-primary py-2.5 text-sm font-semibold text-primary hover:bg-muted disabled:opacity-60"
        >
          {busy && <LoaderCircle className="h-4 w-4 animate-spin" />}
          {t("حفظ كلمة المرور")}
        </button>
      </form>
    </details>
  );
}

/** حقل كلمة مرور بزر إظهار/إخفاء، بنفس سلوك حقول صفحة الدخول. */
function PasswordInput({
  id,
  ...props
}: { id: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const t = useT();
  const [shown, setShown] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        {...props}
        type={shown ? "text" : "password"}
        className="w-full rounded-xl border border-input bg-background py-2.5 pe-10 ps-3 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
      />
      <button
        type="button"
        onClick={() => setShown(!shown)}
        aria-label={t(shown ? "إخفاء كلمة المرور" : "إظهار كلمة المرور")}
        aria-pressed={shown}
        aria-controls={id}
        className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
      >
        {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/**
 * حالة التوثيق ورفع الوثائق. من تخطّى الرفع عند التسجيل أو رُفضت وثيقته يكمل من هنا —
 * بدونها لا شراء. كل رفع صفّ جديد عند الخادم، فالرفض القديم يبقى سجلًا ولا يُمحى.
 */
function KycSection() {
  const t = useT();
  const qc = useQueryClient();
  const [docType, setDocType] = useState<"id" | "passport">("id");
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ front?: string[]; back?: string[] }>({});
  const [busy, setBusy] = useState(false);

  const { data: kyc } = useQuery({ queryKey: ["kyc"], queryFn: () => api<Kyc>("/kyc") });

  if (!kyc) {
    return (
      <p className="mt-6 border-t border-border pt-5 text-xs text-muted-foreground">
        {t("جارٍ قراءة حالة التوثيق…")}
      </p>
    );
  }

  const { Icon, tone } = KYC_LOOK[kyc.status];
  // الأحدث من كل نوع هو ما يُحتسب — نفس قاعدة الخادم.
  const latest = kyc.documents.filter((d, i, all) => all.findIndex((x) => x.type === d.type) === i);
  const refused = latest.filter((d) => d.status === "rejected");
  const canUpload = kyc.status === "unverified" || kyc.status === "rejected";

  const pick = (set: (f: File | null) => void, key: "front" | "back") => (f: File | null) => {
    const ok = !f || isIdImage(f);
    set(ok ? f : null);
    setErrors((x) => ({ ...x, [key]: ok ? undefined : [BAD_IMAGE] }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!front) errs.front = ["ارفع صورة الوجه الأمامي للهوية"];
    if (docType === "id" && !back) errs.back = ["ارفع صورة الوجه الخلفي للهوية"];
    setErrors(errs);
    if (errs.front || errs.back) return;

    const sides: [File | null, string][] = [
      [front, "national_id_front"],
      [docType === "id" ? back : null, "national_id_back"],
    ];
    setBusy(true);
    try {
      for (const [file, type] of sides) {
        if (!file) continue;
        const body = new FormData();
        body.append("type", type);
        body.append("file", file);
        qc.setQueryData(["kyc"], await upload<Kyc>("/kyc/documents", body));
      }
      setFront(null);
      setBack(null);
      toast.success(t("تم إرسال وثائقك للمراجعة"));
    } catch (e) {
      toast.error(t(e instanceof ApiError ? e.firstMessage : "تعذر رفع الصورة"));
    } finally {
      setBusy(false);
      // الدفع يقرأ الحالة من /me.
      void qc.invalidateQueries({ queryKey: ["me"] });
    }
  };

  return (
    <section className="mt-6 border-t border-border pt-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold text-primary">{t("التحقق من الهوية")}</h2>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className={`h-4 w-4 ${tone}`} /> {kyc.status_label}
        </span>
      </div>

      {refused.length > 0 && (
        <ul
          role="alert"
          className="mt-3 grid gap-1 rounded-2xl border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive"
        >
          {refused.map((d) => (
            <li key={d.id}>
              <span className="font-semibold">{t(SIDE_LABEL[d.type] ?? d.type)}:</span>{" "}
              {d.note || t("لم يُذكر سبب. تواصل معنا لو محتاج توضيح.")}
            </li>
          ))}
        </ul>
      )}

      {kyc.status === "pending" && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("وثائقك قيد المراجعة. هنبلغك أول ما تتراجع.")}
        </p>
      )}

      {canUpload && (
        <form onSubmit={submit} noValidate className="mt-4 grid gap-4">
          <p className="text-xs text-muted-foreground">
            {t(
              kyc.status === "rejected"
                ? "أعد رفع صور واضحة لوثيقتك."
                : "وثّق هويتك أولًا لإتمام عمليات الشراء.",
            )}
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-primary">
            {(
              [
                ["id", "بطاقة الرقم القومي"],
                ["passport", "جواز السفر"],
              ] as const
            ).map(([v, label]) => (
              <label key={v} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="kycDocType"
                  checked={docType === v}
                  onChange={() => {
                    setDocType(v);
                    setErrors({});
                  }}
                  className="accent-gold"
                />
                {t(label)}
              </label>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageDrop
              label={docType === "id" ? "الوجه الأمامي للبطاقة" : "صفحة بيانات الجواز"}
              file={front}
              onPick={pick(setFront, "front")}
              error={errors.front}
            />
            {docType === "id" && (
              <ImageDrop
                label="الوجه الخلفي للبطاقة"
                file={back}
                onPick={pick(setBack, "back")}
                error={errors.back}
              />
            )}
          </div>
          <button
            type="submit"
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {t("إرسال للمراجعة")}
          </button>
        </form>
      )}
    </section>
  );
}
