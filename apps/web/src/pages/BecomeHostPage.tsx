import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { BecomeHostSchema, type BecomeHostInput, t } from "@nomadhome/shared";
import { Button, Input } from "@nomadhome/ui";
import { useAuth } from "../contexts/auth.js";
import { ApiError } from "../api/client.js";
import { useState } from "react";

export function BecomeHostPage() {
  const { becomeHost } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BecomeHostInput>({ resolver: zodResolver(BecomeHostSchema) });

  const onSubmit = async (data: BecomeHostInput) => {
    setServerError(null);
    try {
      await becomeHost(data);
      navigate("/host/listings");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setServerError(t("identity.become_host.already_host"));
      } else {
        setServerError(t("error.generic.unexpected"));
      }
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">{t("identity.become_host.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("identity.become_host.subtitle")}</p>
      </div>

      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-slate-700">
            {t("identity.become_host.display_name_label")}
          </label>
          <Input
            id="displayName"
            aria-invalid={!!errors.displayName}
            {...register("displayName")}
          />
          {errors.displayName && (
            <p className="mt-1 text-xs text-red-600">{errors.displayName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="payoutEmail" className="mb-1 block text-sm font-medium text-slate-700">
            {t("identity.become_host.payout_email_label")}
          </label>
          <Input
            id="payoutEmail"
            type="email"
            aria-invalid={!!errors.payoutEmail}
            {...register("payoutEmail")}
          />
          {errors.payoutEmail && (
            <p className="mt-1 text-xs text-red-600">{errors.payoutEmail.message}</p>
          )}
        </div>

        <div className="flex items-start gap-2">
          <input
            id="acceptedTerms"
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
            {...register("acceptedTerms")}
          />
          <label htmlFor="acceptedTerms" className="text-sm text-slate-700">
            {t("identity.become_host.terms_label")}
          </label>
        </div>
        {errors.acceptedTerms && (
          <p className="text-xs text-red-600">{errors.acceptedTerms.message}</p>
        )}

        {serverError && (
          <p role="alert" className="text-sm text-red-600">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {t("identity.become_host.submit")}
        </Button>
      </form>
    </div>
  );
}
