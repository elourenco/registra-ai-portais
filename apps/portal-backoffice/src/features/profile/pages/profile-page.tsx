import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@registra/ui";

import { useAuth } from "@/app/providers/auth-provider";

export function ProfilePage() {
  const { session } = useAuth();

  return (
    <section className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Dados da sessão atual no portal backoffice.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground">Nome</p>
            <p className="font-medium">{session?.user.name ?? "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">E-mail</p>
            <p className="font-medium">{session?.user.email ?? "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Perfil</p>
            <p className="font-medium">{session?.user.role ?? "-"}</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
