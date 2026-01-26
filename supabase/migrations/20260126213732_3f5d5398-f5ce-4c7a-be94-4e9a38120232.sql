-- Adicionar política RLS para permitir que cobradores possam visualizar contratos
CREATE POLICY "operator_contracts_cobrador_select" 
ON public.operator_contracts 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'cobrador'::app_role));