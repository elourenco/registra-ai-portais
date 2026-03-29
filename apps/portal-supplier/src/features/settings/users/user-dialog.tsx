import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
} from "@registra/ui";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const userRoleOptions = ["Admin", "Operacional", "Visualizador"] as const;
export const userStatusOptions = ["Ativo", "Pendente"] as const;

export type SettingsUserRole = (typeof userRoleOptions)[number];
export type SettingsUserStatus = (typeof userStatusOptions)[number];

export interface SettingsUser {
  id: string;
  fullName: string;
  email: string;
  role: SettingsUserRole;
  status: SettingsUserStatus;
}

const userDialogSchema = z.object({
  fullName: z.string().trim().min(3, "Informe o nome completo."),
  email: z.string().trim().email("Informe um e-mail válido."),
  role: z.enum(userRoleOptions),
  status: z.enum(userStatusOptions),
});

type UserDialogInput = z.input<typeof userDialogSchema>;
type UserDialogValues = z.output<typeof userDialogSchema>;

const defaultValues: UserDialogValues = {
  fullName: "",
  email: "",
  role: "Operacional",
  status: "Ativo",
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-rose-600">{message}</p>;
}

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: UserDialogValues) => Promise<void> | void;
  user?: SettingsUser | null;
}

export function UserDialog({ open, onOpenChange, onSubmit, user }: UserDialogProps) {
  const form = useForm<UserDialogInput, undefined, UserDialogValues>({
    resolver: zodResolver(userDialogSchema),
    defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(
      user
        ? {
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            status: user.status,
          }
        : defaultValues,
    );
  }, [form, open, user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{user ? "Editar usuário" : "Adicionar usuário"}</DialogTitle>
          <DialogDescription>
            {user
              ? "Atualize os dados de acesso do usuário selecionado."
              : "Cadastre um novo usuário para acessar a plataforma."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values);
            onOpenChange(false);
          })}
        >
          <div className="space-y-2">
            <Label htmlFor="user-full-name">Nome completo</Label>
            <Input id="user-full-name" {...form.register("fullName")} />
            <FieldError message={form.formState.errors.fullName?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input id="user-email" {...form.register("email")} />
            <FieldError message={form.formState.errors.email?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-role">Perfil</Label>
              <Select id="user-role" {...form.register("role")}>
                {userRoleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
              <FieldError message={form.formState.errors.role?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-status">Status</Label>
              <Select id="user-status" {...form.register("status")}>
                {userStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
              <FieldError message={form.formState.errors.status?.message} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? user
                  ? "Salvando..."
                  : "Criando..."
                : user
                  ? "Salvar usuário"
                  : "Criar usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
