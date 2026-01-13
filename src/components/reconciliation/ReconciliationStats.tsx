import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Clock, FileX, UserX, Unlink, Copy, AlertCircle } from "lucide-react";
import { ReconciliationStats as Stats, ISSUE_TYPE_CONFIG, IssueType } from "@/types/reconciliation";

interface ReconciliationStatsProps {
  stats: Stats;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  UserX,
  FileX,
  Unlink,
  Copy,
  AlertTriangle
};

export function ReconciliationStats({ stats }: ReconciliationStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Divergências</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendentes}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resolvidos</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolvidos}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Por Tipo</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byType).map(([type, count]) => {
                if (count === 0) return null;
                const config = ISSUE_TYPE_CONFIG[type as IssueType];
                const Icon = iconMap[config.icon] || AlertTriangle;
                return (
                  <div
                    key={type}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.color}`}
                    title={config.label}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
