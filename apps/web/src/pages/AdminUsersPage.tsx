import { useQuery, useQueryClient } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { Badge, Button } from "@nomadhome/ui";
import { adminApi, type AdminUser } from "../api/admin.js";
import { PageWrapper } from "../components/PageWrapper.js";

function userStatusTone(disabledAt: string | null): "success" | "danger" {
  return disabledAt === null ? "success" : "danger";
}

function userStatusLabel(disabledAt: string | null): string {
  return disabledAt === null ? t("admin.users.active") : t("admin.users.disabled");
}

export function AdminUsersPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminApi.listUsers(),
  });

  const handleDisable = async (id: string) => {
    await adminApi.disableUser(id);
    void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  const handleEnable = async (id: string) => {
    await adminApi.enableUser(id);
    void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  if (isLoading) return <p className="text-slate-500">Loading...</p>;

  if (error || !data) {
    return (
      <p role="alert" className="text-red-600">
        {t("error.generic.unexpected")}
      </p>
    );
  }

  return (
    <PageWrapper>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">{t("admin.users.title")}</h1>

      {data.data.length === 0 ? (
        <p className="text-slate-600">{t("admin.users.no_users")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 pr-4 font-medium">{t("admin.users.email_col")}</th>
                <th className="pb-2 pr-4 font-medium">{t("admin.users.roles_col")}</th>
                <th className="pb-2 pr-4 font-medium">{t("admin.users.status_col")}</th>
                <th className="pb-2 font-medium">{t("admin.users.actions_col")}</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((user: AdminUser) => (
                <tr key={user.id} className="border-b border-slate-200 last:border-0">
                  <td className="py-3 pr-4 text-slate-900">{user.email}</td>
                  <td className="py-3 pr-4 text-slate-600">{user.roles.join(", ")}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={userStatusTone(user.disabledAt)}>
                      {userStatusLabel(user.disabledAt)}
                    </Badge>
                  </td>
                  <td className="py-3">
                    {user.disabledAt === null ? (
                      <Button variant="destructive" onClick={() => void handleDisable(user.id)}>
                        {t("admin.users.disable")}
                      </Button>
                    ) : (
                      <Button variant="secondary" onClick={() => void handleEnable(user.id)}>
                        {t("admin.users.enable")}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageWrapper>
  );
}
