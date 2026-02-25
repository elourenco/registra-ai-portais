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
  Select,
  Settings2Icon,
  Textarea,
} from "@registra/ui";
import {
  createWorkflowRuleSchema,
  workflowRuleTypeLabels,
  workflowRuleTypeSchema,
  type CreateWorkflowRuleInput,
  type WorkflowRuleType,
} from "@registra/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "@/app/providers/auth-provider";
import { addWorkflowRule, listWorkflows } from "@/features/workflows/api/workflows-api";

const workflowsQueryKey = ["workflows", "catalog"] as const;
const ruleTypeOptions = workflowRuleTypeSchema.options;

function getTypeClasses(type: WorkflowRuleType): string {
  switch (type) {
    case "form_fill":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "document_upload":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "fee_payment":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "manual_review":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export function WorkflowRulesPage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [selectedStepId, setSelectedStepId] = useState("");

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

  useEffect(() => {
    if (!selectedWorkflow) {
      setSelectedStepId("");
      return;
    }

    const currentStepExists = selectedWorkflow.steps.some((step) => step.id === selectedStepId);
    if (!currentStepExists) {
      setSelectedStepId(selectedWorkflow.steps[0]?.id ?? "");
    }
  }, [selectedStepId, selectedWorkflow]);

  const selectedStep = selectedWorkflow?.steps.find((step) => step.id === selectedStepId);

  const form = useForm<CreateWorkflowRuleInput>({
    resolver: zodResolver(createWorkflowRuleSchema),
    defaultValues: {
      workflowId: "",
      stepId: "",
      title: "",
      type: "form_fill",
      guidance: "",
      required: true,
    },
  });

  useEffect(() => {
    form.setValue("workflowId", selectedWorkflow?.id ?? "");
    form.setValue("stepId", selectedStep?.id ?? "");
  }, [form, selectedStep?.id, selectedWorkflow?.id]);

  const addRuleMutation = useMutation({
    mutationFn: addWorkflowRule,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workflowsQueryKey });
      form.reset({
        workflowId: selectedWorkflow?.id ?? "",
        stepId: selectedStep?.id ?? "",
        title: "",
        type: "form_fill",
        guidance: "",
        required: true,
      });
    },
  });

  return (
    <section className="space-y-6">
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <h2 className="text-2xl font-semibold">Regras por etapa</h2>
        <p className="text-sm text-muted-foreground">
          Configure as ações obrigatórias de cada etapa: formulário, documento, pagamento e revisão.
        </p>
      </motion.header>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="workflow-selector">Workflow</Label>
            <Select
              id="workflow-selector"
              value={selectedWorkflow?.id ?? ""}
              onChange={(event) => setSelectedWorkflowId(event.target.value)}
            >
              {workflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="step-selector">Etapa</Label>
            <Select
              id="step-selector"
              value={selectedStep?.id ?? ""}
              onChange={(event) => setSelectedStepId(event.target.value)}
            >
              {(selectedWorkflow?.steps ?? []).map((step) => (
                <option key={step.id} value={step.id}>
                  {step.order}. {step.title}
                </option>
              ))}
            </Select>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Regras cadastradas</CardTitle>
            <CardDescription>
              {selectedStep?.rules.length ?? 0} regra(s) na etapa atual.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {workflowsQuery.isPending ? (
              <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                Carregando regras...
              </p>
            ) : null}

            {!workflowsQuery.isPending && selectedStep ? (
              selectedStep.rules.length > 0 ? (
                selectedStep.rules.map((rule) => (
                  <article key={rule.id} className="rounded-xl border border-border/70 bg-background/70 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold">{rule.title}</h3>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getTypeClasses(rule.type)}`}>
                        {workflowRuleTypeLabels[rule.type]}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">{rule.guidance || "Sem orientação"}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {rule.required ? "Obrigatória para avançar" : "Opcional"}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                  Nenhuma regra cadastrada para esta etapa.
                </p>
              )
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2Icon className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg">Nova regra</CardTitle>
            </div>
            <CardDescription>Adicione uma nova regra para a etapa selecionada.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((values) => {
                if (!session?.token) {
                  return;
                }

                addRuleMutation.mutate({
                  token: session.token,
                  input: values,
                });
              })}
            >
              <input type="hidden" {...form.register("workflowId")} />
              <input type="hidden" {...form.register("stepId")} />

              <div className="space-y-2">
                <Label htmlFor="rule-title">Título</Label>
                <Input id="rule-title" placeholder="Ex.: Enviar comprovante bancário" {...form.register("title")} />
                {form.formState.errors.title ? (
                  <p className="text-xs text-rose-600">{form.formState.errors.title.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rule-type">Tipo</Label>
                <Select id="rule-type" {...form.register("type")}>
                  {ruleTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {workflowRuleTypeLabels[type]}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rule-guidance">Orientação</Label>
                <Textarea
                  id="rule-guidance"
                  rows={4}
                  placeholder="Explique o que o supplier precisa fazer para cumprir a regra."
                  {...form.register("guidance")}
                />
                {form.formState.errors.guidance ? (
                  <p className="text-xs text-rose-600">{form.formState.errors.guidance.message}</p>
                ) : null}
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4" {...form.register("required")} />
                Regra obrigatória para avanço
              </label>

              {addRuleMutation.isError ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
                  Não foi possível salvar a regra. Tente novamente.
                </p>
              ) : null}

              <Button
                type="submit"
                className="w-full"
                disabled={addRuleMutation.isPending || !selectedWorkflow || !selectedStep || !session?.token}
              >
                {addRuleMutation.isPending ? "Salvando..." : "Adicionar regra"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
