import { zodResolver } from "@hookform/resolvers/zod";
import {
  createBackofficeUserSchema,
  updateBackofficeUserSchema,
  type BackofficeUser,
  type BackofficeUserStatus,
  type CreateBackofficeUserInput,
  type UpdateBackofficeUserInput,
} from "@registra/shared";
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

import { backofficeUserStatusOptions } from "@/features/backoffice-users/utils/backoffice-user-status-options";

interface CreateBackofficeUserDialogProps {
  errorMessage: string | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateBackofficeUserInput) => void;
  open: boolean;
}

export function CreateBackofficeUserDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  errorMessage,
}: CreateBackofficeUserDialogProps) {
  const form = useForm<CreateBackofficeUserInput>({
    resolver: zodResolver(createBackofficeUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        email: "",
        password: "",
      });
    }
  }, [form, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
          <DialogDescription>
            Cadastre um novo usuário para acessar o portal backoffice.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="backoffice-user-name">Nome</Label>
            <Input id="backoffice-user-name" placeholder="Ex.: Maria Silva" {...form.register("name")} />
            {form.formState.errors.name ? (
              <p className="text-xs text-rose-600">{form.formState.errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="backoffice-user-email">E-mail</Label>
            <Input
              id="backoffice-user-email"
              type="email"
              placeholder="maria@registra.ai"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-xs text-rose-600">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="backoffice-user-password">Senha inicial</Label>
            <Input
              id="backoffice-user-password"
              type="password"
              placeholder="********"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-xs text-rose-600">{form.formState.errors.password.message}</p>
            ) : null}
          </div>
          {errorMessage ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Criar usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditBackofficeUserDialogProps {
  errorMessage: string | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: UpdateBackofficeUserInput) => void;
  open: boolean;
  user: BackofficeUser | null;
}

export function EditBackofficeUserDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  errorMessage,
  user,
}: EditBackofficeUserDialogProps) {
  const resolvedStatus: BackofficeUserStatus =
    user?.status === "suspended" ? "suspended" : "active";

  const form = useForm<UpdateBackofficeUserInput>({
    resolver: zodResolver(updateBackofficeUserSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
      status: resolvedStatus,
    },
  });

  useEffect(() => {
    form.reset({
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
      status: user?.status === "suspended" ? "suspended" : "active",
    });
  }, [form, user]);

  const availableStatusOptions = backofficeUserStatusOptions.filter((option) => option.value !== "all") as Array<{
    label: string;
    value: BackofficeUserStatus;
  }>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>Ajuste nome, perfil e status de acesso.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="backoffice-user-edit-email">E-mail</Label>
            <Input id="backoffice-user-edit-email" type="email" {...form.register("email")} />
            {form.formState.errors.email ? (
              <p className="text-xs text-rose-600">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="backoffice-user-edit-name">Nome</Label>
            <Input id="backoffice-user-edit-name" {...form.register("name")} />
            {form.formState.errors.name ? (
              <p className="text-xs text-rose-600">{form.formState.errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="backoffice-user-edit-password">Nova senha</Label>
            <Input
              id="backoffice-user-edit-password"
              type="password"
              placeholder="Deixe em branco para manter a atual"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-xs text-rose-600">{form.formState.errors.password.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="backoffice-user-edit-status">Status</Label>
            <Select id="backoffice-user-edit-status" {...form.register("status")}>
              {availableStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {errorMessage ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !user}>
              {isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
