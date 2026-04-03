import type { Buyer, Development } from "@registra/shared";
import {
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@registra/ui";
import { MapPin, User } from "lucide-react";
import type { ProcessDetail } from "@/features/processes/core/process-schema";
import {
  buyerStatusLabels,
  formatCpf,
} from "@/features/registration-core/core/registration-presenters";

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,140px)_1fr] sm:items-start sm:gap-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="min-w-0 text-sm leading-relaxed text-foreground">{children}</div>
    </div>
  );
}

function InfoSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-card to-muted/15 p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      </div>
      <div className="space-y-3.5">{children}</div>
    </div>
  );
}

function formatMockAddress(development: Development): React.ReactNode {
  const line1 = [development.address, development.number].filter(Boolean).join(", ");
  const cityState = [development.city, development.state].filter(Boolean).join(" · ");
  const cep = development.postalCode ? `CEP ${development.postalCode}` : null;

  if (!line1 && !development.complement && !development.neighborhood && !cityState && !cep) {
    return <span className="text-muted-foreground">Endereço não informado.</span>;
  }

  return (
    <address className="not-italic">
      {line1 ? <p>{line1}</p> : null}
      {development.complement ? (
        <p className="text-muted-foreground">{development.complement}</p>
      ) : null}
      {development.neighborhood ? <p>{development.neighborhood}</p> : null}
      {cityState ? <p>{cityState}</p> : null}
      {cep ? <p className="text-muted-foreground">{cep}</p> : null}
    </address>
  );
}

function formatApiBuyerAddress(buyer: NonNullable<ProcessDetail["buyer"]>): React.ReactNode {
  const line1 = [buyer.street, buyer.number].filter(Boolean).join(", ");
  const cityState = [buyer.city, buyer.state].filter(Boolean).join(" · ");
  const cep = buyer.postalCode ? `CEP ${buyer.postalCode}` : null;

  if (!line1 && !buyer.complement && !buyer.neighborhood && !cityState && !cep) {
    return null;
  }

  return (
    <address className="not-italic">
      {line1 ? <p>{line1}</p> : null}
      {buyer.complement ? <p className="text-muted-foreground">{buyer.complement}</p> : null}
      {buyer.neighborhood ? <p>{buyer.neighborhood}</p> : null}
      {cityState ? <p>{cityState}</p> : null}
      {cep ? <p className="text-muted-foreground">{cep}</p> : null}
    </address>
  );
}

type ProcessBuyerInfoSheetProps =
  | {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      variant: "mock";
      buyer: Buyer;
      development: Development;
      propertyLabel: string;
    }
  | {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      variant: "api";
      detail: ProcessDetail;
      supplierName: string | null;
    };

export function ProcessBuyerInfoSheet(props: ProcessBuyerInfoSheetProps) {
  const { open, onOpenChange } = props;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto border-l border-border/80 p-0 sm:max-w-lg"
      >
        <SheetHeader className="space-y-1 border-b border-border/70 bg-muted/30 px-6 py-6 text-left">
          <SheetTitle className="text-xl font-semibold tracking-tight">Comprador</SheetTitle>
          <SheetDescription className="text-sm leading-relaxed">
            Dados cadastrais e endereço vinculados a este processo.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 px-6 py-6">
          {props.variant === "mock" ? (
            <>
              <InfoSection icon={User} title="Identificação">
                <InfoRow label="Nome">{props.buyer.name}</InfoRow>
                <Separator className="bg-border/60" />
                <InfoRow label="CPF">{formatCpf(props.buyer.cpf)}</InfoRow>
                <Separator className="bg-border/60" />
                <InfoRow label="E-mail">{props.buyer.email}</InfoRow>
                <Separator className="bg-border/60" />
                <InfoRow label="Telefone">{props.buyer.phone}</InfoRow>
                <Separator className="bg-border/60" />
                <InfoRow label="Status">{buyerStatusLabels[props.buyer.status]}</InfoRow>
                <Separator className="bg-border/60" />
                <InfoRow label="Imóvel (processo)">{props.propertyLabel}</InfoRow>
              </InfoSection>

              <InfoSection icon={MapPin} title="Endereço do empreendimento">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  {props.development.name}
                </p>
                {formatMockAddress(props.development)}
              </InfoSection>
            </>
          ) : (
            <>
              <InfoSection icon={User} title="Processo e comprador">
                <InfoRow label="Nome (lista)">{props.detail.buyerName ?? "—"}</InfoRow>
                <Separator className="bg-border/60" />
                <InfoRow label="ID comprador">{props.detail.buyerId ?? "—"}</InfoRow>
                <Separator className="bg-border/60" />
                <InfoRow label="Cliente (supplier)">
                  {props.supplierName ?? `Cliente #${props.detail.supplierCompanyId}`}
                </InfoRow>
                <Separator className="bg-border/60" />
                <InfoRow label="Empreendimento">{props.detail.developmentName ?? "—"}</InfoRow>
                <Separator className="bg-border/60" />
                <InfoRow label="Imóvel">{props.detail.propertyLabel}</InfoRow>
              </InfoSection>

              {props.detail.buyer ? (
                <InfoSection icon={User} title="Detalhe do comprador (workflow)">
                  <InfoRow label="Nome">{props.detail.buyer.name ?? "—"}</InfoRow>
                  {props.detail.buyer.cpf ? (
                    <>
                      <Separator className="bg-border/60" />
                      <InfoRow label="CPF">{props.detail.buyer.cpf}</InfoRow>
                    </>
                  ) : null}
                  {props.detail.buyer.email ? (
                    <>
                      <Separator className="bg-border/60" />
                      <InfoRow label="E-mail">{props.detail.buyer.email}</InfoRow>
                    </>
                  ) : null}
                  {props.detail.buyer.phone ? (
                    <>
                      <Separator className="bg-border/60" />
                      <InfoRow label="Telefone">{props.detail.buyer.phone}</InfoRow>
                    </>
                  ) : null}
                  <Separator className="bg-border/60" />
                  <InfoRow label="Certificado eNotariado">
                    {props.detail.buyer.hasEnotariadoCertificate === true
                      ? "Sim"
                      : props.detail.buyer.hasEnotariadoCertificate === false
                        ? "Não"
                        : "—"}
                  </InfoRow>
                </InfoSection>
              ) : null}

              <InfoSection icon={MapPin} title="Endereço">
                {props.detail.buyer ? (
                  (formatApiBuyerAddress(props.detail.buyer) ?? (
                    <p className="text-sm text-muted-foreground">
                      Endereço não retornado pela API para este comprador. Quando o backend enviar
                      os campos de endereço no objeto do comprador, eles aparecerão aqui.
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sem objeto de comprador no retorno da API; o endereço pode estar disponível
                    quando o detalhe do processo incluir o bloco buyer completo.
                  </p>
                )}
              </InfoSection>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
