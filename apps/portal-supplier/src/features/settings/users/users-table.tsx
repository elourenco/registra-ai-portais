import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  SearchIcon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  UserCircle2Icon,
  useToast,
} from "@registra/ui";
import { useMemo, useState } from "react";

import {
  type SettingsUser,
  type SettingsUserRole,
  type SettingsUserStatus,
  UserDialog,
} from "@/features/settings/users/user-dialog";

const roleToneClassName: Record<SettingsUserRole, string> = {
  Admin: "border-sky-200 bg-sky-50 text-sky-700",
  Operacional: "border-violet-200 bg-violet-50 text-violet-700",
  Visualizador: "border-slate-200 bg-slate-100 text-slate-700",
};

const statusToneClassName: Record<SettingsUserStatus, string> = {
  Ativo: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Pendente: "border-amber-200 bg-amber-50 text-amber-700",
};

const initialUsers: SettingsUser[] = [
  {
    id: "usr-1",
    fullName: "Marina Duarte",
    email: "marina@datanomik.ai",
    role: "Admin",
    status: "Ativo",
  },
  {
    id: "usr-2",
    fullName: "Caio Mendes",
    email: "caio@datanomik.ai",
    role: "Operacional",
    status: "Ativo",
  },
  {
    id: "usr-3",
    fullName: "Ana Siqueira",
    email: "ana@datanomik.ai",
    role: "Visualizador",
    status: "Pendente",
  },
];

export function UsersTable() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<SettingsUser[]>(initialUsers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SettingsUser | null>(null);

  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return users;
    }

    return users.filter((user) =>
      [user.fullName, user.email, user.role, user.status]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [search, users]);

  return (
    <>
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Usuários</CardTitle>
            <CardDescription>Gerencie quem tem acesso à plataforma.</CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditingUser(null);
              setDialogOpen(true);
            }}
          >
            + Adicionar usuário
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Buscar por nome, email ou perfil"
              className="pl-9"
            />
          </div>

          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/80 px-6 py-12 text-center">
              <div className="rounded-full border border-border/70 bg-secondary/60 p-3">
                <UserCircle2Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Nenhum usuário cadastrado</p>
                <p className="text-sm text-muted-foreground">
                  Adicione usuários para distribuir acesso operacional à plataforma.
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingUser(null);
                  setDialogOpen(true);
                }}
              >
                Adicionar usuário
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="transition-colors hover:bg-muted/40">
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleToneClassName[user.role]}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusToneClassName[user.status]}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Ações
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingUser(user);
                                setDialogOpen(true);
                              }}
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-rose-600 focus:text-rose-700"
                              onClick={() => {
                                setUsers((current) => current.filter((item) => item.id !== user.id));
                                toast({
                                  title: "Usuário removido",
                                  description: `${user.fullName} foi removido da plataforma.`,
                                });
                              }}
                            >
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        onSubmit={async (values) => {
          await new Promise((resolve) => setTimeout(resolve, 700));

          if (editingUser) {
            setUsers((current) =>
              current.map((item) =>
                item.id === editingUser.id
                  ? {
                      ...item,
                      ...values,
                    }
                  : item,
              ),
            );

            toast({
              title: "Usuário atualizado",
              description: `${values.fullName} foi atualizado com sucesso.`,
            });

            return;
          }

          const nextUser: SettingsUser = {
            id: crypto.randomUUID(),
            ...values,
          };

          setUsers((current) => [nextUser, ...current]);
          toast({
            title: "Usuário criado",
            description: `${values.fullName} foi adicionado à plataforma.`,
          });
        }}
      />
    </>
  );
}
