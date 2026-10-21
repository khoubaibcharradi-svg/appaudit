import CreateUserForm from "@/components/CreateUserForm";
import UserStatusToggle from "@/components/UserStatusToggle";
import { getSession } from "@/lib/auth/session";
import { Role } from "@/lib/auth/types";
import { listUsers, suggestNextCode } from "@/lib/store/users";

const ROLE_BADGE: Record<Role, string> = {
  SUPERADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
  ADMIN: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  PERSONNEL: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
};

const ROLE_LABEL: Record<Role, string> = {
  SUPERADMIN: "Superadmin",
  ADMIN: "Admin",
  PERSONNEL: "Personnel",
};

export default async function UsersPage() {
  const session = await getSession();
  const users = await listUsers();
  const canGrantAdmin = session?.role === "SUPERADMIN";
  const [nextPersonnelCode, nextAdminCode, nextSuperadminCode] = await Promise.all([
    suggestNextCode("PERSONNEL"),
    suggestNextCode("ADMIN"),
    suggestNextCode("SUPERADMIN"),
  ]);
  const nextCodeByRole: Record<Role, string> = {
    PERSONNEL: nextPersonnelCode,
    ADMIN: nextAdminCode,
    SUPERADMIN: nextSuperadminCode,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Administration</p>
        <h1 className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">Utilisateurs</h1>
      </div>

      <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Créer un compte</h2>
        <p className="mt-1 text-xs text-zinc-500">
          {canGrantAdmin
            ? "En tant que superadmin, vous pouvez créer des comptes personnel, admin ou superadmin."
            : "Vous pouvez créer des comptes personnel. Seul un superadmin peut créer des comptes admin."}
        </p>
        <div className="mt-4">
          <CreateUserForm canGrantAdmin={canGrantAdmin} nextCodeByRole={nextCodeByRole} />
        </div>
      </div>

      <div className="rounded-2xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
        <div className="flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
          {users.map((u) => {
            const isSelf = u.email.toLowerCase() === session?.email.toLowerCase();
            const canManage = !isSelf && (u.role === "PERSONNEL" || canGrantAdmin);
            return (
              <div key={u.email} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium text-black dark:text-zinc-50">
                    {u.name} <span className="font-normal text-zinc-500">· {u.codeUser}</span>
                  </p>
                  <p className="text-xs text-zinc-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[u.role]}`}>
                    {ROLE_LABEL[u.role]}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.isActive
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                        : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                    }`}
                  >
                    {u.isActive ? "Actif" : "Désactivé"}
                  </span>
                  {canManage && <UserStatusToggle email={u.email} isActive={u.isActive} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
