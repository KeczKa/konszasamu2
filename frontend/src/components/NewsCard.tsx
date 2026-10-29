import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ro as roLocale, hu as huLocale } from "date-fns/locale";
import { useLang, pick } from "@/lib/i18n";
import type { Post } from "@/lib/types";

export function NewsCard({ post }: { post: Post }) {
  const { lang } = useLang();
  return (
    <Link
      to={`/noutati/${post.id}`}
      data-testid={`news-card-${post.id}`}
      className="group block h-full overflow-hidden rounded-2xl border border-border bg-white transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_-6px_rgba(28,25,23,0.14)]"
    >
      {post.cover_image && (
        <div className="overflow-hidden">
          <img src={post.cover_image} alt={pick(lang, post, "title")} className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
      )}
      <div className="p-6">
        <p className="flex items-center gap-2 text-xs text-stone-500">
          <CalendarDays className="h-3.5 w-3.5" />
          {format(new Date(post.created_at), "d MMMM yyyy", { locale: lang === "ro" ? roLocale : huLocale })}
        </p>
        <h3 className="mt-3 font-heading text-lg font-semibold leading-snug text-ink transition-colors duration-200 group-hover:text-clay">
          {pick(lang, post, "title")}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-600">{pick(lang, post, "content")}</p>
      </div>
    </Link>
  );
}
