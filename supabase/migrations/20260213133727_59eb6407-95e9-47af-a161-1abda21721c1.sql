
ALTER TABLE public.operator_contracts
ADD COLUMN marcado_pago_by uuid,
ADD COLUMN marcado_pago_at timestamptz;
