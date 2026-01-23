import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Upload,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
  CalendarDays
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { formatCurrency } from '@/lib/formatters';

export default function Dashboard() {
  const { stats, isLoading } = useDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de cobrança
        </p>
      </div>

      {/* Stats Grid - Main Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                <p className="text-xs text-muted-foreground">
                  clientes cadastrados
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturas Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-2xl font-bold text-amber-600">
                  {formatCurrency(stats.pendingInvoicesValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingInvoicesCount} faturas aguardando
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturas Pagas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(stats.paidInvoicesValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.paidInvoicesCount} faturas quitadas
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Habilitados</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-600">{stats.enabledContracts}</div>
                <p className="text-xs text-muted-foreground">
                  contratos ativos
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Due Date Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-destructive/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-destructive">{stats.overdueCount}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats.overdueValue)} em atraso
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-amber-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">Vencem Hoje</CardTitle>
            <CalendarClock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-amber-600">{stats.todayDueCount}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats.todayDueValue)} a vencer
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Próximos 7 Dias</CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-blue-600">{stats.next7DaysCount}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats.next7DaysValue)} a vencer
                </p>
              </>
            )}
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
                  Visualize e gerencie a lista de clientes ({stats.totalCustomers} cadastrados)
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
            <CardTitle className="text-base">Contratos por Status</CardTitle>
            <CardDescription>Distribuição de contratos</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : Object.keys(stats.contractsByStatus).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(stats.contractsByStatus)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-muted-foreground">{status}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum contrato encontrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
