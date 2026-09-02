import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { BecomeHostSchema, type BecomeHostInput, t } from "@nomadhome/shared";
import { Button, Input } from "@nomadhome/ui";
import { useAuth } from "../contexts/auth.js";
import { getDisplayMessage } from "../api/client.js";
import { useState } from "react";
import { FormField } from "../components/FormField.js";
import { ServerErrorAlert } from "../components/ServerErrorAlert.js";

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
      setServerError(getDisplayMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-fg-1">{t("identity.become_host.title")}</h1>
        <p className="mt-1 text-sm text-fg-3">{t("identity.become_host.subtitle")}</p>
      </div>

      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
        <FormField
          id="displayName"
          label={t("identity.become_host.display_name_label")}
          error={errors.displayName?.message}
        >
          <Input
            id="displayName"
            aria-invalid={!!errors.displayName}
            {...register("displayName")}
          />
        </FormField>

        <FormField
          id="payoutEmail"
          label={t("identity.become_host.payout_email_label")}
          error={errors.payoutEmail?.message}
        >
          <Input
            id="payoutEmail"
            type="email"
            aria-invalid={!!errors.payoutEmail}
            {...register("payoutEmail")}
          />
        </FormField>

        <div className="flex items-start gap-2">
          <input
            id="acceptedTerms"
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-muted"
            {...register("acceptedTerms")}
          />
          <label htmlFor="acceptedTerms" className="text-sm text-fg-2">
            {t("identity.become_host.terms_label")}
          </label>
        </div>
        {errors.acceptedTerms && (
          <p className="text-xs text-danger">{errors.acceptedTerms.message}</p>
        )}

        <ServerErrorAlert error={serverError} />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {t("identity.become_host.submit")}
        </Button>
      </form>
    </div>
  );
}
