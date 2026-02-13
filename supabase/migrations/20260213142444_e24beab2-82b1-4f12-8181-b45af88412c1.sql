
-- =============================================
-- FIX: collection_attempts RLS policies
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE
-- =============================================

DROP POLICY IF EXISTS "Users can insert attempts" ON public.collection_attempts;
DROP POLICY IF EXISTS "Users can view attempts" ON public.collection_attempts;
DROP POLICY IF EXISTS "collection_attempts_admin_all" ON public.collection_attempts;
DROP POLICY IF EXISTS "collection_attempts_cobrador_delete" ON public.collection_attempts;
DROP POLICY IF EXISTS "collection_attempts_cobrador_insert" ON public.collection_attempts;
DROP POLICY IF EXISTS "collection_attempts_cobrador_select" ON public.collection_attempts;
DROP POLICY IF EXISTS "collection_attempts_cobrador_update" ON public.collection_attempts;
DROP POLICY IF EXISTS "collection_attempts_supervisor_all" ON public.collection_attempts;

-- Admin: full access
CREATE POLICY "collection_attempts_admin_all"
ON public.collection_attempts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Supervisor: full access
CREATE POLICY "collection_attempts_supervisor_all"
ON public.collection_attempts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'supervisor'))
WITH CHECK (public.has_role(auth.uid(), 'supervisor'));

-- Cobrador: SELECT all attempts
CREATE POLICY "collection_attempts_cobrador_select"
ON public.collection_attempts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'cobrador'));

-- Cobrador: INSERT own attempts
CREATE POLICY "collection_attempts_cobrador_insert"
ON public.collection_attempts FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'cobrador') AND collector_id = auth.uid());

-- Cobrador: UPDATE own attempts
CREATE POLICY "collection_attempts_cobrador_update"
ON public.collection_attempts FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'cobrador') AND collector_id = auth.uid())
WITH CHECK (public.has_role(auth.uid(), 'cobrador') AND collector_id = auth.uid());

-- Cobrador: DELETE own attempts
CREATE POLICY "collection_attempts_cobrador_delete"
ON public.collection_attempts FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'cobrador') AND collector_id = auth.uid());

-- =============================================
-- FIX: payment_promises RLS policies
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE
-- =============================================

DROP POLICY IF EXISTS "Users can manage promises" ON public.payment_promises;
DROP POLICY IF EXISTS "Users can view promises" ON public.payment_promises;
DROP POLICY IF EXISTS "payment_promises_admin_all" ON public.payment_promises;
DROP POLICY IF EXISTS "payment_promises_cobrador_delete" ON public.payment_promises;
DROP POLICY IF EXISTS "payment_promises_cobrador_insert" ON public.payment_promises;
DROP POLICY IF EXISTS "payment_promises_cobrador_select" ON public.payment_promises;
DROP POLICY IF EXISTS "payment_promises_cobrador_update" ON public.payment_promises;
DROP POLICY IF EXISTS "payment_promises_supervisor_all" ON public.payment_promises;

-- Admin: full access
CREATE POLICY "payment_promises_admin_all"
ON public.payment_promises FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Supervisor: full access
CREATE POLICY "payment_promises_supervisor_all"
ON public.payment_promises FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'supervisor'))
WITH CHECK (public.has_role(auth.uid(), 'supervisor'));

-- Cobrador: SELECT all promises
CREATE POLICY "payment_promises_cobrador_select"
ON public.payment_promises FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'cobrador'));

-- Cobrador: INSERT own promises
CREATE POLICY "payment_promises_cobrador_insert"
ON public.payment_promises FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'cobrador') AND collector_id = auth.uid());

-- Cobrador: UPDATE own promises
CREATE POLICY "payment_promises_cobrador_update"
ON public.payment_promises FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'cobrador') AND collector_id = auth.uid())
WITH CHECK (public.has_role(auth.uid(), 'cobrador') AND collector_id = auth.uid());

-- Cobrador: DELETE own promises
CREATE POLICY "payment_promises_cobrador_delete"
ON public.payment_promises FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'cobrador') AND collector_id = auth.uid());
