import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LoginSchema, type LoginInput, t } from "@nomadhome/shared";
import { Button, Input } from "@nomadhome/ui";
import { useAuth } from "../contexts/auth.js";
import { getDisplayMessage } from "../api/client.js";
import { useEffect, useState } from "react";
import { FormField } from "../components/FormField.js";
import { ServerErrorAlert } from "../components/ServerErrorAlert.js";

/** Where a user with these roles should land when there is no explicit redirect target. */
function roleLandingPath(roles: string[]): string {
  if (roles.includes("admin")) return "/admin/users";
  if (roles.includes("host")) return "/host/listings";
  return "/";
}

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Distinguish "no explicit `from` in state" (role-based redirect applies) from
  // "`from` resolved to the `/` fallback" (still an explicit redirect target).
  const explicitFrom = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
  const from = explicitFrom ?? "/";

  const [serverError, setServerError] = useState<string | null>(null);
  // Set after a successful login that had no explicit `from`: we must wait for
  // the auth context's `user` (populated asynchronously by `login`) before we
  // know the freshly logged-in user's roles, so we defer the navigation to the
  // effect below instead of reading a stale `user` value here.
  const [awaitingRoleRedirect, setAwaitingRoleRedirect] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });

  useEffect(() => {
    if (!awaitingRoleRedirect || !user) return;
    setAwaitingRoleRedirect(false);
    navigate(roleLandingPath(user.roles), { replace: true });
  }, [awaitingRoleRedirect, user, navigate]);

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      if (explicitFrom !== undefined) {
        navigate(from, { replace: true });
      } else {
        setAwaitingRoleRedirect(true);
      }
    } catch (err) {
      setServerError(getDisplayMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-fg-1">{t("auth.login.title")}</h1>
        <p className="mt-1 text-sm text-fg-3">{t("auth.login.subtitle")}</p>
      </div>

      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
        <FormField id="email" label={t("auth.login.email_label")} error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </FormField>

        <FormField
          id="password"
          label={t("auth.login.password_label")}
          error={errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </FormField>

        <ServerErrorAlert error={serverError} />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {t("auth.login.submit")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-fg-3">
        {t("auth.login.no_account")}{" "}
        <Link to="/register" className="font-medium text-fg-1 hover:underline">
          {t("auth.login.sign_up_link")}
        </Link>
      </p>
    </div>
  );
}
