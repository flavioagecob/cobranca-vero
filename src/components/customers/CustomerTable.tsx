import { Link } from 'react-router-dom';
import { Eye, Phone, Mail, AlertCircle, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCpfCnpj, formatPhone, formatCurrency, formatDate, getStatusColor, calculateDaysOverdue } from '@/lib/formatters';
import type { CustomerWithOperatorSummary } from '@/types/customer';

interface CustomerTableProps {
  customers: CustomerWithOperatorSummary[];
  isLoading: boolean;
}

export function CustomerTable({ customers, isLoading }: CustomerTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead className="hidden md:table-cell">Contato</TableHead>
              <TableHead className="hidden lg:table-cell">Contratos</TableHead>
              <TableHead className="hidden lg:table-cell">Valor Pendente</TableHead>
              <TableHead className="hidden xl:table-cell">Próx. Vencimento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">Nenhum cliente encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tente ajustar os filtros ou importe novos clientes
          </p>
        </div>
      </div>
    );
  }

  const getDueDateStatus = (dueDate: string | null) => {
    if (!dueDate) return null;
    
    const daysOverdue = calculateDaysOverdue(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse a data corretamente para evitar problemas de timezone
    let due: Date;
    const isoDateMatch = dueDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDateMatch) {
      const [, year, month, day] = isoDateMatch;
      due = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      due = new Date(dueDate);
    }
    due.setHours(0, 0, 0, 0);
    
    if (daysOverdue > 0) {
      return {
        type: 'overdue',
        label: `${daysOverdue}d atraso`,
        className: 'bg-destructive/10 text-destructive border-destructive/20',
      };
    }
    
    if (due.getTime() === today.getTime()) {
      return {
        type: 'today',
        label: 'Vence hoje',
        className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      };
    }
    
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      return {
        type: 'soon',
        label: `Em ${diffDays}d`,
        className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      };
    }
    
    return {
      type: 'normal',
      label: formatDate(dueDate),
      className: 'bg-muted text-muted-foreground border-border',
    };
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CPF/CNPJ</TableHead>
            <TableHead className="hidden md:table-cell">Contato</TableHead>
            <TableHead className="hidden lg:table-cell">Contratos</TableHead>
            <TableHead className="hidden lg:table-cell">Valor Pendente</TableHead>
            <TableHead className="hidden xl:table-cell">Próx. Vencimento</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => {
            const dueDateStatus = getDueDateStatus(customer.proxima_data_vencimento);
            const hasOverdue = dueDateStatus?.type === 'overdue';
            
            return (
              <TableRow key={customer.id} className={hasOverdue ? 'bg-destructive/5' : undefined}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {hasOverdue && <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
                    <div>
                      <div className="font-medium">{customer.nome}</div>
                      {customer.status_contrato && (
                        <Badge variant="outline" className={`mt-0.5 text-xs ${getStatusColor(customer.status_contrato)}`}>
                          {customer.status_contrato}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {formatCpfCnpj(customer.cpf_cnpj)}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {customer.telefone && (
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {formatPhone(customer.telefone)}
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate max-w-32">{customer.email}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {customer.contracts_count > 0 ? (
                    <span className="font-medium">{customer.contracts_count}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {customer.total_valor_pendente > 0 ? (
                    <span className="font-medium text-amber-600">
                      {formatCurrency(customer.total_valor_pendente)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {dueDateStatus ? (
                    <div className="flex items-center gap-1">
                      {(dueDateStatus.type === 'overdue' || dueDateStatus.type === 'today') && (
                        <Clock className="h-3 w-3" />
                      )}
                      <Badge variant="outline" className={dueDateStatus.className}>
                        {dueDateStatus.label}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/customers/${customer.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
