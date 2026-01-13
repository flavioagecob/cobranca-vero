import { ReconciliationIssue } from "@/types/reconciliation";
import { IssueCard } from "./IssueCard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface IssueListProps {
  issues: ReconciliationIssue[];
  isLoading: boolean;
  error: string | null;
  onResolve: (issueId: string, notes: string) => Promise<boolean>;
  onLink: (issueId: string, osId: string, contractId: string) => Promise<boolean>;
}

export function IssueList({ issues, isLoading, error, onResolve, onLink }: IssueListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold">Erro ao carregar divergências</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold">Nenhuma divergência encontrada</h3>
        <p className="text-muted-foreground">
          Execute a conciliação para verificar se há novas divergências entre as bases.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {issues.map((issue) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          onResolve={onResolve}
          onLink={onLink}
        />
      ))}
    </div>
  );
}
