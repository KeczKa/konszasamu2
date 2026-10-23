import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { UserRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ROLE_KEYS = ["admin", "editor", "viewer"] as const;

export function UsersManager({ currentUserId }: { currentUserId: string }) {
  const { t } = useLang();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("viewer");

  const users = useQuery({ queryKey: ["users"], queryFn: () => apiGet<UserRecord[]>("/users") });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const add = useMutation({
    mutationFn: () => apiPost<UserRecord>("/users", { email, name, role }),
    onSuccess: () => {
      toast.success(t.admin.userAdded);
      setEmail(""); setName(""); setRole("viewer");
      invalidate();
    },
    onError: () => toast.error(t.admin.loginError),
  });

  const changeRole = useMutation({
    mutationFn: ({ id, newRole }: { id: string; newRole: string }) => apiPatch<UserRecord>(`/users/${id}`, { role: newRole }),
    onSuccess: () => { toast.success(t.admin.roleUpdated); invalidate(); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/users/${id}`),
    onSuccess: () => { toast.success(t.admin.userDeleted); invalidate(); },
  });

  return (
    <div className="mt-8">
      <p className="max-w-xl text-sm text-stone-500">{t.admin.usersHelp}</p>

      <form
        data-testid="user-add-form"
        onSubmit={(e) => { e.preventDefault(); add.mutate(); }}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-white p-5 shadow-[0_4px_24px_-2px_rgba(28,25,23,0.06)]"
      >
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.admin.userEmailPlaceholder}
          data-testid="user-email-input"
          className="w-full sm:w-64"
        />
        <Input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.admin.userNamePlaceholder}
          data-testid="user-name-input"
          className="w-full sm:w-48"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          data-testid="user-role-select"
          className="border-input bg-background flex h-9 rounded-md border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        >
          {ROLE_KEYS.map((r) => (
            <option key={r} value={r}>{t.admin.roles[r]}</option>
          ))}
        </select>
        <Button type="submit" disabled={add.isPending} data-testid="user-add-button" className="rounded-full bg-clay text-clay-foreground hover:bg-clay/90">
          <UserPlus className="mr-1 h-4 w-4" /> {t.admin.addUser}
        </Button>
      </form>

      <div className="mt-6 space-y-3">
        {(users.data ?? []).map((u) => (
          <div key={u.id} data-testid={`user-row-${u.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-4 shadow-[0_4px_24px_-2px_rgba(28,25,23,0.06)]">
            <div className="flex min-w-0 items-center gap-3">
              {u.picture && <img src={u.picture} alt="" className="h-9 w-9 rounded-full" />}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{u.name}</p>
                <p className="truncate text-xs text-stone-500">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={u.role}
                onChange={(e) => changeRole.mutate({ id: u.id, newRole: e.target.value })}
                data-testid={`user-role-${u.id}`}
                className="border-input bg-background flex h-9 rounded-md border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                {ROLE_KEYS.map((r) => (
                  <option key={r} value={r}>{t.admin.roles[r]}</option>
                ))}
              </select>
              {u.id !== currentUserId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => remove.mutate(u.id)}
                  data-testid={`user-delete-${u.id}`}
                  className="rounded-full border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
