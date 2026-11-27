import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { BecomeHostSchema, type BecomeHostInput, t } from "@nomadhome/shared";
import { Button, Input } from "@nomadhome/ui";
import { useAuth } from "../contexts/auth.js";
import { getDisplayMessage } from "../api/client.js";
import { useState } from "react";
import { errorIdFor, FormField } from "../components/FormField.js";
import { ServerErrorAlert } from "../components/ServerErrorAlert.js";
import { CHECKBOX_CLASS, ERROR_BAR_CLASS } from "../components/listingFormStyles.js";

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
      <div className="mb-8">
        <h1 className="m-0 text-3xl font-black leading-solid text-fg md:text-4xl">
          {t("identity.become_host.title")}
        </h1>
        <p className="m-0 mt-2 text-sm text-fg-muted">{t("identity.become_host.subtitle")}</p>
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

        <div>
          <div className="relative flex min-h-11 items-start gap-3 py-3">
            <input
              id="acceptedTerms"
              type="checkbox"
              className={CHECKBOX_CLASS}
              aria-invalid={!!errors.acceptedTerms}
              aria-describedby={errors.acceptedTerms ? errorIdFor("acceptedTerms") : undefined}
              {...register("acceptedTerms")}
            />
            <svg
              aria-hidden="true"
              focusable={false}
              viewBox="0 0 20 20"
              className="pointer-events-none absolute left-0 top-3 hidden h-5 w-5 text-fg-inverse peer-checked:block"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="square"
              strokeLinejoin="miter"
            >
              <path d="M4.5 10.5l3.5 3.5 7.5-8" />
            </svg>
            <label htmlFor="acceptedTerms" className="min-w-0 text-sm leading-5 text-fg">
              {t("identity.become_host.terms_label")}
            </label>
          </div>
          {errors.acceptedTerms && (
            <p id={errorIdFor("acceptedTerms")} className={ERROR_BAR_CLASS}>
              {errors.acceptedTerms.message}
            </p>
          )}
        </div>

        <ServerErrorAlert error={serverError} />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {t("identity.become_host.submit")}
        </Button>
      </form>
    </div>
  );
}
