import { Link } from 'react-router-dom';
import { Eye, MoreHorizontal, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCpfCnpj, formatCurrency, formatDate } from '@/lib/formatters';
import { 
  INVOICE_STATUS_CONFIG, 
  getOverdueBadgeClass,
  type Invoice,
  type InvoiceStatus 
} from '@/types/invoice';

interface InvoiceTableProps {
  invoices: Invoice[];
  isLoading: boolean;
  onStatusChange: (id: string, status: InvoiceStatus) => void;
}

export function InvoiceTable({ invoices, isLoading, onStatusChange }: InvoiceTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fatura</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dias Atraso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">Nenhuma fatura encontrada</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tente ajustar os filtros ou importe novos dados
          </p>
        </div>
      </div>
    );
  }

  const getOverdueIcon = (days: number) => {
    if (days <= 0) return <CheckCircle className="h-3 w-3" />;
    if (days <= 15) return <Clock className="h-3 w-3" />;
    return <AlertTriangle className="h-3 w-3" />;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fatura</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Dias Atraso</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            const statusConfig = INVOICE_STATUS_CONFIG[invoice.status];
            const overdueClass = getOverdueBadgeClass(invoice.dias_atraso);

            return (
              <TableRow key={invoice.id}>
                <TableCell>
                  <span className="font-mono text-sm font-medium">
                    {invoice.numero_fatura}
                  </span>
                </TableCell>
                <TableCell>
                  {invoice.customer ? (
                    <div>
                      <Link 
                        to={`/customers/${invoice.customer.id}`}
                        className="font-medium hover:underline"
                      >
                        {invoice.customer.nome}
                      </Link>
                      <p className="text-xs text-muted-foreground font-mono">
                        {formatCpfCnpj(invoice.customer.cpf_cnpj)}
                      </p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(invoice.valor)}
                </TableCell>
                <TableCell>{formatDate(invoice.data_vencimento)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusConfig.className}>
                    {statusConfig.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {invoice.status === 'pago' ? (
                    <span className="text-muted-foreground">-</span>
                  ) : invoice.dias_atraso > 0 ? (
                    <Badge variant="outline" className={overdueClass}>
                      {getOverdueIcon(invoice.dias_atraso)}
                      <span className="ml-1">{invoice.dias_atraso}d</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Em dia
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {invoice.customer && (
                        <DropdownMenuItem asChild>
                          <Link to={`/customers/${invoice.customer.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Cliente
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onStatusChange(invoice.id, 'pago')}
                        disabled={invoice.status === 'pago'}
                      >
                        <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" />
                        Marcar como Pago
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onStatusChange(invoice.id, 'negociado')}
                        disabled={invoice.status === 'negociado'}
                      >
                        <Clock className="h-4 w-4 mr-2 text-blue-600" />
                        Marcar como Negociado
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onStatusChange(invoice.id, 'cancelado')}
                        disabled={invoice.status === 'cancelado'}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2 text-muted-foreground" />
                        Cancelar Fatura
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
