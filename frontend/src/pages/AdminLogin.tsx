import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";
import { apiPost, ApiError } from "@/lib/api";
import type { AdminUser } from "@/lib/types";
import { Crest } from "@/components/Crest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function errorDetail(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const d = (err.body as { detail?: unknown })?.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return d.map((e) => (e && typeof e.msg === "string" ? e.msg : "")).filter(Boolean).join(" ") || fallback;
  }
  return fallback;
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.2-2.1 3.7-5.1 3.7-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.8-5.1l-3.9 3C3.1 21.3 7.2 24 12 24z" />
      <path fill="#FBBC05" d="M5.2 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3l-3.9-3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.3l3.9-3z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.2 0 3.1 2.7 1.3 6.7l3.9 3c.9-2.9 3.6-5 6.8-5z" />
    </svg>
  );
}

export default function AdminLogin() {
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const toasted = useRef(false);

  const oauthError = (location.state as { error?: string } | null)?.error;
  useEffect(() => {
    if (oauthError && !toasted.current) {
      toasted.current = true;
      toast.error(t.admin.loginError, { description: oauthError });
    }
  }, [oauthError, t]);

  const login = useMutation({
    mutationFn: () => apiPost<AdminUser>("/auth/login", { email, password }),
    onSuccess: () => navigate("/admin"),
    onError: (err) => toast.error(t.admin.loginError, { description: errorDetail(err, t.admin.loginError) }),
  });

  const signInWithGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/admin";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div data-testid="admin-login-page" className="grid min-h-screen bg-cream lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-ink p-12 text-cream lg:flex">
        <Link to="/" data-testid="login-home-link" className="flex items-center gap-3">
          <Crest className="h-11 w-11" />
          <span className="font-heading text-lg font-semibold">{t.brand.name}</span>
        </Link>
        <blockquote>
          <p className="font-heading text-3xl font-medium italic leading-snug">{t.quote.text}</p>
          <footer className="mt-5 text-sm text-stone-400">{t.quote.author}</footer>
        </blockquote>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone-500">{t.brand.location}</p>
      </div>

      <div className="flex items-center justify-center px-5 py-16 sm:px-10">
        <div className="w-full max-w-md rounded-3xl border border-border bg-white p-8 shadow-[0_4px_24px_-2px_rgba(28,25,23,0.06)] sm:p-10">
          <div className="flex items-center gap-3 lg:hidden">
            <Crest className="h-10 w-10" />
            <span className="font-heading text-lg font-semibold text-ink">{t.brand.nameShort}</span>
          </div>
          <p className="mt-6 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-clay lg:mt-0">{t.admin.portal}</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-ink">{t.admin.loginTitle}</h1>
          <p className="mt-2 text-sm text-stone-500">{t.admin.loginIntro}</p>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={signInWithGoogle}
            data-testid="google-login-button"
            className="mt-8 w-full rounded-full border-ink/20"
          >
            <GoogleMark />
            {t.admin.googleSignIn}
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-stone-400">
            <span className="h-px flex-1 bg-border" />
            <span>{t.admin.googleOr}</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form data-testid="admin-login-form" onSubmit={(e) => { e.preventDefault(); login.mutate(); }}>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="admin-email">{t.admin.email}</Label>
                <Input id="admin-email" type="email" autoComplete="username" data-testid="admin-email-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">{t.admin.password}</Label>
                <Input id="admin-password" type="password" autoComplete="current-password" data-testid="admin-password-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={login.isPending}
                data-testid="admin-login-submit"
                className="w-full rounded-full bg-clay text-clay-foreground hover:bg-clay/90"
              >
                <LogIn className="mr-1 h-4 w-4" />
                {login.isPending ? t.admin.signingIn : t.admin.signIn}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
