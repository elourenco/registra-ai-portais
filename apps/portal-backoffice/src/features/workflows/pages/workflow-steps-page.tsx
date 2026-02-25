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
  Select,
  Textarea,
} from "@registra/ui";
import {
  createWorkflowStepSchema,
  type CreateWorkflowStepInput,
} from "@registra/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "@/app/providers/auth-provider";
import { addWorkflowStep, listWorkflows } from "@/features/workflows/api/workflows-api";

const workflowsQueryKey = ["workflows", "catalog"] as const;

export function WorkflowStepsPage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");

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

  useEffect(() => {
    if (!selectedWorkflowId && workflows.length > 0) {
      setSelectedWorkflowId(workflows[0].id);
    }
  }, [selectedWorkflowId, workflows]);

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
    },
  });

  return (
    <section className="space-y-6">
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <h2 className="text-2xl font-semibold">Etapas do workflow</h2>
        <p className="text-sm text-muted-foreground">
          Cada etapa define um checkpoint do processo. As regras cumpridas liberam avanço para a próxima etapa.
        </p>
      </motion.header>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle className="text-lg">Selecionar workflow</CardTitle>
            <CardDescription>Escolha o fluxo para visualizar e criar novas etapas.</CardDescription>
          </div>

          <Select
            value={selectedWorkflow?.id ?? ""}
            onChange={(event) => setSelectedWorkflowId(event.target.value)}
            className="max-w-md"
          >
            {workflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name}
              </option>
            ))}
          </Select>
        </CardHeader>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
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
                    <li key={step.id} className="rounded-xl border border-border/70 bg-background/70 p-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {step.order}
                        </span>

                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-semibold">{step.title}</p>
                          <p className="text-sm text-muted-foreground">{step.description || "Sem descrição"}</p>
                          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <CircleDotIcon className="h-3.5 w-3.5" />
                            {step.rules.length} regra(s) vinculada(s)
                          </p>
                        </div>
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

        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Nova etapa</CardTitle>
            <CardDescription>Crie a próxima etapa do fluxo selecionado.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
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
                <Input id="step-title" placeholder="Ex.: Validação jurídica" {...form.register("title")} />
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
                  <p className="text-xs text-rose-600">{form.formState.errors.description.message}</p>
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
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
