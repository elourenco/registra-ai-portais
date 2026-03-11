import { CreditCard, Landmark, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/card";
import { Input } from "../components/input";
import { Label } from "../components/label";
import type { PaymentMethodsCardProps } from "./types";

const brandStyle = {
  visa: "bg-sky-500 text-white",
  mastercard: "bg-amber-500 text-amber-950",
  pix: "bg-emerald-500 text-emerald-950",
} as const;

const tabOptions = [
  { key: "card", label: "Cartão" },
  { key: "pix", label: "PIX" },
] as const;

type TabOption = (typeof tabOptions)[number]["key"];

export function PaymentMethodsCard({ methods }: PaymentMethodsCardProps) {
  const [activeTab, setActiveTab] = useState<TabOption>("card");

  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4 text-primary" />
          Método de pagamento
        </CardTitle>
        <CardDescription>Bloco inspirado no admin de referência, adaptado ao contexto do portal.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="inline-flex rounded-lg border border-border/70 bg-muted/30 p-1">
          {tabOptions.map((option) => (
            <Button
              key={option.key}
              type="button"
              variant={activeTab === option.key ? "default" : "ghost"}
              size="sm"
              className="min-w-24"
              onClick={() => setActiveTab(option.key)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {methods
            .filter((method) => (activeTab === "pix" ? method.brand === "pix" : method.brand !== "pix"))
            .map((method) => (
              <div key={method.id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${brandStyle[method.brand]}`}
                >
                  {method.brand === "pix" ? <Landmark className="h-4 w-4" /> : method.brand.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{method.label}</p>
                  <p className="text-xs text-muted-foreground">{method.detail}</p>
                </div>
                {method.isDefault ? <Badge variant="success">Padrão</Badge> : null}
              </div>
            ))}
        </div>

        <form className="space-y-3 rounded-xl border border-dashed border-border/80 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Atualizar forma de cobrança
          </div>
          <div className="space-y-2">
            <Label htmlFor="dashboard-card-name">Nome no metodo</Label>
            <Input id="dashboard-card-name" placeholder="Registra AI Operações" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dashboard-card-number">
                {activeTab === "pix" ? "Chave PIX" : "Número do cartão"}
              </Label>
              <Input
                id="dashboard-card-number"
                placeholder={activeTab === "pix" ? "financeiro@empresa.com" : "1234 5678 9012 3456"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dashboard-card-expiry">
                {activeTab === "pix" ? "Banco" : "Validade"}
              </Label>
              <Input id="dashboard-card-expiry" placeholder={activeTab === "pix" ? "Banco parceiro" : "12/28"} />
            </div>
          </div>
          <Button type="button" className="w-full">
            Salvar configuração
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
