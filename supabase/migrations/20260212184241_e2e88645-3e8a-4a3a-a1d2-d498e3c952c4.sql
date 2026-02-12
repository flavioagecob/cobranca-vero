
-- Adicionar colunas para marcação "Pago pela Empresa"
ALTER TABLE public.operator_contracts
ADD COLUMN pago_pela_empresa boolean NOT NULL DEFAULT false,
ADD COLUMN pago_pela_empresa_at timestamp with time zone,
ADD COLUMN pago_pela_empresa_by uuid;

-- Política para permitir que supervisor e cobrador atualizem apenas os campos pago_pela_empresa
CREATE POLICY "operator_contracts_supervisor_update_pago"
ON public.operator_contracts
FOR UPDATE
USING (has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "operator_contracts_cobrador_update_pago"
ON public.operator_contracts
FOR UPDATE
USING (has_role(auth.uid(), 'cobrador'::app_role));
