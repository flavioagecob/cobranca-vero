import { useState } from 'react';
import { Phone, Mail, MapPin, Calendar, FileText, Building2, User, Copy, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCustomerDetail } from '@/hooks/useCustomers';
import { HistoryTimeline } from '@/components/collection/HistoryTimeline';
import { formatCpfCnpj, formatPhone, formatDate, formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';
import type { CollectionAttempt, PaymentPromise } from '@/types/collection';

interface CustomerDetailDialogProps {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailDialog({ customerId, open, onOpenChange }: CustomerDetailDialogProps) {
  const { customer, attempts, promises, isLoading, error } = useCustomerDetail(open ? customerId : undefined);

  const mappedAttempts: CollectionAttempt[] = attempts.map(a => ({
    id: a.id,
    customer_id: a.customer_id,
    invoice_id: a.invoice_id,
    collector_id: a.collector_id,
    channel: a.channel as CollectionAttempt['channel'],
    status: a.status as CollectionAttempt['status'],
    notes: a.notes,
    created_at: a.created_at || new Date().toISOString(),
  }));

  const mappedPromises: PaymentPromise[] = promises.map(p => ({
    id: p.id,
    invoice_id: p.invoice_id,
    collector_id: p.collector_id,
    valor_prometido: p.valor_prometido,
    data_prometida: p.data_prometida,
    status: (p.status || 'pendente') as PaymentPromise['status'],
    created_at: p.created_at || new Date().toISOString(),
  }));

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">Ficha do Cliente</DialogTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/customers/${customerId}`} onClick={() => onOpenChange(false)}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Abrir página completa
              </Link>
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-80px)] px-6 pb-6">
          {isLoading ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32 mt-1" />
                </div>
              </div>
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          ) : error || !customer ? (
            <div className="text-center py-12 text-muted-foreground">
              {error || 'Cliente não encontrado'}
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{customer.nome}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-mono text-sm">{formatCpfCnpj(customer.cpf_cnpj)}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6"
                      onClick={() => copyToClipboard(customer.cpf_cnpj, 'CPF/CNPJ')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Info + Tabs */}
              <div className="grid gap-4 lg:grid-cols-3">
                {/* Contact & Address */}
                <Card className="lg:col-span-1">
                  <CardContent className="pt-4 space-y-3">
                    {customer.telefone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{formatPhone(customer.telefone)}</p>
                          <p className="text-xs text-muted-foreground">Principal</p>
                        </div>
                      </div>
                    )}
                    {customer.telefone2 && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{formatPhone(customer.telefone2)}</p>
                          <p className="text-xs text-muted-foreground">Secundário</p>
                        </div>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium break-all">{customer.email}</p>
                      </div>
                    )}
                    <Separator />
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        {customer.endereco && <p className="text-sm">{customer.endereco}</p>}
                        {(customer.cidade || customer.uf) && (
                          <p className="text-sm text-muted-foreground">
                            {customer.cidade}{customer.cidade && customer.uf && ' - '}{customer.uf}
                          </p>
                        )}
                        {customer.cep && <p className="text-sm text-muted-foreground">CEP: {customer.cep}</p>}
                        {!customer.endereco && !customer.cidade && !customer.uf && (
                          <p className="text-sm text-muted-foreground">Endereço não informado</p>
                        )}
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{formatDate(customer.created_at)}</p>
                        <p className="text-xs text-muted-foreground">Cadastrado em</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sales & Contracts Tabs */}
                <Card className="lg:col-span-2">
                  <Tabs defaultValue="sales" className="w-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Histórico</CardTitle>
                        <TabsList>
                          <TabsTrigger value="sales" className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            Vendas ({customer.total_sales || 0})
                          </TabsTrigger>
                          <TabsTrigger value="contracts" className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            Contratos ({customer.total_contracts || 0})
                          </TabsTrigger>
                        </TabsList>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <TabsContent value="sales" className="mt-0">
                        {customer.sales_base && customer.sales_base.length > 0 ? (
                          <div className="rounded-md border overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>OS</TableHead>
                                  <TableHead>Produto/Plano</TableHead>
                                  <TableHead>Valor</TableHead>
                                  <TableHead>Data Venda</TableHead>
                                  <TableHead>Vendedor</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {customer.sales_base.map((sale) => (
                                  <TableRow key={sale.id}>
                                    <TableCell className="font-mono text-sm font-medium">{sale.os}</TableCell>
                                    <TableCell>
                                      <div>
                                        {sale.produto && <p className="font-medium">{sale.produto}</p>}
                                        {sale.plano && <p className="text-sm text-muted-foreground">{sale.plano}</p>}
                                      </div>
                                    </TableCell>
                                    <TableCell>{formatCurrency(sale.valor_plano)}</TableCell>
                                    <TableCell>{formatDate(sale.data_venda)}</TableCell>
                                    <TableCell>{sale.vendedor || '-'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-muted-foreground text-sm">Nenhuma venda registrada</div>
                        )}
                      </TabsContent>

                      <TabsContent value="contracts" className="mt-0">
                        {customer.operator_contracts && customer.operator_contracts.length > 0 ? (
                          <div className="rounded-md border overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>ID Contrato</TableHead>
                                  <TableHead>Safra</TableHead>
                                  <TableHead>Nº Fatura</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Valor</TableHead>
                                  <TableHead>Vencimento</TableHead>
                                  <TableHead>Pagamento</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {customer.operator_contracts.map((contract) => {
                                  const isOverdue = contract.data_vencimento &&
                                    new Date(contract.data_vencimento) < new Date() &&
                                    !contract.data_pagamento;
                                  const isPaid = !!contract.data_pagamento;
                                  return (
                                    <TableRow key={contract.id}
                                      className={isOverdue ? 'bg-destructive/5' : isPaid ? 'bg-emerald-500/5' : undefined}>
                                      <TableCell className="font-mono text-sm font-medium">{contract.id_contrato}</TableCell>
                                      <TableCell className="text-sm">{contract.mes_safra_cadastro || '-'}</TableCell>
                                      <TableCell className="font-mono text-sm">{contract.numero_fatura || '-'}</TableCell>
                                      <TableCell>
                                        {isPaid ? (
                                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">PAGO</Badge>
                                        ) : isOverdue ? (
                                          <Badge variant="destructive">VENCIDO</Badge>
                                        ) : (
                                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">PENDENTE</Badge>
                                        )}
                                      </TableCell>
                                      <TableCell className={isOverdue ? 'font-medium text-destructive' : ''}>
                                        {formatCurrency(contract.valor_fatura || contract.valor_contrato)}
                                      </TableCell>
                                      <TableCell className={isOverdue ? 'font-medium text-destructive' : ''}>
                                        {formatDate(contract.data_vencimento)}
                                      </TableCell>
                                      <TableCell>
                                        {contract.data_pagamento ? (
                                          <span className="text-emerald-600 font-medium">{formatDate(contract.data_pagamento)}</span>
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-muted-foreground text-sm">Nenhum contrato registrado</div>
                        )}
                      </TabsContent>
                    </CardContent>
                  </Tabs>
                </Card>
              </div>

              {/* Faturas Summary + History */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Resumo de Faturas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customer.operator_contracts && customer.operator_contracts.length > 0 ? (
                      <div className="space-y-4">
                        {(() => {
                          const contracts = customer.operator_contracts;
                          const now = new Date();
                          now.setHours(0, 0, 0, 0);
                          const pendingContracts = contracts.filter(c => !c.data_pagamento);
                          const overdueContracts = pendingContracts.filter(c => {
                            if (!c.data_vencimento) return false;
                            const match = c.data_vencimento.match(/^(\d{4})-(\d{2})-(\d{2})/);
                            if (!match) return false;
                            const dueDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
                            return dueDate < now;
                          });
                          const paidContracts = contracts.filter(c => c.data_pagamento);
                          const totalPending = pendingContracts.reduce((sum, c) => sum + (c.valor_fatura || 0), 0);
                          const totalOverdue = overdueContracts.reduce((sum, c) => sum + (c.valor_fatura || 0), 0);

                          return (
                            <>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-2 rounded-lg bg-muted/50">
                                  <p className="text-xl font-bold text-destructive">{overdueContracts.length}</p>
                                  <p className="text-xs text-muted-foreground">Vencidas</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-muted/50">
                                  <p className="text-xl font-bold text-amber-600">{pendingContracts.length - overdueContracts.length}</p>
                                  <p className="text-xs text-muted-foreground">A vencer</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-muted/50">
                                  <p className="text-xl font-bold text-emerald-600">{paidContracts.length}</p>
                                  <p className="text-xs text-muted-foreground">Pagas</p>
                                </div>
                              </div>
                              <Separator />
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Total vencido:</span>
                                  <span className="font-medium text-destructive">{formatCurrency(totalOverdue)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Total pendente:</span>
                                  <span className="font-medium">{formatCurrency(totalPending)}</span>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground text-sm">Nenhuma fatura registrada</div>
                    )}
                  </CardContent>
                </Card>

                <HistoryTimeline attempts={mappedAttempts} promises={mappedPromises} />
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
