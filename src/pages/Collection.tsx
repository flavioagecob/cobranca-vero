import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone } from "lucide-react";

export default function Collection() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workstation de Cobrança</h1>
        <p className="text-muted-foreground">
          Interface operacional para cobradores
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Workstation
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
