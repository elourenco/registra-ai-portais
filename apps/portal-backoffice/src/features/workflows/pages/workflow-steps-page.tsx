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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  Badge,
  Checkbox,
} from "@registra/ui";
import {
  createWorkflowStepSchema,
  updateWorkflowStepSchema,
  type CreateWorkflowStepInput,
  type UpdateWorkflowStepInput,
  type WorkflowStep,
} from "@registra/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Trash2Icon } from "lucide-react";

import { useParams, useNavigate } from "react-router-dom";

import { useAuth } from "@/app/providers/auth-provider";
import { addWorkflowStep, deleteWorkflowStep, updateWorkflowStep } from "@/features/workflows/api/workflows-api";
import {
  useWorkflowsCatalogQuery,
  workflowsCatalogQueryKey,
} from "@/features/workflows/hooks/use-workflows-catalog-query";
import { isUnauthorizedError } from "@/shared/api/query-retry";
import { routes } from "@/shared/constants/routes";
import { useUnauthorizedSessionRedirect } from "@/shared/hooks/use-unauthorized-session-redirect";

export function WorkflowStepsPage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { workflowId: selectedWorkflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const workflowsQuery = useWorkflowsCatalogQuery();

  useUnauthorizedSessionRedirect(
    workflowsQuery.isError && isUnauthorizedError(workflowsQuery.error),
  );

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
      await queryClient.invalidateQueries({ queryKey: workflowsCatalogQueryKey });
      form.reset({
        workflowId: selectedWorkflow?.id ?? "",
        title: "",
        description: "",
      });
      setIsCreateModalOpen(false);
    },
  });

  const [stepToDelete, setStepToDelete] = useState<WorkflowStep | null>(null);
  const [selectedStepForEdit, setSelectedStepForEdit] = useState<WorkflowStep | null>(null);

  const deleteStepMutation = useMutation({
    mutationFn: deleteWorkflowStep,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workflowsCatalogQueryKey });
      setStepToDelete(null);
      if (selectedStepForEdit?.id === stepToDelete?.id) {
        setSelectedStepForEdit(null);
      }
    },
  });

  const updateStepMutation = useMutation({
    mutationFn: updateWorkflowStep,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workflowsCatalogQueryKey });
      setSelectedStepForEdit(null);
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

  const editForm = useForm<UpdateWorkflowStepInput>({
    resolver: zodResolver(updateWorkflowStepSchema),
    defaultValues: {
      title: "",
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (selectedStepForEdit) {
      editForm.reset({
        title: selectedStepForEdit.title,
        description: selectedStepForEdit.description,
        isActive: selectedStepForEdit.isActive ?? true,
      });
    }
  }, [selectedStepForEdit, editForm]);

  const onEditSubmit = editForm.handleSubmit((values) => {
    if (!session?.token || !selectedStepForEdit || !selectedWorkflow) return;
    updateStepMutation.mutate({
      token: session.token,
      stepId: selectedStepForEdit.id,
      workflowId: selectedWorkflow.id,
      input: values,
    });
  });

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
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px] text-center">Ordem</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead className="w-[100px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedWorkflow.steps.map((step) => (
                        <TableRow 
                          key={step.id} 
                          className="cursor-pointer transition-colors"
                          onClick={() => setSelectedStepForEdit(step)}
                        >
                          <TableCell className="text-center font-medium">
                            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {step.order}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold">{step.title}</span>
                              <span className="text-xs text-muted-foreground line-clamp-1">{step.description || "Sem descrição"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {step.isActive ? (
                              <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-0">Ativo</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-muted-foreground border-0">Inativo</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 -my-2"
                              onClick={(event) => {
                                event.stopPropagation();
                                setStepToDelete(step);
                              }}
                            >
                              <Trash2Icon className="h-4 w-4" />
                              <span className="sr-only">Deletar</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                  Nenhuma etapa cadastrada para este workflow.
                </p>
              )
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Sheet open={!!selectedStepForEdit} onOpenChange={(open) => !open && setSelectedStepForEdit(null)}>
        <SheetContent className="flex flex-col sm:max-w-md w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes da Etapa</SheetTitle>
            <SheetDescription>
              Ajuste as configurações ou gerencie as regras desta etapa.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 mt-6">
            <form id="edit-step-form" onSubmit={onEditSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="edit-step-title">Título da etapa</Label>
                <Input
                  id="edit-step-title"
                  {...editForm.register("title")}
                />
                {editForm.formState.errors.title ? (
                  <p className="text-xs text-rose-600">{editForm.formState.errors.title.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-step-description">Descrição</Label>
                <Textarea
                  id="edit-step-description"
                  rows={4}
                  {...editForm.register("description")}
                />
                {editForm.formState.errors.description ? (
                  <p className="text-xs text-rose-600">
                    {editForm.formState.errors.description.message}
                  </p>
                ) : null}
              </div>

              <div className="items-top flex space-x-2">
                <Checkbox
                  id="edit-step-active"
                  checked={editForm.watch("isActive")}
                  className="mt-[3px]"
                  onCheckedChange={(checked) => editForm.setValue("isActive", checked === true, { shouldDirty: true })}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="edit-step-active"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Ativo
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Etapas inativas são ignoradas durante o fluxo.
                  </p>
                </div>
              </div>
            </form>


          </div>

          <SheetFooter className="mt-auto pt-6 flex-col sm:flex-col gap-3">
            <div className="flex w-full gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setSelectedStepForEdit(null)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                form="edit-step-form"
                className="flex-1"
                disabled={!editForm.formState.isDirty || updateStepMutation.isPending}
              >
                {updateStepMutation.isPending ? "Salvando..." : "Atualizar"}
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => {
                setStepToDelete(selectedStepForEdit);
              }}
            >
              <Trash2Icon className="h-4 w-4 mr-2" />
              Deletar etapa
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

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
