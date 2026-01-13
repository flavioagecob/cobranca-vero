import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Columns3 } from "lucide-react";

export default function CollectionKanban() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kanban de Cobrança</h1>
        <p className="text-muted-foreground">
          Visualização em quadro de status de cobrança
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Columns3 className="h-5 w-5" />
            Kanban Board
          </CardTitle>
          <CardDescription>
            Esta página será implementada na Fase 4
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  );
}
