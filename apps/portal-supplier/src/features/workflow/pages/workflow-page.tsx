import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CheckIcon,
  CircleDotIcon,
  cn,
} from "@registra/ui";
import { workflowRuleTypeLabels, type WorkflowRuleType } from "@registra/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";

import { useAuth } from "@/app/providers/auth-provider";
import {
  completeSupplierRule,
  getSupplierWorkflowProcess,
} from "@/features/workflow/api/workflow-api";

const supplierWorkflowProcessKey = (userId: string | undefined) => ["supplier-workflow", userId] as const;

function getRuleBadgeClasses(type: WorkflowRuleType): string {
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

export function WorkflowPage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const workflowProcessQuery = useQuery({
    queryKey: supplierWorkflowProcessKey(session?.user.id),
    queryFn: async () => {
      if (!session?.token) {
        throw new Error("Sessão inválida para carregar workflow.");
      }

      return getSupplierWorkflowProcess({
        token: session.token,
        processNameHint: `Processo ${session.user.name}`,
      });
    },
    enabled: Boolean(session?.token),
  });

  const completeRuleMutation = useMutation({
    mutationFn: completeSupplierRule,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: supplierWorkflowProcessKey(session?.user.id) });
    },
  });

  const process = workflowProcessQuery.data;

  const totalRules = process?.steps.reduce(
    (accumulator, step) => accumulator + step.rules.filter((rule) => rule.required).length,
    0,
  );
  const doneRules = process?.steps.reduce(
    (accumulator, step) =>
      accumulator + step.rules.filter((rule) => rule.required && rule.status === "completed").length,
    0,
  );
  const progressPercentage = totalRules && doneRules ? Math.round((doneRules / totalRules) * 100) : 0;

  return (
    <section className="space-y-6">
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <h2 className="text-2xl font-semibold">Meu workflow</h2>
        <p className="text-sm text-muted-foreground">
          Acompanhe as etapas do processo e conclua as regras para avançar.
        </p>
      </motion.header>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Progresso do processo</CardTitle>
          <CardDescription>
            Workflow atual: <span className="font-medium text-foreground">{process?.workflowName ?? "-"}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {doneRules ?? 0} de {totalRules ?? 0} regras obrigatórias concluídas ({progressPercentage}%).
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {workflowProcessQuery.isPending ? (
          <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
            Carregando workflow...
          </p>
        ) : null}

        {workflowProcessQuery.isError ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Não foi possível carregar o processo do workflow.
          </p>
        ) : null}

        {!workflowProcessQuery.isPending && process
          ? process.steps.map((step, stepIndex) => {
              const isCompleted = step.status === "completed";
              const isUnlocked = step.status !== "pending" || stepIndex === 0;

              return (
                <Card
                  key={step.id}
                  className={cn(
                    "border-border/70 bg-card/95 shadow-sm",
                    !isUnlocked ? "opacity-70" : "",
                  )}
                >
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          Etapa {step.order}: {step.title}
                        </CardTitle>
                        <CardDescription>{step.description || "Sem descrição"}</CardDescription>
                      </div>

                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                          isCompleted
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : isUnlocked
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-slate-200 bg-slate-100 text-slate-700",
                        )}
                      >
                        {isCompleted ? <CheckIcon className="h-3.5 w-3.5" /> : <CircleDotIcon className="h-3.5 w-3.5" />}
                        {isCompleted ? "Concluída" : isUnlocked ? "Em andamento" : "Bloqueada"}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {step.rules.map((rule) => {
                      const done = rule.status === "completed";

                      return (
                        <article
                          key={rule.id}
                          className="rounded-xl border border-border/70 bg-background/70 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold">{rule.title}</h4>
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getRuleBadgeClasses(rule.type)}`}
                            >
                              {workflowRuleTypeLabels[rule.type]}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {rule.guidance || "Sem instrução adicional."}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground">
                              {rule.required ? "Obrigatória" : "Opcional"}
                            </p>

                            <Button
                              type="button"
                              variant={done ? "secondary" : "default"}
                              size="sm"
                              disabled={
                                !isUnlocked ||
                                done ||
                                completeRuleMutation.isPending ||
                                !session?.token
                              }
                              onClick={() => {
                                if (!session?.token) {
                                  return;
                                }

                                completeRuleMutation.mutate({
                                  token: session.token,
                                  processId: process.processId,
                                  ruleId: rule.id,
                                });
                              }}
                            >
                              {done ? "Concluída" : "Concluir regra"}
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })
          : null}
      </div>
    </section>
  );
}
