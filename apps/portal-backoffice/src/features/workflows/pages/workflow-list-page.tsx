import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CheckIcon,
  Input,
  Label,
  Textarea,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@registra/ui";
import { createWorkflowSchema, type CreateWorkflowInput, type Workflow } from "@registra/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { TrashIcon } from "lucide-react";

import { useAuth } from "@/app/providers/auth-provider";
import { routes } from "@/shared/constants/routes";
import {
  createWorkflow,
  deleteWorkflow,
  listWorkflows,
} from "@/features/workflows/api/workflows-api";

const workflowsQueryKey = ["workflows", "catalog"] as const;

export function WorkflowListPage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
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

  const form = useForm<CreateWorkflowInput>({
    resolver: zodResolver(createWorkflowSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createWorkflowMutation = useMutation({
    mutationFn: createWorkflow,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workflowsQueryKey });
      form.reset();
      setIsCreateModalOpen(false);
    },
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workflowsQueryKey });
    },
  });

  const workflows = workflowsQuery.data ?? [];

  const handleRowClick = (workflow: Workflow) => {
    navigate(routes.workflowStepsById(workflow.id));
  };

  const handleDelete = (e: React.MouseEvent, workflow: Workflow) => {
    e.stopPropagation();
    if (!session?.token) return;

    if (
      window.confirm(
        "Você tem certeza que deseja deletar este workflow? Esta ação não pode ser desfeita.",
      )
    ) {
      deleteWorkflowMutation.mutate({
        token: session.token,
        workflowId: workflow.id,
      });
    }
  };

  return (
    <section className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Lista de workflows</h2>
          <p className="text-sm text-muted-foreground">
            Defina o workflow padrão do portal. Apenas um workflow pode ser default por vez.
          </p>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>Criar workflow</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Criar workflow</DialogTitle>
              <DialogDescription>
                Crie um novo fluxo e depois configure etapas e regras nos submenus.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4 pt-4"
              onSubmit={form.handleSubmit((values) => {
                if (!session?.token) {
                  return;
                }

                createWorkflowMutation.mutate({
                  token: session.token,
                  input: values,
                });
              })}
            >
              <div className="space-y-2">
                <Label htmlFor="workflow-name">Nome</Label>
                <Input
                  id="workflow-name"
                  placeholder="Ex.: Onboarding express"
                  {...form.register("name")}
                />
                {form.formState.errors.name ? (
                  <p className="text-xs text-rose-600">{form.formState.errors.name.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="workflow-description">Descrição</Label>
                <Textarea
                  id="workflow-description"
                  rows={4}
                  placeholder="Explique quando este workflow deve ser usado."
                  {...form.register("description")}
                />
                {form.formState.errors.description ? (
                  <p className="text-xs text-rose-600">
                    {form.formState.errors.description.message}
                  </p>
                ) : null}
              </div>

              {createWorkflowMutation.isError ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
                  Não foi possível criar workflow. Revise os dados e tente novamente.
                </p>
              ) : null}

              <Button
                type="submit"
                className="w-full"
                disabled={createWorkflowMutation.isPending || !session?.token}
              >
                {createWorkflowMutation.isPending ? "Salvando..." : "Criar workflow"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </motion.header>

      <div className="w-full">
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Workflows cadastrados</CardTitle>
            <CardDescription>
              {workflows.length} workflow(s) disponível(is) para vincular em suppliers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workflowsQuery.isPending ? (
              <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                Carregando workflows...
              </p>
            ) : null}

            {workflowsQuery.isError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                Não foi possível carregar workflows.
              </p>
            ) : null}

            {!workflowsQuery.isPending && !workflowsQuery.isError && (
              <div className="rounded-md border border-border/70 bg-background/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-center">Etapas vinculadas</TableHead>
                      <TableHead className="text-center">Padrão</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                          Nenhum workflow encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      workflows.map((workflow) => (
                        <TableRow
                          key={workflow.id}
                          className="cursor-pointer transition-colors hover:bg-muted/50"
                          onClick={() => handleRowClick(workflow)}
                        >
                          <TableCell className="font-medium">{workflow.name}</TableCell>
                          <TableCell className="text-center">{workflow.steps.length}</TableCell>
                          <TableCell className="text-center">
                            {workflow.isDefault ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                <CheckIcon className="h-3.5 w-3.5" />
                                Default
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={(e) => handleDelete(e, workflow)}
                              disabled={deleteWorkflowMutation.isPending}
                            >
                              <TrashIcon className="h-4 w-4" />
                              <span className="sr-only">Deletar</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
