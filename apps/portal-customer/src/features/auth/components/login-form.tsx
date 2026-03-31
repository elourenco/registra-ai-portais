import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  LoaderCircleIcon,
  ShieldCheckIcon,
} from "@registra/ui";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/app/providers/auth-provider";
import { loginRequest } from "@/features/auth/api/auth-api";
import { getBuyerProcessQueryOptions } from "@/features/buyer-onboarding/hooks/use-buyer-process-query";
import {
  customerLoginSchema,
  type CustomerLoginInput,
} from "@/features/auth/core/customer-login-schema";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { portalConfig } from "@/shared/config/portal-config";
import { routes } from "@/shared/constants/routes";

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function LoginForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CustomerLoginInput>({
    resolver: zodResolver(customerLoginSchema),
    defaultValues: {
      documentNumber: "",
      accessCode: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: async (session) => {
      login(session);
      await queryClient.prefetchQuery(getBuyerProcessQueryOptions(session));
      navigate(routes.process, { replace: true });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <Card>
        <CardHeader>
          <div
            className={`mb-3 inline-flex w-fit rounded-full bg-gradient-to-r ${portalConfig.gradient} p-2`}
          >
            <ShieldCheckIcon className="h-5 w-5 text-white" />
          </div>
          <CardTitle>Acessar {portalConfig.name}</CardTitle>
          <CardDescription>{portalConfig.tagline}</CardDescription>
        </CardHeader>

        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
          >
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                autoFocus
                inputMode="numeric"
                placeholder="000.000.000-00"
                {...register("documentNumber", {
                  onChange: (event) => {
                    setValue("documentNumber", formatCpf(event.target.value), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  },
                })}
              />
              {errors.documentNumber ? (
                <p className="text-sm text-red-500">{errors.documentNumber.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessCode">Código de acesso</Label>
              <Input
                id="accessCode"
                placeholder="Digite o código recebido"
                {...register("accessCode")}
              />
              {errors.accessCode && (
                <p className="text-sm text-red-500">{errors.accessCode.message}</p>
              )}
            </div>

            {loginMutation.isError && (
              <p className="text-sm text-red-500">
                {getApiErrorMessage(
                  loginMutation.error,
                  "Falha ao autenticar. Tente novamente em alguns segundos.",
                )}
              </p>
            )}

            <Button className="w-full" type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? (
                <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
