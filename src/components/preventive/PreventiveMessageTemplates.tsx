import { useState } from 'react';
import { MessageCircle, Copy, Check, Send, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PREVENTIVE_TEMPLATES, CHANNEL_CONFIG, type MessageTemplate } from '@/types/collection';
import { useSendWhatsapp } from '@/hooks/useSendWhatsapp';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PreventiveMessageTemplatesProps {
  customerName: string;
  customerCpf?: string;
  customerPhone?: string;
  customerId?: string;
  salesBaseId?: string;
  dataVencimento?: string;
  onMessageSent?: () => void;
}

export function PreventiveMessageTemplates({
  customerName,
  customerCpf = '',
  customerPhone = '',
  customerId,
  salesBaseId,
  dataVencimento,
  onMessageSent,
}: PreventiveMessageTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [copied, setCopied] = useState(false);

  const {
    connectedInstances,
    selectedInstanceId,
    setSelectedInstanceId,
    sendMessage,
    isLoading,
    isFetchingInstances,
    hasConnectedInstance,
  } = useSendWhatsapp();

  const replaceVariables = (content: string): string => {
    const firstName = customerName.split(' ')[0];
    const cpfClean = customerCpf.replace(/\D/g, '');
    const cpfUltimos5 = cpfClean.slice(-5);
    const dataFormatada = dataVencimento
      ? format(new Date(dataVencimento), "dd/MM/yyyy", { locale: ptBR })
      : '--';

    const replacements: Record<string, string> = {
      '{nome}': firstName,
      '{cpf_ultimos5}': cpfUltimos5,
      '{data_vencimento}': dataFormatada,
    };

    let result = content;
    Object.entries(replacements).forEach(([key, value]) => {
      result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    return result;
  };

  const handleSelectTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setEditedContent(replaceVariables(template.conteudo));
    setCopied(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedContent);
    setCopied(true);
    toast.success('Mensagem copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsapp = async () => {
    if (!customerPhone) { toast.error('Cliente não possui telefone cadastrado'); return; }
    if (!selectedInstanceId) { toast.error('Selecione uma instância WhatsApp'); return; }

    const result = await sendMessage(customerPhone, editedContent, customerId, undefined);
    if (result.success) {
      toast.success('Mensagem enviada e contato registrado!');
      onMessageSent?.();
    } else {
      toast.error(result.error || 'Erro ao enviar mensagem');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Templates Preventivos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isFetchingInstances && !hasConnectedInstance && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma instância WhatsApp conectada. Acesse Configurações para conectar.
            </AlertDescription>
          </Alert>
        )}

        <ScrollArea className="h-[160px]">
          <div className="space-y-2">
            {PREVENTIVE_TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant={selectedTemplate?.id === template.id ? 'secondary' : 'ghost'}
                className="w-full justify-start h-auto py-2"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span className="text-sm truncate">{template.nome}</span>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>

        {selectedTemplate && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline">{CHANNEL_CONFIG[selectedTemplate.canal].label}</Badge>
            </div>

            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={6}
              className="text-sm"
            />

            {selectedTemplate.canal === 'whatsapp' && hasConnectedInstance && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Enviar via:</label>
                <Select value={selectedInstanceId || ''} onValueChange={setSelectedInstanceId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma instância" />
                  </SelectTrigger>
                  <SelectContent>
                    {connectedInstances.map((instance) => (
                      <SelectItem key={instance.id} value={instance.instance_id}>
                        {instance.name} {instance.phone_number ? `(${instance.phone_number})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedTemplate.canal === 'whatsapp' && (
              <div className="text-xs text-muted-foreground">
                {customerPhone ? (
                  <span>Destinatário: {customerPhone}</span>
                ) : (
                  <span className="text-destructive">⚠ Cliente sem telefone cadastrado</span>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1">
                {copied ? <><Check className="h-4 w-4 mr-1" /> Copiado!</> : <><Copy className="h-4 w-4 mr-1" /> Copiar</>}
              </Button>
              <Button size="sm" onClick={handleSendWhatsapp} className="flex-1"
                disabled={isLoading || !hasConnectedInstance || !customerPhone}>
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="h-4 w-4 mr-1" /> Enviar WhatsApp</>
                )}
              </Button>
            </div>
          </div>
        )}

        {!selectedTemplate && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Selecione um template para personalizar
          </p>
        )}
      </CardContent>
    </Card>
  );
}
