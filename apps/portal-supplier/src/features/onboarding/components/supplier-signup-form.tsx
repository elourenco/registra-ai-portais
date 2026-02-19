import { zodResolver } from "@hookform/resolvers/zod";
import { type SupplierCompanyProfile, type SupplierSignupInput, supplierSignupSchema } from "@registra/shared";
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
} from "@registra/ui";
import { useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { signupSupplier } from "@/features/onboarding/api/onboarding-api";
import { ApiClientError, getApiErrorMessage } from "@/shared/api/http-client";
import { routes } from "@/shared/constants/routes";

interface SupplierSignupFormProps {
  company: SupplierCompanyProfile;
}

export function SupplierSignupForm({ company }: SupplierSignupFormProps) {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierSignupInput>({
    resolver: zodResolver(supplierSignupSchema),
    defaultValues: {
      cnpj: company.cnpj,
      legalName: company.legalName,
      tradeName: company.tradeName,
      legalRepresentativeName: company.legalRepresentativeName ?? "",
      contactPhone: company.contactPhone ?? "",
      zipCode: company.zipCode ?? "",
      street: company.street ?? "",
      number: company.number ?? "",
      complement: company.complement ?? "",
      district: company.district ?? "",
      city: company.city,
      state: company.state,
      email: company.email ?? "",
      password: "",
    },
  });

  const zipCodeField = register("zipCode", {
    onChange: (event) => {
      const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
      event.target.value = digits.replace(/^(\d{5})(\d)/, "$1-$2");
    },
  });

  const contactPhoneField = register("contactPhone", {
    onChange: (event) => {
      const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
      if (digits.length <= 10) {
        event.target.value = digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
        return;
      }
      event.target.value = digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
    },
  });

  const signupMutation = useMutation({
    mutationFn: signupSupplier,
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signupMutation.mutateAsync(values);
      navigate(routes.login, {
        replace: true,
        state: {
          signupSuccessEmail: values.email,
        },
      });
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        navigate(routes.login, {
          replace: true,
          state: {
            registeredEmail: values.email,
          },
        });
      }

      // O estado de erro ja e tratado pelo React Query.
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl"
    >
      <Card>
        <CardHeader>
          <CardTitle>Cadastro do fornecedor</CardTitle>
          <CardDescription>
            Revise os dados recuperados do CNPJ e conclua seu acesso ao portal.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" type="text" readOnly {...register("cnpj")} />
              {errors.cnpj && <p className="text-sm text-red-500">{errors.cnpj.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="legalName">Razao social</Label>
              <Input id="legalName" type="text" {...register("legalName")} />
              {errors.legalName && <p className="text-sm text-red-500">{errors.legalName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tradeName">Nome fantasia</Label>
              <Input id="tradeName" type="text" {...register("tradeName")} />
              {errors.tradeName && <p className="text-sm text-red-500">{errors.tradeName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="legalRepresentativeName">Responsavel legal</Label>
              <Input id="legalRepresentativeName" type="text" {...register("legalRepresentativeName")} />
              {errors.legalRepresentativeName && (
                <p className="text-sm text-red-500">{errors.legalRepresentativeName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Telefone de contato</Label>
              <Input
                id="contactPhone"
                type="tel"
                placeholder="(11) 99999-9999"
                maxLength={15}
                {...contactPhoneField}
              />
              {errors.contactPhone && <p className="text-sm text-red-500">{errors.contactPhone.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input id="zipCode" type="text" placeholder="00000-000" maxLength={9} {...zipCodeField} />
                {errors.zipCode && <p className="text-sm text-red-500">{errors.zipCode.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" type="text" {...register("city")} />
                {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="state">UF</Label>
                <Input id="state" type="text" maxLength={2} {...register("state")} />
                {errors.state && <p className="text-sm text-red-500">{errors.state.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">Bairro</Label>
                <Input id="district" type="text" {...register("district")} />
                {errors.district && <p className="text-sm text-red-500">{errors.district.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="street">Logradouro</Label>
                <Input id="street" type="text" {...register("street")} />
                {errors.street && <p className="text-sm text-red-500">{errors.street.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Numero</Label>
                <Input id="number" type="text" {...register("number")} />
                {errors.number && <p className="text-sm text-red-500">{errors.number.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement">Complemento (opcional)</Label>
                <Input id="complement" type="text" {...register("complement")} />
                {errors.complement && <p className="text-sm text-red-500">{errors.complement.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail de acesso</Label>
              <Input id="email" type="email" placeholder="voce@empresa.com" {...register("email")} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="******" {...register("password")} />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            {signupMutation.isError && (
              <p className="text-sm text-red-500">
                {getApiErrorMessage(
                  signupMutation.error,
                  "Nao foi possivel concluir o cadastro agora. Tente novamente.",
                )}
              </p>
            )}

            <Button className="w-full" type="submit" disabled={signupMutation.isPending}>
              {signupMutation.isPending ? (
                <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Finalizar cadastro
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              CNPJ incorreto?{" "}
              <Link className="font-medium text-primary hover:underline" to={routes.onboarding}>
                Voltar para onboarding
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
