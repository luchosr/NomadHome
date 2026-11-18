import { useQuery, useQueryClient } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { Button, Skeleton } from "@nomadhome/ui";
import { adminApi, type AdminUser } from "../api/admin.js";
import { PageWrapper } from "../components/PageWrapper.js";

const FLAT_SECONDARY = "border-2 ![box-shadow:none]";

/** Account state as shape plus text: solid with a marker (active), struck through (disabled). */
function AccountStatusTag({ disabledAt }: { disabledAt: string | null }) {
  const active = disabledAt === null;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-sm border-2 bg-surface-raised px-2 py-1 text-xs font-bold ${
        active
          ? "border-solid border-border text-fg"
          : "border-solid border-border-muted text-fg-muted line-through"
      }`}
    >
      {active && <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-ink" />}
      {active ? t("admin.users.active") : t("admin.users.disabled")}
    </span>
  );
}

function StatePanel({ children }: { children: string }) {
  return (
    <div
      role="alert"
      className="mx-auto flex min-w-0 max-w-[36rem] items-start gap-4 rounded-card border-2 border-solid border-danger bg-danger-bg p-6"
    >
      <span
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-danger bg-danger text-fg-inverse"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="square"
          strokeLinejoin="miter"
          focusable={false}
        >
          <path d="M12 5v9M12 18v1" />
        </svg>
      </span>
      <h1 className="m-0 min-w-0 break-words text-2xl font-bold leading-tight text-danger">
        {children}
      </h1>
    </div>
  );
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

  const renderAction = (user: AdminUser, className: string) =>
    user.disabledAt === null ? (
      <Button
        variant="destructive"
        className={`min-h-11 ${className}`}
        onClick={() => void handleDisable(user.id)}
      >
        {t("admin.users.disable")}
      </Button>
    ) : (
      <Button
        variant="secondary"
        className={`min-h-11 ${FLAT_SECONDARY} ${className}`}
        onClick={() => void handleEnable(user.id)}
      >
        {t("admin.users.enable")}
      </Button>
    );

  if (isLoading) {
    return (
      <PageWrapper>
        <div aria-busy="true">
          <Skeleton className="mb-6 h-8 w-44" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-border-muted pb-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/5" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-11 w-20" />
              </div>
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (error || !data) {
    return (
      <PageWrapper>
        <StatePanel>{t("error.generic.unexpected")}</StatePanel>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <h1 className="m-0 mb-6 text-3xl font-black leading-solid text-fg md:text-4xl">
        {t("admin.users.title")}
      </h1>

      {data.data.length === 0 ? (
        <div className="rounded-card border-2 border-dashed border-border bg-surface-raised px-6 py-12">
          <p className="m-0 text-fg-muted">{t("admin.users.no_users")}</p>
        </div>
      ) : (
        <>
          <ul className="m-0 flex list-none flex-col gap-4 p-0 sm:hidden">
            {data.data.map((user: AdminUser) => (
              <li
                key={user.id}
                className="min-w-0 rounded-card border-2 border-border bg-surface-raised p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="m-0 min-w-0 break-all font-bold text-fg">{user.email}</p>
                  <AccountStatusTag disabledAt={user.disabledAt} />
                </div>
                <dl className="m-0 mt-3 text-sm">
                  <div className="min-w-0">
                    <dt className="font-bold text-fg">{t("admin.users.roles_col")}</dt>
                    <dd className="m-0 text-fg-muted">{user.roles.join(", ")}</dd>
                  </div>
                </dl>
                <div className="mt-4">{renderAction(user, "w-full sm:w-auto")}</div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border text-left">
                  <th className="pb-2 pr-4 font-bold text-fg">{t("admin.users.email_col")}</th>
                  <th className="pb-2 pr-4 font-bold text-fg">{t("admin.users.roles_col")}</th>
                  <th className="pb-2 pr-4 font-bold text-fg">{t("admin.users.status_col")}</th>
                  <th className="pb-2 font-bold text-fg">{t("admin.users.actions_col")}</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((user: AdminUser) => (
                  <tr key={user.id} className="border-b border-border-muted last:border-0">
                    <td className="py-3 pr-4 text-fg">{user.email}</td>
                    <td className="py-3 pr-4 text-fg-muted">{user.roles.join(", ")}</td>
                    <td className="py-3 pr-4">
                      <AccountStatusTag disabledAt={user.disabledAt} />
                    </td>
                    <td className="py-3">{renderAction(user, "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageWrapper>
  );
}
