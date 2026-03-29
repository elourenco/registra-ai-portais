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
  Separator,
  useToast,
} from "@registra/ui";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AvatarUpload } from "@/features/settings/profile/avatar-upload";

const profileFormSchema = z
  .object({
    avatar: z.string().optional(),
    fullName: z.string().trim().min(3, "Informe o nome completo."),
    email: z.string().trim().email("Informe um e-mail válido."),
    role: z.string().trim().min(2, "Informe o cargo."),
    company: z.string().trim().min(2, "Informe a empresa."),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const isChangingPassword =
      Boolean(value.currentPassword) || Boolean(value.newPassword) || Boolean(value.confirmPassword);

    if (!isChangingPassword) {
      return;
    }

    if (!value.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currentPassword"],
        message: "Informe a senha atual.",
      });
    }

    if (!value.newPassword || value.newPassword.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: "A nova senha deve ter ao menos 8 caracteres.",
      });
    }

    if (value.newPassword !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "A confirmação da senha deve ser igual à nova senha.",
      });
    }
  });

type ProfileFormInput = z.input<typeof profileFormSchema>;
type ProfileFormValues = z.output<typeof profileFormSchema>;

const initialValues: ProfileFormValues = {
  avatar: "",
  fullName: "Super Usuário Supplier",
  email: "supplier@registra.ai",
  role: "Diretor Operacional",
  company: "Datanomik",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-rose-600">{message}</p>;
}

export function ProfileForm() {
  const { toast } = useToast();
  const form = useForm<ProfileFormInput, undefined, ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });

  const isSecurityDirty = useMemo(() => {
    const values = form.watch(["currentPassword", "newPassword", "confirmPassword"]);
    return values.some(Boolean);
  }, [form]);

  const onSubmit = form.handleSubmit(async (values) => {
    await new Promise((resolve) => setTimeout(resolve, 900));

    form.reset({
      ...values,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    toast({
      title: "Perfil atualizado",
      description: "As alterações do perfil foram salvas com sucesso.",
    });
  });

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>Gerencie suas informações pessoais, empresa e dados de segurança.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AvatarUpload
          value={form.watch("avatar")}
          onChange={(next) => form.setValue("avatar", next, { shouldDirty: true })}
        />

        <form className="space-y-6" onSubmit={onSubmit}>
          <section className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Informações básicas</h3>
              <p className="text-sm text-muted-foreground">Dados principais de identificação do usuário e da empresa.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full-name">Nome completo</Label>
                <Input id="full-name" {...form.register("fullName")} />
                <FieldError message={form.formState.errors.fullName?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" disabled {...form.register("email")} />
                <FieldError message={form.formState.errors.email?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Cargo</Label>
                <Input id="role" {...form.register("role")} />
                <FieldError message={form.formState.errors.role?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input id="company" {...form.register("company")} />
                <FieldError message={form.formState.errors.company?.message} />
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Segurança</h3>
              <p className="text-sm text-muted-foreground">Atualize sua senha sempre que houver mudança de acesso ou responsabilidade.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha atual</Label>
                <Input id="current-password" type="password" {...form.register("currentPassword")} />
                <FieldError message={form.formState.errors.currentPassword?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input id="new-password" type="password" {...form.register("newPassword")} />
                <FieldError message={form.formState.errors.newPassword?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <Input id="confirm-password" type="password" {...form.register("confirmPassword")} />
                <FieldError message={form.formState.errors.confirmPassword?.message} />
              </div>
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset(initialValues)}
              disabled={form.formState.isSubmitting || (!form.formState.isDirty && !isSecurityDirty)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || (!form.formState.isDirty && !isSecurityDirty)}
            >
              {form.formState.isSubmitting ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
