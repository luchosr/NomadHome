import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { RegisterSchema, type RegisterInput, t } from "@nomadhome/shared";
import { Button, Input } from "@nomadhome/ui";
import { useAuth } from "../contexts/auth.js";
import { ApiError } from "../api/client.js";
import { useState } from "react";

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(RegisterSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    try {
      await registerUser(data.email, data.password);
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setServerError(t("auth.register.error"));
      } else {
        setServerError(t("error.generic.unexpected"));
      }
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">{t("auth.register.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("auth.register.subtitle")}</p>
      </div>

      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            {t("auth.register.email_label")}
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            {t("auth.register.password_label")}
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {serverError && (
          <p role="alert" className="text-sm text-red-600">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {t("auth.register.submit")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {t("auth.register.have_account")}{" "}
        <Link to="/login" className="font-medium text-slate-900 hover:underline">
          {t("auth.register.login_link")}
        </Link>
      </p>
    </div>
  );
}
