import { useState } from 'react';
import { MessageCircle, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DEFAULT_TEMPLATES, CHANNEL_CONFIG, type MessageTemplate } from '@/types/collection';
import { toast } from 'sonner';

interface MessageTemplatesProps {
  customerName: string;
  valorPendente?: number;
  onSelectTemplate?: (content: string) => void;
}

export function MessageTemplates({ 
  customerName, 
  valorPendente = 0,
  onSelectTemplate 
}: MessageTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [copied, setCopied] = useState(false);

  const replaceVariables = (content: string): string => {
    const today = new Date();
    const replacements: Record<string, string> = {
      '{nome}': customerName.split(' ')[0], // First name
      '{nome_completo}': customerName,
      '{valor}': valorPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      '{data_vencimento}': today.toLocaleDateString('pt-BR'),
      '{dias_atraso}': '15', // Placeholder
      '{link_pagamento}': 'https://pagamento.exemplo.com/xxx',
      '{numero_fatura}': 'FAT-001', // Placeholder
      '{valor_acordo}': (valorPendente * 0.9).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      '{condicoes}': 'Entrada + 2x sem juros',
      '{valor_prometido}': valorPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      '{data_promessa}': new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
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

  const handleUse = () => {
    if (onSelectTemplate) {
      onSelectTemplate(editedContent);
    }
    
    // Open WhatsApp if it's a WhatsApp template
    if (selectedTemplate?.canal === 'whatsapp') {
      const encoded = encodeURIComponent(editedContent);
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  const whatsappTemplates = DEFAULT_TEMPLATES.filter((t) => t.canal === 'whatsapp');
  const emailTemplates = DEFAULT_TEMPLATES.filter((t) => t.canal === 'email');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Templates de Mensagem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template List */}
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">WhatsApp</p>
            {whatsappTemplates.map((template) => (
              <Button
                key={template.id}
                variant={selectedTemplate?.id === template.id ? 'secondary' : 'ghost'}
                className="w-full justify-start h-auto py-2"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm truncate">{template.nome}</span>
                </div>
              </Button>
            ))}
            
            <p className="text-xs font-medium text-muted-foreground pt-2">E-mail</p>
            {emailTemplates.map((template) => (
              <Button
                key={template.id}
                variant={selectedTemplate?.id === template.id ? 'secondary' : 'ghost'}
                className="w-full justify-start h-auto py-2"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-sm">{template.nome}</span>
                  {template.assunto && (
                    <span className="text-xs text-muted-foreground truncate max-w-full">
                      Assunto: {template.assunto}
                    </span>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Preview/Edit */}
        {selectedTemplate && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                {CHANNEL_CONFIG[selectedTemplate.canal].label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {selectedTemplate.variaveis.length} variáveis
              </span>
            </div>

            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={6}
              className="text-sm"
            />

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
              <Button size="sm" onClick={handleUse} className="flex-1">
                {selectedTemplate.canal === 'whatsapp' ? 'Abrir WhatsApp' : 'Usar Mensagem'}
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
