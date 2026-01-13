import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Play } from "lucide-react";
import { ReconciliationFilters as Filters, ISSUE_TYPE_CONFIG, ISSUE_STATUS_CONFIG, IssueType, IssueStatus } from "@/types/reconciliation";

interface ReconciliationFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onRunReconciliation: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function ReconciliationFilters({
  filters,
  onFiltersChange,
  onRunReconciliation,
  onRefresh,
  isLoading
}: ReconciliationFiltersProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por OS, contrato ou cliente..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.issueType}
          onValueChange={(value) => onFiltersChange({ ...filters, issueType: value as IssueType | 'all' })}
        >
          <SelectTrigger className="w-full md:w-[220px]">
            <SelectValue placeholder="Tipo de divergência" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(ISSUE_TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value as IssueStatus | 'all' })}
        >
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(ISSUE_STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
        <Button
          size="sm"
          onClick={onRunReconciliation}
          disabled={isLoading}
        >
          <Play className="h-4 w-4 mr-2" />
          Executar Conciliação
        </Button>
      </div>
    </div>
  );
}
