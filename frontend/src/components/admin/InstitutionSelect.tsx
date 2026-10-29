import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (slug: string) => void;
  testId: string;
  id?: string;
  className?: string;
}

export function InstitutionSelect({ value, onChange, testId, id, className }: Props) {
  const { t } = useLang();
  return (
    <select
      id={id}
      required
      data-testid={testId}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        className
      )}
    >
      <option value="" disabled>{t.admin.chooseInstitution}</option>
      {t.members.map((m) => (
        <option key={m.slug} value={m.slug}>{m.name}</option>
      ))}
    </select>
  );
}
