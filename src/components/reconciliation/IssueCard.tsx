import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  CheckCircle,
  Link,
  FileText,
  User,
  Calendar,
  DollarSign,
  UserX,
  FileX,
  Unlink,
  Copy
} from "lucide-react";
import { ReconciliationIssue, ISSUE_TYPE_CONFIG, ISSUE_STATUS_CONFIG } from "@/types/reconciliation";
import { formatCurrency, formatDate, formatCpfCnpj } from "@/lib/formatters";

interface IssueCardProps {
  issue: ReconciliationIssue;
  onResolve: (issueId: string, notes: string) => Promise<boolean>;
  onLink?: (issueId: string, osId: string, contractId: string) => Promise<boolean>;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  UserX,
  FileX,
  Unlink,
  Copy,
  AlertTriangle,
  AlertCircle: AlertTriangle // fallback
};

export function IssueCard({ issue, onResolve, onLink }: IssueCardProps) {
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const issueType = issue.tipo || issue.issue_type;
  const typeConfig = issueType ? ISSUE_TYPE_CONFIG[issueType] : null;
  const statusConfig = issue.status ? ISSUE_STATUS_CONFIG[issue.status as 'PENDENTE' | 'RESOLVIDO'] : ISSUE_STATUS_CONFIG.PENDENTE;
  const Icon = typeConfig?.icon ? (iconMap[typeConfig.icon] || AlertTriangle) : AlertTriangle;

  const handleResolve = async () => {
    setIsSubmitting(true);
    const success = await onResolve(issue.id, notes);
    if (success) {
      setResolveDialogOpen(false);
      setNotes("");
    }
    setIsSubmitting(false);
  };

  const getCustomerInfo = () => {
    return issue.customer || issue.sales_base?.customer || issue.operator_contract?.customer;
  };

  const customerInfo = getCustomerInfo();

  return (
    <Card className={issue.status === 'RESOLVIDO' ? 'opacity-60' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${typeConfig?.color || 'bg-muted'}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{typeConfig?.label || 'Divergência'}</CardTitle>
              <p className="text-xs text-muted-foreground">{typeConfig?.description || issue.descricao}</p>
            </div>
          </div>
          <Badge className={statusConfig?.color || ''} variant="outline">
            {statusConfig?.label || issue.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Sales Base Info */}
          {issue.sales_base && (
            <div className="space-y-2 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Base de Vendas (OS)
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">OS:</span>
                  <span className="font-mono">{issue.sales_base.os}</span>
                </div>
                {issue.sales_base.produto && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Produto:</span>
                    <span>{issue.sales_base.produto}</span>
                  </div>
                )}
                {issue.sales_base.plano && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plano:</span>
                    <span>{issue.sales_base.plano}</span>
                  </div>
                )}
                {issue.sales_base.valor_plano && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor:</span>
                    <span>{formatCurrency(issue.sales_base.valor_plano)}</span>
                  </div>
                )}
                {issue.sales_base.data_venda && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data Venda:</span>
                    <span>{formatDate(issue.sales_base.data_venda)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Operator Contract Info */}
          {issue.operator_contract && (
            <div className="space-y-2 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Base Operadora (Contrato)
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Contrato:</span>
                  <span className="font-mono">{issue.operator_contract.id_contrato}</span>
                </div>
                {issue.operator_contract.numero_contrato_operadora && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nº Operadora:</span>
                    <span>{issue.operator_contract.numero_contrato_operadora}</span>
                  </div>
                )}
                {issue.operator_contract.status_operadora && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span>{issue.operator_contract.status_operadora}</span>
                  </div>
                )}
                {issue.operator_contract.valor_contrato && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor:</span>
                    <span>{formatCurrency(issue.operator_contract.valor_contrato)}</span>
                  </div>
                )}
                {issue.operator_contract.data_ativacao && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ativação:</span>
                    <span>{formatDate(issue.operator_contract.data_ativacao)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Customer Info */}
        {customerInfo && (
          <div className="flex items-center gap-4 p-3 rounded-lg border">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{customerInfo.nome}</p>
              <p className="text-sm text-muted-foreground font-mono">
                {formatCpfCnpj(customerInfo.cpf_cnpj)}
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        {issue.descricao && (
          <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
            {issue.descricao}
          </div>
        )}

        {/* Resolution Info */}
        {issue.status === 'RESOLVIDO' && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200">
            <CheckCircle className="h-4 w-4 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Resolvido em {formatDate(issue.resolved_at || '')}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        {issue.status === 'PENDENTE' && (
          <div className="flex gap-2 pt-2">
            <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar Resolvido
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Resolver Divergência</DialogTitle>
                  <DialogDescription>
                    Informe como a divergência foi resolvida para registro de auditoria.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  placeholder="Descreva como a divergência foi resolvida..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleResolve} disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : 'Confirmar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Criado em {formatDate(issue.created_at)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
