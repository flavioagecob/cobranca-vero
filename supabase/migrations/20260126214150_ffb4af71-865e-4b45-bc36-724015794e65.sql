-- Add SELECT policy for cobrador role on instances table
-- This allows operators to see and use connected WhatsApp instances for billing

CREATE POLICY "instances_cobrador_select" 
ON public.instances 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'cobrador'::app_role));