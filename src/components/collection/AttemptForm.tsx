import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { CHANNEL_CONFIG, RESULT_CONFIG, type AttemptChannel, type AttemptResult } from '@/types/collection';

interface AttemptFormProps {
  customerId: string;
  initialChannel?: AttemptChannel;
  onSubmit: (data: AttemptFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface AttemptFormData {
  canal: AttemptChannel;
  resultado: AttemptResult;
  observacoes: string;
  createPromise: boolean;
  promiseData?: {
    valor_prometido: number;
    data_pagamento_previsto: string;
    observacoes: string;
  };
}

export function AttemptForm({ 
  customerId, 
  initialChannel = 'telefone', 
  onSubmit, 
  onCancel,
  isLoading 
}: AttemptFormProps) {
  const [canal, setCanal] = useState<AttemptChannel>(initialChannel);
  const [resultado, setResultado] = useState<AttemptResult>('contato_efetivo');
  const [observacoes, setObservacoes] = useState('');
  const [createPromise, setCreatePromise] = useState(false);
  const [valorPrometido, setValorPrometido] = useState('');
  const [dataPromessa, setDataPromessa] = useState<Date | undefined>();
  const [obsPromessa, setObsPromessa] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: AttemptFormData = {
      canal,
      resultado,
      observacoes,
      createPromise,
    };

    if (createPromise && dataPromessa) {
      data.promiseData = {
        valor_prometido: parseFloat(valorPrometido.replace(/\D/g, '')) / 100 || 0,
        data_pagamento_previsto: format(dataPromessa, 'yyyy-MM-dd'),
        observacoes: obsPromessa,
      };
    }

    await onSubmit(data);
  };

  const formatCurrencyInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Registrar Tentativa</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Canal */}
          <div className="space-y-2">
            <Label>Canal</Label>
            <Select value={canal} onValueChange={(v) => setCanal(v as AttemptChannel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CHANNEL_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resultado */}
          <div className="space-y-2">
            <Label>Resultado</Label>
            <Select value={resultado} onValueChange={(v) => setResultado(v as AttemptResult)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RESULT_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Descreva o contato realizado..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Promise Toggle */}
          {resultado === 'contato_efetivo' && (
            <Tabs value={createPromise ? 'promise' : 'no-promise'} onValueChange={(v) => setCreatePromise(v === 'promise')}>
              <TabsList className="w-full">
                <TabsTrigger value="no-promise" className="flex-1">Sem Promessa</TabsTrigger>
                <TabsTrigger value="promise" className="flex-1">Registrar Promessa</TabsTrigger>
              </TabsList>

              <TabsContent value="promise" className="space-y-4 mt-4">
                {/* Valor Prometido */}
                <div className="space-y-2">
                  <Label>Valor Prometido</Label>
                  <Input
                    placeholder="R$ 0,00"
                    value={valorPrometido ? formatCurrencyInput(valorPrometido) : ''}
                    onChange={(e) => setValorPrometido(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                {/* Data Prevista */}
                <div className="space-y-2">
                  <Label>Data Prevista de Pagamento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dataPromessa && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataPromessa 
                          ? format(dataPromessa, "dd/MM/yyyy", { locale: ptBR })
                          : "Selecionar data"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dataPromessa}
                        onSelect={setDataPromessa}
                        locale={ptBR}
                        disabled={(date) => date < new Date()}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Obs Promessa */}
                <div className="space-y-2">
                  <Label>Observações da Promessa</Label>
                  <Textarea
                    placeholder="Detalhes sobre o acordo..."
                    value={obsPromessa}
                    onChange={(e) => setObsPromessa(e.target.value)}
                    rows={2}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Salvando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
