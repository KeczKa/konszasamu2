export function Crest({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#9A3412" />
      <path d="M32 12l3.2 6.8 7.3.8-5.4 5 1.5 7.2L32 28l-6.6 3.8 1.5-7.2-5.4-5 7.3-.8z" fill="#FDBA74" />
      <path d="M14 40c6-3 12-3 18 0 6-3 12-3 18 0v10c-6-3-12-3-18 0-6-3-12-3-18 0z" fill="#FFF7ED" />
      <path d="M32 40v10" stroke="#9A3412" strokeWidth="2" />
    </svg>
  );
}
