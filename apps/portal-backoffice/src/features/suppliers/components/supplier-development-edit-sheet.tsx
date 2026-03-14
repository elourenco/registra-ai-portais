import type { Development } from "@registra/shared";
import {
  Button,
  Input,
  Label,
  Select,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@registra/ui";
import { useEffect, useState } from "react";

import { developmentStatusLabels } from "@/features/registration-core/core/registration-presenters";

interface SupplierDevelopmentEditSheetProps {
  development: Development | null;
  onOpenChange: (open: boolean) => void;
  onSave: (development: Development) => void;
  open: boolean;
}

type DevelopmentFormState = Development;

function toInputValue(value: string | number | null | undefined): string {
  if (value == null) {
    return "";
  }

  return String(value);
}

export function SupplierDevelopmentEditSheet({
  development,
  onOpenChange,
  onSave,
  open,
}: SupplierDevelopmentEditSheetProps) {
  const [formState, setFormState] = useState<DevelopmentFormState | null>(development);

  useEffect(() => {
    setFormState(development);
  }, [development]);

  const handleChange = (field: keyof Development, value: string) => {
    setFormState((current) => {
      if (!current) {
        return current;
      }

      const numericFields: Array<keyof Development> = ["totalUnits", "totalTowers", "parkingSpots", "buyersCount"];

      if (numericFields.includes(field)) {
        return {
          ...current,
          [field]: value === "" ? null : Number(value),
        };
      }

      return {
        ...current,
        [field]: value === "" ? null : value,
      };
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto border-l border-border/70 p-0 sm:max-w-3xl">
        {formState ? (
          <div className="flex min-h-full flex-col">
            <SheetHeader className="border-b border-border/70 bg-background/95 px-6 py-5">
              <SheetTitle>Editar empreendimento</SheetTitle>
            </SheetHeader>

            <div className="flex-1 space-y-8 px-6 py-6">
              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Dados principais
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="development-name">Nome do empreendimento</Label>
                    <Input
                      id="development-name"
                      value={toInputValue(formState.name)}
                      onChange={(event) => handleChange("name", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="development-legal-name">Razão social</Label>
                    <Input
                      id="development-legal-name"
                      value={toInputValue(formState.legalName)}
                      onChange={(event) => handleChange("legalName", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="development-trade-name">Nome fantasia</Label>
                    <Input
                      id="development-trade-name"
                      value={toInputValue(formState.tradeName)}
                      onChange={(event) => handleChange("tradeName", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="development-type">Tipo de empreendimento</Label>
                    <Input
                      id="development-type"
                      value={toInputValue(formState.developmentType)}
                      onChange={(event) => handleChange("developmentType", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="development-cnpj">CNPJ</Label>
                    <Input
                      id="development-cnpj"
                      value={toInputValue(formState.cnpj)}
                      onChange={(event) => handleChange("cnpj", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="development-status">Status</Label>
                    <Select
                      id="development-status"
                      value={formState.status}
                      onChange={(event) => handleChange("status", event.target.value)}
                    >
                      {Object.entries(developmentStatusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Endereço
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="development-address">Endereço</Label>
                    <Input
                      id="development-address"
                      value={toInputValue(formState.address)}
                      onChange={(event) => handleChange("address", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="development-number">Número</Label>
                    <Input
                      id="development-number"
                      value={toInputValue(formState.number)}
                      onChange={(event) => handleChange("number", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="development-complement">Complemento</Label>
                    <Input
                      id="development-complement"
                      value={toInputValue(formState.complement)}
                      onChange={(event) => handleChange("complement", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="development-neighborhood">Bairro</Label>
                    <Input
                      id="development-neighborhood"
                      value={toInputValue(formState.neighborhood)}
                      onChange={(event) => handleChange("neighborhood", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="development-postal-code">CEP</Label>
                    <Input
                      id="development-postal-code"
                      value={toInputValue(formState.postalCode)}
                      onChange={(event) => handleChange("postalCode", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="development-city">Cidade</Label>
                    <Input
                      id="development-city"
                      value={toInputValue(formState.city)}
                      onChange={(event) => handleChange("city", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="development-state">Estado</Label>
                    <Input
                      id="development-state"
                      value={toInputValue(formState.state)}
                      onChange={(event) => handleChange("state", event.target.value)}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Registro
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="development-incorporation-number">
                      Número do registro da incorporação
                    </Label>
                    <Input
                      id="development-incorporation-number"
                      value={toInputValue(formState.incorporationRegistrationNumber)}
                      onChange={(event) =>
                        handleChange("incorporationRegistrationNumber", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="development-incorporation-date">Data do registro</Label>
                    <Input
                      id="development-incorporation-date"
                      value={toInputValue(formState.incorporationRegistrationDate)}
                      onChange={(event) =>
                        handleChange("incorporationRegistrationDate", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="development-master-registration">Matrícula mãe</Label>
                    <Input
                      id="development-master-registration"
                      value={toInputValue(formState.masterRegistrationNumber)}
                      onChange={(event) =>
                        handleChange("masterRegistrationNumber", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="development-registry-office">Cartório</Label>
                    <Input
                      id="development-registry-office"
                      value={toInputValue(formState.registryOfficeName)}
                      onChange={(event) => handleChange("registryOfficeName", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="development-registry-number">Número do cartório</Label>
                    <Input
                      id="development-registry-number"
                      value={toInputValue(formState.registryOfficeNumber)}
                      onChange={(event) => handleChange("registryOfficeNumber", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="development-registry-city">Cidade do cartório</Label>
                    <Input
                      id="development-registry-city"
                      value={toInputValue(formState.registryOfficeCity)}
                      onChange={(event) => handleChange("registryOfficeCity", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="development-registry-state">Estado do cartório</Label>
                    <Input
                      id="development-registry-state"
                      value={toInputValue(formState.registryOfficeState)}
                      onChange={(event) => handleChange("registryOfficeState", event.target.value)}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Capacidade
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="development-total-units">Total de unidades</Label>
                    <Input
                      id="development-total-units"
                      type="number"
                      value={toInputValue(formState.totalUnits)}
                      onChange={(event) => handleChange("totalUnits", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="development-total-towers">Torres / blocos</Label>
                    <Input
                      id="development-total-towers"
                      type="number"
                      value={toInputValue(formState.totalTowers)}
                      onChange={(event) => handleChange("totalTowers", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="development-parking-spots">Vagas de garagem</Label>
                    <Input
                      id="development-parking-spots"
                      type="number"
                      value={toInputValue(formState.parkingSpots)}
                      onChange={(event) => handleChange("parkingSpots", event.target.value)}
                    />
                  </div>
                </div>
              </section>
            </div>

            <SheetFooter className="border-t border-border/70 bg-background/95 px-6 py-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (formState) {
                    onSave(formState);
                  }
                }}
              >
                Salvar
              </Button>
            </SheetFooter>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
