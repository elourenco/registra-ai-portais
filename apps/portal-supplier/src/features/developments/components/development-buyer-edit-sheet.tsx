import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Checkbox,
  Input,
  Label,
  Select,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@registra/ui";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  buyerUpdateFormSchema,
  maritalLabels,
  toBuyerUpdateFormValues,
  type BuyerUpdateFormInput,
  type BuyerUpdateFormValues,
  type DevelopmentBuyer,
} from "@/features/developments/core/developments-schema";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-rose-600">{message}</p>;
}

interface DevelopmentBuyerEditSheetProps {
  open: boolean;
  buyer: DevelopmentBuyer;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BuyerUpdateFormValues) => Promise<void> | void;
}

export function DevelopmentBuyerEditSheet({
  open,
  buyer,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onSubmit,
}: DevelopmentBuyerEditSheetProps) {
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<BuyerUpdateFormValues | null>(null);
  const form = useForm<BuyerUpdateFormInput, undefined, BuyerUpdateFormValues>({
    resolver: zodResolver(buyerUpdateFormSchema),
    defaultValues: toBuyerUpdateFormValues(buyer),
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(toBuyerUpdateFormValues(buyer));
    setPendingValues(null);
    setConfirmOpen(false);
  }, [buyer, form, open]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle>Editar comprador</SheetTitle>
              <SheetDescription>
                O endpoint atual permite atualizar apenas estado civil, cônjuge e certificado do e-Notariado.
              </SheetDescription>
            </SheetHeader>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Campos como nome, CPF, e-mail, telefone, unidade, modalidade e contrato seguem somente leitura no contrato atual da API.
            </div>

            {errorMessage ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <form
              className="space-y-5"
              onSubmit={form.handleSubmit((values) => {
                setPendingValues(values);
                setConfirmOpen(true);
              })}
            >
              <div className="space-y-2">
                <Label htmlFor="buyer-edit-marital-status">Estado civil</Label>
                <Select id="buyer-edit-marital-status" {...form.register("maritalStatus")}>
                  <option value="">Não informado</option>
                  {Object.entries(maritalLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                <FieldError message={form.formState.errors.maritalStatus?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyer-edit-spouse-name">Nome do cônjuge</Label>
                <Input
                  id="buyer-edit-spouse-name"
                  placeholder="Informe o nome do cônjuge, se aplicável"
                  {...form.register("spouseName")}
                />
                <FieldError message={form.formState.errors.spouseName?.message} />
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/30 p-4">
                <Checkbox
                  checked={form.watch("hasEnotariadoCertificate")}
                  onCheckedChange={(checked) => {
                    form.setValue("hasEnotariadoCertificate", checked === true, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium text-foreground">
                    Certificado do e-Notariado disponível
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    Use esta opção quando o comprador já possuir certificado ativo para seguir com a jornada.
                  </span>
                </span>
              </label>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={!form.formState.isDirty || isSubmitting}>
                  Salvar alterações
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração do comprador?</AlertDialogTitle>
            <AlertDialogDescription>
              As mudanças serão salvas imediatamente no cadastro do comprador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting || !pendingValues}
              onClick={async (event) => {
                event.preventDefault();

                if (!pendingValues) {
                  return;
                }

                try {
                  await onSubmit(pendingValues);
                  setConfirmOpen(false);
                  onOpenChange(false);
                  form.reset({
                    maritalStatus: pendingValues.maritalStatus ?? "",
                    hasEnotariadoCertificate: pendingValues.hasEnotariadoCertificate,
                    spouseName: pendingValues.spouseName ?? "",
                  });
                } catch {
                  // Parent handles feedback. Keep sheet and dialog states under caller control.
                }
              }}
            >
              Confirmar e salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
