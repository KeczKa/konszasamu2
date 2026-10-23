import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost, ApiError } from "@/lib/api";
import { useLang } from "@/lib/i18n";
import { Crest } from "@/components/Crest";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { t } = useLang();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const sessionId = new URLSearchParams(window.location.hash.slice(1)).get("session_id");
    if (!sessionId) {
      navigate("/admin/login", { replace: true });
      return;
    }
    apiPost("/auth/google-session", { session_id: sessionId })
      .then(() => {
        window.history.replaceState(null, "", "/admin");
        navigate("/admin", { replace: true });
      })
      .catch((err) => {
        const detail =
          err instanceof ApiError && typeof (err.body as { detail?: unknown })?.detail === "string"
            ? ((err.body as { detail: string }).detail)
            : t.admin.notRegistered;
        navigate("/admin/login", { replace: true, state: { error: detail } });
      });
  }, [navigate, t]);

  return (
    <div data-testid="auth-callback" className="flex min-h-screen items-center justify-center bg-cream">
      <div className="flex flex-col items-center gap-4">
        <Crest className="h-12 w-12 animate-pulse" />
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone-500">…</p>
      </div>
    </div>
  );
}
