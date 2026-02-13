
-- Add UPDATE and DELETE policies for cobrador on collection_attempts
CREATE POLICY "collection_attempts_cobrador_update"
  ON public.collection_attempts FOR UPDATE
  USING (has_role(auth.uid(), 'cobrador'::app_role) AND collector_id = auth.uid());

CREATE POLICY "collection_attempts_cobrador_delete"
  ON public.collection_attempts FOR DELETE
  USING (has_role(auth.uid(), 'cobrador'::app_role) AND collector_id = auth.uid());

-- Add DELETE policies for cobrador on payment_promises
CREATE POLICY "payment_promises_cobrador_delete"
  ON public.payment_promises FOR DELETE
  USING (has_role(auth.uid(), 'cobrador'::app_role) AND collector_id = auth.uid());

-- Add UPDATE policy for cobrador on payment_promises (own records only)
CREATE POLICY "payment_promises_cobrador_update"
  ON public.payment_promises FOR UPDATE
  USING (has_role(auth.uid(), 'cobrador'::app_role) AND collector_id = auth.uid());
