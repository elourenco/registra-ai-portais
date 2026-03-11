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
  Textarea,
} from "@registra/ui";
import type { ProcessSharedFile, WorkflowBlockKey } from "@registra/shared";
import { Download, FilePlus2, Files } from "lucide-react";
import { useMemo, useState } from "react";

import {
  blockTitleLabels,
  formatDateTime,
} from "@/features/registration-core/core/registration-presenters";

type SharedFileAudience = ProcessSharedFile["audience"];

interface ProcessSharedFilesManagerProps {
  files: ProcessSharedFile[];
  onCreateFile: (input: {
    audience: SharedFileAudience;
    block: WorkflowBlockKey;
    title: string;
    description: string;
    fileName: string;
  }) => void;
}

const audienceMeta: Record<
  SharedFileAudience,
  {
    title: string;
    description: string;
  }
> = {
  supplier: {
    title: "Arquivos para o supplier",
    description: "Materiais enviados pelo backoffice para o supplier acompanhar o processo.",
  },
  buyer: {
    title: "Arquivos para o comprador",
    description: "Arquivos compartilhados para dar transparência e contexto ao comprador.",
  },
  both: {
    title: "Arquivos para ambos",
    description: "Arquivos comuns que supplier e comprador podem visualizar.",
  },
};

function downloadSharedFile(file: ProcessSharedFile) {
  const blob = new Blob(
    [
      [
        `Arquivo: ${file.fileName}`,
        `Título: ${file.title}`,
        `Bloco: ${blockTitleLabels[file.block]}`,
        `Visibilidade: ${audienceMeta[file.audience].title}`,
        `Descrição: ${file.description}`,
        `Enviado por: ${file.uploadedBy}`,
        `Data: ${formatDateTime(file.createdAt)}`,
      ].join("\n"),
    ],
    { type: "text/plain;charset=utf-8" },
  );

  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = `${file.fileName}.txt`;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ProcessSharedFilesManager({ files, onCreateFile }: ProcessSharedFilesManagerProps) {
  const [block, setBlock] = useState<WorkflowBlockKey>("certificate");
  const [audience, setAudience] = useState<SharedFileAudience>("supplier");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");

  const groupedFiles = useMemo(
    () => ({
      supplier: files.filter((file) => file.audience === "supplier"),
      buyer: files.filter((file) => file.audience === "buyer"),
      both: files.filter((file) => file.audience === "both"),
    }),
    [files],
  );

  return (
    <div className="space-y-4">
      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Anexos compartilhados do backoffice</CardTitle>
          <CardDescription>
            Envie arquivos produzidos junto ao cartório para supplier, comprador ou ambos acompanharem o processo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shared-file-block">Bloco do processo</Label>
              <Select
                id="shared-file-block"
                value={block}
                onChange={(event) => setBlock(event.currentTarget.value as WorkflowBlockKey)}
              >
                <option value="certificate">Certificado</option>
                <option value="contract">Contrato</option>
                <option value="registration">Registro</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shared-file-audience">Quem visualiza</Label>
              <Select
                id="shared-file-audience"
                value={audience}
                onChange={(event) => setAudience(event.currentTarget.value as SharedFileAudience)}
              >
                <option value="supplier">Supplier</option>
                <option value="buyer">Comprador</option>
                <option value="both">Supplier e comprador</option>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="shared-file-title">Título do arquivo</Label>
              <Input
                id="shared-file-title"
                value={title}
                onChange={(event) => setTitle(event.currentTarget.value)}
                placeholder="Ex.: Protocolo do cartório"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="shared-file-description">Descrição</Label>
              <Textarea
                id="shared-file-description"
                value={description}
                onChange={(event) => setDescription(event.currentTarget.value)}
                rows={3}
                placeholder="Explique o contexto do arquivo para quem vai visualizar."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="shared-file-upload">Arquivo</Label>
              <Input
                id="shared-file-upload"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={(event) => setSelectedFileName(event.currentTarget.files?.[0]?.name ?? "")}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => {
                if (!title.trim() || !description.trim() || !selectedFileName) {
                  return;
                }

                onCreateFile({
                  audience,
                  block,
                  title: title.trim(),
                  description: description.trim(),
                  fileName: selectedFileName,
                });
                setTitle("");
                setDescription("");
                setSelectedFileName("");
              }}
              disabled={!title.trim() || !description.trim() || !selectedFileName}
            >
              <FilePlus2 className="mr-2 h-4 w-4" />
              Anexar arquivo
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {(Object.keys(audienceMeta) as SharedFileAudience[]).map((target) => (
          <Card key={target} className="border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>{audienceMeta[target].title}</CardTitle>
              <CardDescription>{audienceMeta[target].description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupedFiles[target].length > 0 ? (
                groupedFiles[target].map((file) => (
                  <article key={file.id} className="rounded-xl border border-border/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{file.title}</p>
                        <p className="text-sm text-muted-foreground">{blockTitleLabels[file.block]}</p>
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={() => downloadSharedFile(file)}>
                        <Download className="mr-2 h-4 w-4" />
                        Baixar
                      </Button>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{file.description}</p>
                    <div className="mt-3 rounded-lg border border-dashed border-border/70 px-3 py-2 text-sm">
                      <p className="font-medium">{file.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        Enviado por {file.uploadedBy} em {formatDateTime(file.createdAt)}
                      </p>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                  <Files className="mb-3 h-4 w-4" />
                  Nenhum anexo compartilhado para esta audiência.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
