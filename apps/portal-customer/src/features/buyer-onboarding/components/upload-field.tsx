import {
  Button,
  Card,
  CardContent,
  Input,
  UploadCloudIcon,
  cn,
} from "@registra/ui";
import { useRef, useState } from "react";

interface UploadFieldProps {
  label: string;
  onFileSelect: (file: File) => void;
}

export function UploadField({ label, onFileSelect }: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <Card
      className={cn(
        "border-dashed transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-border/70",
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) {
          onFileSelect(file);
        }
      }}
    >
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <UploadCloudIcon className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-sm text-muted-foreground">
              Arraste o arquivo aqui ou selecione no seu dispositivo.
            </p>
          </div>
        </div>
        <Input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onFileSelect(file);
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-fit"
          onClick={() => inputRef.current?.click()}
        >
          Selecionar arquivo
        </Button>
      </CardContent>
    </Card>
  );
}
