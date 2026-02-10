import { zodResolver } from "@hookform/resolvers/zod";
import { type LoginInput, loginSchema } from "@registra/shared";
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
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/auth-provider";
import { loginRequest } from "@/features/auth/api/mock-auth-api";
import { portalConfig } from "@/shared/config/portal-config";
import { routes } from "@/shared/constants/routes";

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

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
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@empresa.com"
                {...register("email")}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="******" {...register("password")} />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
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
