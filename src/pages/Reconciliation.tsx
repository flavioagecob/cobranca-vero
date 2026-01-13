import { useReconciliation } from "@/hooks/useReconciliation";
import { ReconciliationFilters } from "@/components/reconciliation/ReconciliationFilters";
import { ReconciliationStats } from "@/components/reconciliation/ReconciliationStats";
import { IssueList } from "@/components/reconciliation/IssueList";
import { toast } from "sonner";

export default function Reconciliation() {
  const {
    issues,
    isLoading,
    error,
    stats,
    filters,
    setFilters,
    refetch,
    resolveIssue,
    linkOsToContract,
    runReconciliation
  } = useReconciliation();

  const handleResolve = async (issueId: string, notes: string) => {
    const success = await resolveIssue(issueId, notes);
    if (success) {
      toast.success('Divergência marcada como resolvida');
    } else {
      toast.error('Erro ao resolver divergência');
    }
    return success;
  };

  const handleLink = async (issueId: string, osId: string, contractId: string) => {
    const success = await linkOsToContract(issueId, osId, contractId);
    if (success) {
      toast.success('OS vinculada ao contrato com sucesso');
    } else {
      toast.error('Erro ao vincular OS ao contrato');
    }
    return success;
  };

  const handleRunReconciliation = async () => {
    toast.info('Executando conciliação...');
    const success = await runReconciliation();
    if (success) {
      toast.success('Conciliação concluída');
    } else {
      toast.error('Erro ao executar conciliação');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conciliação</h1>
        <p className="text-muted-foreground">
          Identifique e resolva divergências entre Base de Vendas (OS) e Base Operadora
        </p>
      </div>

      <ReconciliationStats stats={stats} />

      <ReconciliationFilters
        filters={filters}
        onFiltersChange={setFilters}
        onRunReconciliation={handleRunReconciliation}
        onRefresh={refetch}
        isLoading={isLoading}
      />

      <IssueList
        issues={issues}
        isLoading={isLoading}
        error={error}
        onResolve={handleResolve}
        onLink={handleLink}
      />
    </div>
  );
}
