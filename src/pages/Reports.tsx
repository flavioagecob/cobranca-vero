import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Métricas e relatórios de cobrança
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatórios Gerenciais
          </CardTitle>
          <CardDescription>
            Esta página será implementada na Fase 6
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  );
}
