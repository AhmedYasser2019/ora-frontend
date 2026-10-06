import { Image as ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useT } from "@/lib/i18n";

/** صندوق رفع صورة مع معاينة */
export function ImageDrop({
  label,
  file,
  onPick,
  error,
}: {
  label: string;
  file: File | null;
  onPick: (f: File | null) => void;
  error?: string[] | undefined;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const t = useT();

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-gold-deep">{t(label)}</p>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={`flex h-44 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-cream/40 transition-colors ${
          error ? "border-destructive" : "border-gold/60 hover:border-gold"
        }`}
      >
        {preview ? (
          <img src={preview} alt={t(label)} className="h-full w-full object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
            <ImageIcon className="h-6 w-6 text-gold" />
            {t("اختر صورة")}
          </span>
        )}
      </button>
      {error && <p className="mt-1 text-xs text-destructive">{t(error[0] ?? "")}</p>}
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png"
        hidden
        onChange={(e) => {
          onPick(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** الـ accept مجرد اقتراح لنافذة الاختيار — "كل الملفات" يتخطاه، فنتحقق من النوع بأنفسنا. */
export const BAD_IMAGE = "صيغة الملف غير مدعومة. الرجاء رفع صورة بصيغة JPG أو PNG";
export const isIdImage = (f: File) => f.type === "image/jpeg" || f.type === "image/png";
