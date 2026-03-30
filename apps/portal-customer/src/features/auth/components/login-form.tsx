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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@registra/ui";
import { useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/app/providers/auth-provider";
import { loginRequest } from "@/features/auth/api/mock-auth-api";
import {
  customerLoginSchema,
  type CustomerLoginInput,
} from "@/features/auth/core/customer-login-schema";
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

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 5) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }

  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }

  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerLoginInput>({
    resolver: zodResolver(customerLoginSchema),
    defaultValues: {
      identifierType: "cpf",
      documentNumber: "",
      accessCode: "",
    },
  });

  const identifierType = watch("identifierType");

  useEffect(() => {
    setValue("documentNumber", "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [identifierType, setValue]);

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (session) => {
      login(session);
      navigate(routes.dashboard, { replace: true });
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
              <Label>Documento</Label>
              <Tabs
                value={identifierType}
                onValueChange={(value) =>
                  setValue("identifierType", value as CustomerLoginInput["identifierType"], {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="cpf">CPF</TabsTrigger>
                  <TabsTrigger value="cnpj">CNPJ</TabsTrigger>
                </TabsList>

                <TabsContent value="cpf">
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
                </TabsContent>

                <TabsContent value="cnpj">
                  <Input
                    id="cnpj"
                    autoFocus
                    inputMode="numeric"
                    placeholder="00.000.000/0000-00"
                    {...register("documentNumber", {
                      onChange: (event) => {
                        setValue("documentNumber", formatCnpj(event.target.value), {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      },
                    })}
                  />
                </TabsContent>
              </Tabs>
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
                Falha ao autenticar. Tente novamente em alguns segundos.
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
