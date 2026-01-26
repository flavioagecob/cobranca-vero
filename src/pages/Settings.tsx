import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, MessageSquare, FileText, ListChecks } from "lucide-react";
import { InstanceList } from "@/components/settings/InstanceList";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Configure o sistema de cobrança
        </p>
      </div>

      <Tabs defaultValue="instances" className="space-y-4">
        <TabsList>
          <TabsTrigger value="instances" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Instâncias
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="collection-rules" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Régua de Cobrança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="instances">
          <InstanceList />
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Templates de Mensagens
              </CardTitle>
              <CardDescription>
                Configure os templates de mensagens para cobrança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collection-rules">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                Régua de Cobrança
              </CardTitle>
              <CardDescription>
                Configure as regras automáticas de cobrança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
