import { Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import { Button, Input } from "@nomadhome/ui";
import { useRegister } from "../hooks/useRegister.js";
import { FormField } from "../components/FormField.js";
import { ServerErrorAlert } from "../components/ServerErrorAlert.js";

export function RegisterPage() {
  const {
    register,
    handleSubmit,
    onSubmit,
    formState: { errors, isSubmitting, isValid },
    serverError,
  } = useRegister();

  return (
    <div className="mx-auto max-w-sm px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-fg-1">{t("auth.register.title")}</h1>
        <p className="mt-1 text-sm text-fg-3">{t("auth.register.subtitle")}</p>
      </div>

      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
        <FormField id="email" label={t("auth.register.email_label")} error={errors.email?.message}>
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
          label={t("auth.register.password_label")}
          error={errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </FormField>

        <FormField
          id="confirmPassword"
          label={t("auth.register.confirm_password_label")}
          error={errors.confirmPassword?.message}
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
        </FormField>

        <ServerErrorAlert error={serverError} />

        <Button type="submit" className="w-full" disabled={isSubmitting || !isValid}>
          {t("auth.register.submit")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-fg-3">
        {t("auth.register.have_account")}{" "}
        <Link to="/login" className="font-medium text-fg-1 hover:underline">
          {t("auth.register.login_link")}
        </Link>
      </p>
    </div>
  );
}
