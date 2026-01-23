import { Link } from 'react-router-dom';
import { Eye, Phone, Mail, FileX, CheckCircle, AlertTriangle } from 'lucide-react';
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
import { SortableHeader } from '@/components/ui/sortable-header';
import { formatCpfCnpj, formatPhone, formatCurrency, formatDate } from '@/lib/formatters';
import { CUSTOMER_SITUACAO_CONFIG } from '@/types/customer';
import type { CustomerWithOperatorSummary, CustomerSortField, CustomerSortState } from '@/types/customer';

interface CustomerTableProps {
  customers: CustomerWithOperatorSummary[];
  isLoading: boolean;
  sortState: CustomerSortState;
  onSort: (field: CustomerSortField) => void;
}

export function CustomerTable({ customers, isLoading, sortState, onSort }: CustomerTableProps) {
  const handleSort = (field: string) => {
    onSort(field as CustomerSortField);
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">CPF/CNPJ</TableHead>
              <TableHead className="hidden lg:table-cell">Contato</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="hidden md:table-cell">Valor Pendente</TableHead>
              <TableHead className="hidden xl:table-cell">Próx. Vencimento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
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

  const getSituacaoIcon = (situacao: CustomerWithOperatorSummary['situacao']) => {
    switch (situacao) {
      case 'paid':
        return <CheckCircle className="h-3.5 w-3.5" />;
      case 'overdue':
        return <AlertTriangle className="h-3.5 w-3.5" />;
      case 'no_contract':
        return <FileX className="h-3.5 w-3.5" />;
    }
  };

  const getRowClassName = (situacao: CustomerWithOperatorSummary['situacao']) => {
    switch (situacao) {
      case 'paid':
        return 'bg-emerald-500/5 hover:bg-emerald-500/10';
      case 'overdue':
        return 'bg-destructive/5 hover:bg-destructive/10';
      case 'no_contract':
        return 'bg-muted/30 hover:bg-muted/50';
      default:
        return '';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader
              field="nome"
              currentField={sortState.field}
              direction={sortState.direction}
              onSort={handleSort}
            >
              Nome
            </SortableHeader>
            <SortableHeader
              field="cpf_cnpj"
              currentField={sortState.field}
              direction={sortState.direction}
              onSort={handleSort}
              className="hidden sm:table-cell"
            >
              CPF/CNPJ
            </SortableHeader>
            <TableHead className="hidden lg:table-cell">Contato</TableHead>
            <TableHead>Situação</TableHead>
            <SortableHeader
              field="total_valor_pendente"
              currentField={sortState.field}
              direction={sortState.direction}
              onSort={handleSort}
              className="hidden md:table-cell"
            >
              Valor Pendente
            </SortableHeader>
            <SortableHeader
              field="proxima_data_vencimento"
              currentField={sortState.field}
              direction={sortState.direction}
              onSort={handleSort}
              className="hidden xl:table-cell"
            >
              Próx. Vencimento
            </SortableHeader>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => {
            const situacaoConfig = CUSTOMER_SITUACAO_CONFIG[customer.situacao];
            
            return (
              <TableRow key={customer.id} className={getRowClassName(customer.situacao)}>
                <TableCell>
                  <div>
                    <div className="font-medium">{customer.nome}</div>
                    {customer.status_contrato && (
                      <span className="text-xs text-muted-foreground">
                        {customer.status_contrato}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell font-mono text-sm">
                  {formatCpfCnpj(customer.cpf_cnpj)}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
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
                <TableCell>
                  <Badge variant="outline" className={`${situacaoConfig.className} gap-1`}>
                    {getSituacaoIcon(customer.situacao)}
                    {situacaoConfig.label}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {customer.total_valor_pendente > 0 ? (
                    <span className="font-medium text-amber-600">
                      {formatCurrency(customer.total_valor_pendente)}
                    </span>
                  ) : (
                    <span className="text-emerald-600">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {customer.proxima_data_vencimento ? (
                    <span className={customer.situacao === 'overdue' ? 'text-destructive font-medium' : ''}>
                      {formatDate(customer.proxima_data_vencimento)}
                    </span>
                  ) : (
                    <span className="text-emerald-600 text-sm">Em dia</span>
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
