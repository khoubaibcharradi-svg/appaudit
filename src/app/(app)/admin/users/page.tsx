import CreateUserForm from "@/components/CreateUserForm";
import { listUsers } from "@/lib/store/users";

export default async function UsersPage() {
  const users = await listUsers();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Administration</p>
        <h1 className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">Utilisateurs</h1>
      </div>

      <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Créer un compte</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Les administrateurs créent les formulaires d&apos;audit. Le personnel les remplit sur le terrain.
        </p>
        <div className="mt-4">
          <CreateUserForm />
        </div>
      </div>

      <div className="rounded-2xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
        <div className="flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-black dark:text-zinc-50">{u.name}</p>
                <p className="text-xs text-zinc-500">{u.email}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  u.role === "ADMIN"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                }`}
              >
                {u.role === "ADMIN" ? "Admin" : "Personnel"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
