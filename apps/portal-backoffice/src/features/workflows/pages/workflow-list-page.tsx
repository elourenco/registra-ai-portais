import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CheckIcon,
  GitBranchIcon,
  Input,
  Label,
  Textarea,
} from "@registra/ui";
import {
  createWorkflowSchema,
  type CreateWorkflowInput,
  type Workflow,
} from "@registra/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";

import { useAuth } from "@/app/providers/auth-provider";
import {
  createWorkflow,
  listWorkflows,
  setDefaultWorkflow,
} from "@/features/workflows/api/workflows-api";

const workflowsQueryKey = ["workflows", "catalog"] as const;

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function countRules(workflow: Workflow): number {
  return workflow.steps.reduce((accumulator, step) => accumulator + step.rules.length, 0);
}

export function WorkflowListPage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

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
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultWorkflow,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workflowsQueryKey });
    },
  });

  const workflows = workflowsQuery.data ?? [];

  return (
    <section className="space-y-6">
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <GitBranchIcon className="h-3.5 w-3.5" />
          Workflow Center
        </div>
        <h2 className="text-2xl font-semibold">Lista de workflows</h2>
        <p className="text-sm text-muted-foreground">
          Defina o workflow padrão do portal. Apenas um workflow pode ser default por vez.
        </p>
      </motion.header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Workflows cadastrados</CardTitle>
            <CardDescription>
              {workflows.length} workflow(s) disponível(is) para vincular em suppliers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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

            {!workflowsQuery.isPending &&
              !workflowsQuery.isError &&
              workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="rounded-xl border border-border/70 bg-background/70 p-4 transition-colors hover:border-primary/30"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold">{workflow.name}</h3>
                        {workflow.isDefault ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <CheckIcon className="h-3.5 w-3.5" />
                            Default
                          </span>
                        ) : null}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {workflow.description || "Sem descrição"}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {workflow.steps.length} etapa(s) · {countRules(workflow)} regra(s) · Atualizado em {" "}
                        {formatDate(workflow.updatedAt)}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant={workflow.isDefault ? "secondary" : "default"}
                      size="sm"
                      disabled={workflow.isDefault || setDefaultMutation.isPending || !session?.token}
                      onClick={() => {
                        if (!session?.token) {
                          return;
                        }

                        setDefaultMutation.mutate({
                          token: session.token,
                          workflowId: workflow.id,
                        });
                      }}
                    >
                      {workflow.isDefault ? "Workflow padrão" : "Definir como default"}
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Criar workflow</CardTitle>
            <CardDescription>
              Crie um novo fluxo e depois configure etapas e regras nos submenus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
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
                <Input id="workflow-name" placeholder="Ex.: Onboarding express" {...form.register("name")} />
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
                  <p className="text-xs text-rose-600">{form.formState.errors.description.message}</p>
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
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
