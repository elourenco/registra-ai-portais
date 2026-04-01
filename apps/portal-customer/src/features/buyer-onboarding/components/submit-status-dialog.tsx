import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  LoaderCircleIcon,
} from "@registra/ui";

interface SubmitStatusDialogProps {
  open: boolean;
  status: "loading" | "error";
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
}

export function SubmitStatusDialog({
  open,
  status,
  errorMessage,
  onOpenChange,
}: SubmitStatusDialogProps) {
  const isLoading = status === "loading";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!isLoading ? onOpenChange(nextOpen) : undefined)}>
      <DialogContent className="[&>button]:hidden sm:max-w-md">
        <DialogHeader className="items-center text-center sm:items-center sm:text-center">
          {isLoading ? (
            <div className="mb-2 rounded-full bg-primary/10 p-3 text-primary">
              <LoaderCircleIcon className="h-6 w-6 animate-spin" />
            </div>
          ) : null}
          <DialogTitle>
            {isLoading ? "Enviando para análise" : "Não foi possível concluir o envio"}
          </DialogTitle>
          <DialogDescription>
            {isLoading
              ? "Aguarde enquanto salvamos seus dados e enviamos os documentos anexados."
              : errorMessage ?? "Ocorreu um erro ao enviar suas informações para análise."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? null : (
          <DialogFooter>
            <Button type="button" onClick={() => onOpenChange(false)}>
              Tentar mais tarde
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
