import { Heart } from "lucide-react";
import { toast } from "sonner";

import { useFavorites } from "@/lib/favorites";
import { useT } from "@/lib/i18n";

export function FavoriteButton({
  slug,
  title,
  className = "",
}: {
  slug: string;
  title: string;
  className?: string;
}) {
  const { has, toggle } = useFavorites();
  const t = useT();
  const fav = has(slug);

  return (
    <button
      type="button"
      aria-pressed={fav}
      aria-label={`${fav ? t("إزالة من المفضلة") : t("أضف للمفضلة")} — ${t(title)}`}
      onClick={() => {
        toggle(slug);
        toast.success(fav ? t("تمت الإزالة من المفضلة") : t("تمت الإضافة للمفضلة"), {
          description: t(title),
        });
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 text-primary transition-colors hover:text-gold-deep ${className}`}
    >
      <Heart className={`h-4 w-4 ${fav ? "fill-gold-deep text-gold-deep" : ""}`} />
    </button>
  );
}
