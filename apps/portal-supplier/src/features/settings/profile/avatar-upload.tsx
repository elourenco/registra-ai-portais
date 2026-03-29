import { Avatar, AvatarFallback, AvatarImage, Button, Card, CardContent, Input } from "@registra/ui";
import { ImageIcon, UploadCloudIcon } from "@registra/ui";
import { useEffect, useMemo, useRef, useState } from "react";

interface AvatarUploadProps {
  value?: string;
  onChange: (value: string) => void;
}

function getInitials(value?: string) {
  if (!value) {
    return "SU";
  }

  return value
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function AvatarUpload({ value, onChange }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | undefined>(value);

  useEffect(() => {
    setPreview(value);
  }, [value]);

  const fallback = useMemo(() => getInitials("Supplier User"), []);

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 rounded-2xl border border-border/70">
            <AvatarImage src={preview} alt="Avatar do usuário" className="object-cover" />
            <AvatarFallback className="rounded-2xl bg-secondary text-sm font-semibold text-foreground">
              {fallback}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Foto de perfil</p>
            <p className="text-sm text-muted-foreground">
              Envie uma imagem quadrada para manter a apresentação do perfil consistente.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <Input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }

              const nextPreview = URL.createObjectURL(file);
              setPreview(nextPreview);
              onChange(nextPreview);
            }}
          />

          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
            <UploadCloudIcon className="mr-2 h-4 w-4" />
            Alterar foto
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ImageIcon className="h-3.5 w-3.5" />
            PNG ou JPG
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
