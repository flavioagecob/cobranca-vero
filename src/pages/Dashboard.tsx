import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  FileText, 
  Phone, 
  AlertTriangle, 
  TrendingUp, 
  Upload,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de cobrança
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500">0%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturas Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">
              0 faturas aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobranças Hoje</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3 text-destructive" />
              <span className="text-destructive">0%</span> de taxa de sucesso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Divergências</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Pendentes de conciliação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link to="/import">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Upload className="h-5 w-5" />
                  Importar Planilhas
                </CardTitle>
                <CardDescription>
                  Importe as planilhas de Base de Vendas e Base Operadora
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/customers">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5" />
                  Gerenciar Clientes
                </CardTitle>
                <CardDescription>
                  Visualize e gerencie a lista de clientes
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/reports">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5" />
                  Relatórios
                </CardTitle>
                <CardDescription>
                  Acesse relatórios e métricas de cobrança
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Activity placeholder */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Atividade Recente</CardTitle>
            <CardDescription>Últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma atividade recente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Promessas para Hoje</CardTitle>
            <CardDescription>Pagamentos prometidos para vencer</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma promessa para hoje
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
