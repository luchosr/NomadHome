import { t } from "@nomadhome/shared";
import { useAuth } from "../contexts/auth.js";
import type { ReactNode } from "react";

interface Props {
  role: string;
  children: ReactNode;
}

export function RoleGuard({ role, children }: Props) {
  const { user } = useAuth();

  if (!user?.roles.includes(role)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-slate-800">{t("auth.forbidden.title")}</h1>
        <p className="text-slate-500">{t("auth.forbidden.message")}</p>
      </div>
    );
  }

  return <>{children}</>;
}
