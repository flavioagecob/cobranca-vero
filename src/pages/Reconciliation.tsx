import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCompare } from "lucide-react";

export default function Reconciliation() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conciliação</h1>
        <p className="text-muted-foreground">
          Identifique e resolva divergências entre planilhas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Divergências
          </CardTitle>
          <CardDescription>
            Esta página será implementada na Fase 5
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  );
}
