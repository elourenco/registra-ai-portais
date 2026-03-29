import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, cn } from "@registra/ui";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { ProfileForm } from "@/features/settings/profile/profile-form";
import { UsersTable } from "@/features/settings/users/users-table";

const sections = [
  { key: "profile", label: "Perfil", description: "Dados pessoais e segurança" },
  { key: "users", label: "Usuários", description: "Controle de acessos" },
] as const;

type SettingsSection = (typeof sections)[number]["key"];

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentSection = useMemo<SettingsSection>(() => {
    const value = searchParams.get("section");
    return value === "users" ? "users" : "profile";
  }, [searchParams]);

  return (
    <div className="mx-auto max-w-[960px]">
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <Card className="h-fit border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Configurações</CardTitle>
            <CardDescription>Ajustes da conta e gestão de acessos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sections.map((section) => (
              <Button
                key={section.key}
                variant={currentSection === section.key ? "secondary" : "ghost"}
                className={cn("h-auto w-full justify-start px-3 py-3 text-left")}
                onClick={() => setSearchParams({ section: section.key })}
              >
                <span className="space-y-0.5">
                  <span className="block text-sm font-medium">{section.label}</span>
                  <span className="block text-xs text-muted-foreground">{section.description}</span>
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {currentSection === "profile" ? <ProfileForm /> : null}
          {currentSection === "users" ? <UsersTable /> : null}
        </div>
      </div>
    </div>
  );
}
