import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { RegisterSchema, t } from "@nomadhome/shared";
import { useAuth } from "../contexts/auth.js";
import { ApiError } from "../api/client.js";

const RegisterFormSchema = RegisterSchema.extend({
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: t("auth.register.passwords_mismatch"),
  path: ["confirmPassword"],
});

type RegisterFormInput = z.infer<typeof RegisterFormSchema>;

export function useRegister() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<RegisterFormInput>({ resolver: zodResolver(RegisterFormSchema), mode: "onChange" });

  const onSubmit = async (data: RegisterFormInput) => {
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

  return { register, handleSubmit, onSubmit, errors, isSubmitting, isValid, serverError };
}
