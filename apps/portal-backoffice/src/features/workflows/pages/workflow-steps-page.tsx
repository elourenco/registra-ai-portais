import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CircleDotIcon,
  Input,
  Label,
  Textarea,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@registra/ui";
import {
  createWorkflowStepSchema,
  type CreateWorkflowStepInput,
  type WorkflowStep,
} from "@registra/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Trash2Icon } from "lucide-react";

import { useParams, useNavigate } from "react-router-dom";

import { useAuth } from "@/app/providers/auth-provider";
import { routes } from "@/shared/constants/routes";
import {
  addWorkflowStep,
  listWorkflows,
  deleteWorkflowStep,
} from "@/features/workflows/api/workflows-api";

const workflowsQueryKey = ["workflows", "catalog"] as const;

export function WorkflowStepsPage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { workflowId: selectedWorkflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const workflowsQuery = useQuery({
    queryKey: [...workflowsQueryKey, session?.user.id],
    queryFn: async () => {
      if (!session?.token) {
        throw new Error("Sessão inválida para listar workflows.");
      }

      return listWorkflows({ token: session.token });
    },
    enabled: Boolean(session?.token),
  });

  const workflows = workflowsQuery.data ?? [];

  const selectedWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.id === selectedWorkflowId) ?? workflows[0],
    [selectedWorkflowId, workflows],
  );

  const form = useForm<CreateWorkflowStepInput>({
    resolver: zodResolver(createWorkflowStepSchema),
    defaultValues: {
      workflowId: "",
      title: "",
      description: "",
    },
  });

  useEffect(() => {
    form.setValue("workflowId", selectedWorkflow?.id ?? "");
  }, [form, selectedWorkflow?.id]);

  const addStepMutation = useMutation({
    mutationFn: addWorkflowStep,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workflowsQueryKey });
      form.reset({
        workflowId: selectedWorkflow?.id ?? "",
        title: "",
        description: "",
      });
      setIsCreateModalOpen(false);
    },
  });

  const [stepToDelete, setStepToDelete] = useState<WorkflowStep | null>(null);

  const deleteStepMutation = useMutation({
    mutationFn: deleteWorkflowStep,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workflowsQueryKey });
      setStepToDelete(null);
    },
  });

  const handleDeleteStep = () => {
    if (!session?.token || !stepToDelete) return;
    deleteStepMutation.mutate({
      token: session.token,
      stepId: stepToDelete.id,
    });
  };

  const handleStepClick = (stepId: string) => {
    if (!selectedWorkflow) {
      return;
    }

    navigate(routes.workflowRulesById(selectedWorkflow.id, stepId));
  };

  return (
    <section className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Etapas do workflow</h2>
          <p className="text-sm text-muted-foreground">
            Cada etapa define um checkpoint do processo. As regras cumpridas liberam avanço para a
            próxima etapa.
          </p>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedWorkflow}>Nova etapa</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova etapa</DialogTitle>
              <DialogDescription>Crie a próxima etapa do fluxo selecionado.</DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4 pt-4"
              onSubmit={form.handleSubmit((values) => {
                if (!session?.token) {
                  return;
                }

                addStepMutation.mutate({
                  token: session.token,
                  input: values,
                });
              })}
            >
              <input type="hidden" {...form.register("workflowId")} />

              <div className="space-y-2">
                <Label htmlFor="step-title">Título da etapa</Label>
                <Input
                  id="step-title"
                  placeholder="Ex.: Validação jurídica"
                  {...form.register("title")}
                />
                {form.formState.errors.title ? (
                  <p className="text-xs text-rose-600">{form.formState.errors.title.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="step-description">Descrição</Label>
                <Textarea
                  id="step-description"
                  rows={4}
                  placeholder="Explique o objetivo desta etapa."
                  {...form.register("description")}
                />
                {form.formState.errors.description ? (
                  <p className="text-xs text-rose-600">
                    {form.formState.errors.description.message}
                  </p>
                ) : null}
              </div>

              {addStepMutation.isError ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
                  Não foi possível criar etapa. Verifique os dados e tente novamente.
                </p>
              ) : null}

              <Button
                type="submit"
                className="w-full"
                disabled={addStepMutation.isPending || !selectedWorkflow || !session?.token}
              >
                {addStepMutation.isPending ? "Salvando..." : "Adicionar etapa"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </motion.header>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">{selectedWorkflow?.name || "Carregando..."}</CardTitle>
              <CardDescription>{selectedWorkflow?.description || "Sem descrição"}</CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Voltar para lista
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="w-full">
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Mapa de etapas</CardTitle>
            <CardDescription>
              {selectedWorkflow?.steps.length ?? 0} etapa(s) no workflow selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workflowsQuery.isPending ? (
              <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                Carregando etapas...
              </p>
            ) : null}

            {!workflowsQuery.isPending && selectedWorkflow ? (
              selectedWorkflow.steps.length > 0 ? (
                <ol className="space-y-3">
                  {selectedWorkflow.steps.map((step) => (
                    <li key={step.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/70 p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        onClick={() => handleStepClick(step.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleStepClick(step.id);
                          }
                        }}
                      >
                        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {step.order}
                        </span>

                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-sm font-semibold">{step.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {step.description || "Sem descrição"}
                          </p>
                          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <CircleDotIcon className="h-3.5 w-3.5" />
                            {step.rules.length} regra(s) vinculada(s)
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={(event) => {
                            event.stopPropagation();
                            setStepToDelete(step);
                          }}
                        >
                          <Trash2Icon className="h-4 w-4" />
                          <span className="sr-only">Deletar</span>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                  Nenhuma etapa cadastrada para este workflow.
                </p>
              )
            ) : null}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!stepToDelete} onOpenChange={(open) => !open && setStepToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a etapa e todas as
              regras vinculadas a ela.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteStepMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-600"
              onClick={handleDeleteStep}
              disabled={deleteStepMutation.isPending}
            >
              {deleteStepMutation.isPending ? "Deletando..." : "Deletar Etapa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
