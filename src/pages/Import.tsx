import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUploadZone } from '@/components/import/FileUploadZone';
import { ColumnMapper } from '@/components/import/ColumnMapper';
import { DataPreview } from '@/components/import/DataPreview';
import { ImportProgress } from '@/components/import/ImportProgress';
import { ImportResult } from '@/components/import/ImportResult';
import { useXlsxParser } from '@/hooks/useXlsxParser';
import { useImport } from '@/hooks/useImport';
import type { 
  ImportType, 
  ColumnMapping, 
  ImportPreview, 
  ImportResult as ImportResultType 
} from '@/types/import';
import { SALES_FIELDS, OPERATOR_FIELDS } from '@/types/import';
import { useAuth } from '@/contexts/AuthContext';

type ImportStep = 'upload' | 'mapping' | 'importing' | 'result';

const Import = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  
  // State
  const [importType, setImportType] = useState<ImportType>('sales');
  const [step, setStep] = useState<ImportStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [result, setResult] = useState<ImportResultType | null>(null);

  // Hooks
  const { isLoading: isParsing, error: parseError, parseFile, reset: resetParser } = useXlsxParser();
  const { isImporting, progress, executeImport } = useImport();

  // Check permission
  if (role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Acesso Negado</CardTitle>
            <CardDescription>
              Apenas administradores podem importar planilhas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')}>
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Initialize mappings when type changes
  const initializeMappings = useCallback((type: ImportType, headers: string[]) => {
    const fields = type === 'sales' ? SALES_FIELDS : OPERATOR_FIELDS;
    
    // Try to auto-match columns by similar names
    const autoMatch = (targetField: string): string => {
      const target = targetField.toLowerCase().replace(/_/g, '');
      
      for (const header of headers) {
        const h = header.toLowerCase().replace(/[\s_-]/g, '');
        if (h === target || h.includes(target) || target.includes(h)) {
          return header;
        }
      }
      
      // Common mappings
      const commonMappings: Record<string, string[]> = {
        cpf_cnpj: ['cpf', 'cnpj', 'documento', 'doc'],
        nome: ['nome', 'name', 'cliente', 'customer'],
        telefone: ['telefone', 'phone', 'tel', 'celular', 'fone'],
        email: ['email', 'e-mail', 'mail'],
        os: ['os', 'ordem', 'order', 'orderservice'],
        id_contrato: ['id', 'contrato', 'contract', 'idcontrato'],
      };
      
      const patterns = commonMappings[targetField] || [];
      for (const pattern of patterns) {
        for (const header of headers) {
          if (header.toLowerCase().includes(pattern)) {
            return header;
          }
        }
      }
      
      return '';
    };
    
    return fields.map((field) => ({
      ...field,
      sourceColumn: autoMatch(field.targetField),
    }));
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    const parsed = await parseFile(file);
    
    if (parsed) {
      setPreview(parsed);
      setMappings(initializeMappings(importType, parsed.headers));
      setStep('mapping');
    }
  }, [parseFile, initializeMappings, importType]);

  // Handle type change
  const handleTypeChange = useCallback((type: string) => {
    const newType = type as ImportType;
    setImportType(newType);
    
    if (preview) {
      setMappings(initializeMappings(newType, preview.headers));
    }
  }, [preview, initializeMappings]);

  // Handle mapping change
  const handleMappingChange = useCallback((field: string, sourceColumn: string) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.targetField === field ? { ...m, sourceColumn } : m
      )
    );
  }, []);

  // Handle import execution
  const handleImport = useCallback(async () => {
    if (!preview || !selectedFile) return;
    
    setStep('importing');
    
    // Re-parse to get all rows (not just preview)
    const fullParse = await parseFile(selectedFile, true);
    if (!fullParse) {
      setStep('mapping');
      return;
    }
    
    const importResult = await executeImport(
      importType,
      fullParse.rows,
      mappings,
      selectedFile.name
    );
    
    setResult(importResult);
    setStep('result');
  }, [preview, selectedFile, parseFile, executeImport, importType, mappings]);

  // Handle reset
  const handleReset = useCallback(() => {
    setStep('upload');
    setSelectedFile(null);
    setPreview(null);
    setMappings([]);
    setResult(null);
    resetParser();
  }, [resetParser]);

  // Check if mapping is valid
  const isMappingValid = useMemo(() => {
    const requiredFields = mappings.filter((m) => m.required);
    return requiredFields.every((m) => m.sourceColumn);
  }, [mappings]);

  // Highlighted columns
  const highlightedColumns = useMemo(() => {
    return mappings
      .filter((m) => m.sourceColumn)
      .map((m) => m.sourceColumn);
  }, [mappings]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importar Planilhas</h1>
        <p className="text-muted-foreground">
          Carregue dados de vendas ou contratos da operadora
        </p>
      </div>

      <div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {step === 'upload' && 'Selecione o Arquivo'}
                  {step === 'mapping' && 'Configure o Mapeamento'}
                  {step === 'importing' && 'Importando...'}
                  {step === 'result' && 'Resultado da Importação'}
                </CardTitle>
                <CardDescription>
                  {step === 'upload' && 'Escolha o tipo de importação e faça upload da planilha'}
                  {step === 'mapping' && 'Associe as colunas da planilha aos campos do sistema'}
                  {step === 'importing' && 'Aguarde enquanto processamos seus dados'}
                  {step === 'result' && 'Confira o resultado da importação'}
                </CardDescription>
              </div>

              {step === 'upload' && (
                <Tabs value={importType} onValueChange={handleTypeChange}>
                  <TabsList>
                    <TabsTrigger value="sales" className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Base de Vendas
                    </TabsTrigger>
                    <TabsTrigger value="operator" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Base Operadora
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 'upload' && (
              <>
                <FileUploadZone
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  onClear={handleReset}
                  isLoading={isParsing}
                />
                
                {parseError && (
                  <p className="text-destructive text-sm text-center">
                    {parseError}
                  </p>
                )}

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">
                    {importType === 'sales' ? 'Base de Vendas' : 'Base Operadora'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {importType === 'sales'
                      ? 'Planilha com dados de vendas, incluindo OS (Ordem de Serviço), dados do cliente, produto e plano.'
                      : 'Planilha da operadora com ID do contrato, status e datas de ativação/cancelamento.'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Chave de Match:</strong>{' '}
                    {importType === 'sales' ? 'OS (Ordem de Serviço)' : 'ID Contrato'}
                  </p>
                </div>
              </>
            )}

            {step === 'mapping' && preview && (
              <>
                <ColumnMapper
                  availableColumns={preview.headers}
                  mappings={mappings}
                  onMappingChange={handleMappingChange}
                />

                <DataPreview
                  headers={preview.headers}
                  rows={preview.rows}
                  totalRows={preview.totalRows}
                  highlightedColumns={highlightedColumns}
                />

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleReset}>
                    Voltar
                  </Button>
                  <Button onClick={handleImport} disabled={!isMappingValid}>
                    Importar {preview.totalRows} Registros
                  </Button>
                </div>
              </>
            )}

            {step === 'importing' && (
              <ImportProgress progress={progress} />
            )}

            {step === 'result' && result && (
              <ImportResult
                result={result}
                onNewImport={handleReset}
                onViewData={() => navigate('/customers')}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Import;
