import { zodResolver } from "@hookform/resolvers/zod";
import { formatCnpj, type SupplierOnboardingInput, supplierOnboardingSchema } from "@registra/shared";
import {
  Building2Icon,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  LoaderCircleIcon,
} from "@registra/ui";
import { useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { lookupSupplierByCnpj } from "@/features/onboarding/api/onboarding-api";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { portalConfig } from "@/shared/config/portal-config";
import { routes } from "@/shared/constants/routes";

export function SupplierOnboardingForm() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierOnboardingInput>({
    resolver: zodResolver(supplierOnboardingSchema),
    defaultValues: {
      cnpj: "",
    },
  });

  const cnpjField = register("cnpj", {
    onChange: (event) => {
      event.target.value = formatCnpj(event.target.value);
    },
  });

  const cnpjLookupMutation = useMutation({
    mutationFn: lookupSupplierByCnpj,
    onSuccess: ({ alreadyRegistered, company }) => {
      if (alreadyRegistered) {
        navigate(routes.login, {
          replace: true,
          state: {
            registeredCnpj: company.cnpj,
          },
        });
        return;
      }

      navigate(routes.supplierSignup, {
        state: {
          company,
        },
      });
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
            <Building2Icon className="h-5 w-5 text-white" />
          </div>
          <CardTitle>Onboarding de fornecedor</CardTitle>
          <CardDescription>
            Informe o CNPJ para validar, verificar duplicidade e pre-preencher os dados da empresa.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) => cnpjLookupMutation.mutate(values))}
          >
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                type="text"
                placeholder="AA.AAA.AAA/AAAA-00"
                autoComplete="off"
                maxLength={18}
                {...cnpjField}
              />
              {errors.cnpj && <p className="text-sm text-red-500">{errors.cnpj.message}</p>}
            </div>

            {cnpjLookupMutation.isError && (
              <p className="text-sm text-red-500">
                {getApiErrorMessage(
                  cnpjLookupMutation.error,
                  "Nao foi possivel validar o CNPJ agora. Tente novamente em alguns segundos.",
                )}
              </p>
            )}

            <Button className="w-full" type="submit" disabled={cnpjLookupMutation.isPending}>
              {cnpjLookupMutation.isPending ? (
                <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Validar e continuar
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
