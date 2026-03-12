import { MoreHorizontal, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "../components/avatar";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/card";
import type { TeamMembersCardProps } from "./types";

const toneToVariant = {
  neutral: "secondary",
  success: "success",
  warning: "warning",
} as const;

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function TeamMembersCard({ members }: TeamMembersCardProps) {
  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Time responsável
          </CardTitle>
          <CardDescription>Acompanhe quem está operando o fluxo neste portal.</CardDescription>
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="Mais opções da equipe">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
            <Avatar className="h-11 w-11">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{member.name}</p>
              <p className="truncate text-xs text-muted-foreground">{member.email}</p>
              <p className="truncate text-xs text-muted-foreground">{member.role}</p>
            </div>
            <Badge variant={toneToVariant[member.statusTone]} className="shrink-0">
              {member.statusLabel}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
