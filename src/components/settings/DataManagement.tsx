import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Database, Trash2, Users, FileSpreadsheet, Phone, RefreshCw, AlertTriangle } from 'lucide-react';
import { useDataManagement } from '@/hooks/useDataManagement';
import { ClearDataDialog } from './ClearDataDialog';

type ClearAction = 'sales' | 'operator' | 'collection' | 'all' | null;

export function DataManagement() {
  const {
    counts,
    isLoading,
    isClearing,
    fetchCounts,
    clearSalesData,
    clearOperatorData,
    clearCollectionHistory,
    clearAllData,
  } = useDataManagement();

  const [activeDialog, setActiveDialog] = useState<ClearAction>(null);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const totalRecords = 
    counts.customers + 
    counts.sales_base + 
    counts.operator_contracts + 
    counts.collection_attempts + 
    counts.payment_promises + 
    counts.invoices + 
    counts.reconciliation_issues + 
    counts.import_batches;

  const getDialogConfig = (action: ClearAction) => {
    switch (action) {
      case 'sales':
        return {
          title: 'Limpar Base de Vendas',
          description: 'Isso excluirá todas as vendas (sales_base), problemas de reconciliação vinculados, contratos vinculados e batches de importação de vendas.',
          recordCount: counts.sales_base,
          onConfirm: clearSalesData,
        };
      case 'operator':
        return {
          title: 'Limpar Base Operadora',
          description: 'Isso excluirá todos os contratos da operadora, tentativas de cobrança, promessas de pagamento, problemas de reconciliação vinculados e batches de importação da operadora.',
          recordCount: counts.operator_contracts,
          onConfirm: clearOperatorData,
        };
      case 'collection':
        return {
          title: 'Limpar Histórico de Cobrança',
          description: 'Isso excluirá todas as tentativas de cobrança e promessas de pagamento.',
          recordCount: counts.collection_attempts + counts.payment_promises,
          onConfirm: clearCollectionHistory,
        };
      case 'all':
        return {
          title: 'Limpar TODOS os Dados',
          description: 'Isso excluirá TODOS os dados do sistema: clientes, vendas, contratos, cobranças, faturas, problemas e batches de importação. Usuários e instâncias serão mantidos.',
          recordCount: totalRecords,
          onConfirm: clearAllData,
        };
      default:
        return null;
    }
  };

  const dialogConfig = activeDialog ? getDialogConfig(activeDialog) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Gerenciamento de Dados
              </CardTitle>
              <CardDescription>
                Visualize e gerencie os dados do sistema. Use com cuidado!
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchCounts}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <CountCard
              label="Clientes"
              count={counts.customers}
              isLoading={isLoading}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <CountCard
              label="Vendas"
              count={counts.sales_base}
              isLoading={isLoading}
              icon={<FileSpreadsheet className="h-4 w-4 text-muted-foreground" />}
            />
            <CountCard
              label="Contratos Operadora"
              count={counts.operator_contracts}
              isLoading={isLoading}
              icon={<FileSpreadsheet className="h-4 w-4 text-muted-foreground" />}
            />
            <CountCard
              label="Tentativas Cobrança"
              count={counts.collection_attempts}
              isLoading={isLoading}
              icon={<Phone className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-amber-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="h-4 w-4" />
              Limpar Base de Vendas
            </CardTitle>
            <CardDescription>
              Remove vendas, reconciliações vinculadas e batches de importação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {isLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  `${counts.sales_base.toLocaleString('pt-BR')} registros`
                )}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700"
                onClick={() => setActiveDialog('sales')}
                disabled={isLoading || counts.sales_base === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="h-4 w-4" />
              Limpar Base Operadora
            </CardTitle>
            <CardDescription>
              Remove contratos, cobranças, promessas e batches de importação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {isLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  `${counts.operator_contracts.toLocaleString('pt-BR')} registros`
                )}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700"
                onClick={() => setActiveDialog('operator')}
                disabled={isLoading || counts.operator_contracts === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4" />
              Limpar Histórico de Cobrança
            </CardTitle>
            <CardDescription>
              Remove tentativas de cobrança e promessas de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {isLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  `${(counts.collection_attempts + counts.payment_promises).toLocaleString('pt-BR')} registros`
                )}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="text-orange-600 border-orange-600 hover:bg-orange-50 hover:text-orange-700"
                onClick={() => setActiveDialog('collection')}
                disabled={isLoading || (counts.collection_attempts + counts.payment_promises) === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Limpar TUDO
            </CardTitle>
            <CardDescription>
              Remove TODOS os dados (exceto usuários e instâncias)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {isLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  `${totalRecords.toLocaleString('pt-BR')} registros`
                )}
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setActiveDialog('all')}
                disabled={isLoading || totalRecords === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Tudo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {dialogConfig && (
        <ClearDataDialog
          open={activeDialog !== null}
          onOpenChange={(open) => !open && setActiveDialog(null)}
          title={dialogConfig.title}
          description={dialogConfig.description}
          recordCount={dialogConfig.recordCount}
          onConfirm={dialogConfig.onConfirm}
          isClearing={isClearing}
        />
      )}
    </div>
  );
}

function CountCard({
  label,
  count,
  isLoading,
  icon,
}: {
  label: string;
  count: number;
  isLoading: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="mt-2">
        {isLoading ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <span className="text-2xl font-bold">{count.toLocaleString('pt-BR')}</span>
        )}
      </div>
    </div>
  );
}
