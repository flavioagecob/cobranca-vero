-- Create instances table for WhatsApp instance management
CREATE TABLE public.instances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id TEXT NOT NULL UNIQUE,
    token TEXT NOT NULL,
    name TEXT NOT NULL,
    phone_number TEXT,
    status TEXT DEFAULT 'disconnected',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_instances_updated_at
    BEFORE UPDATE ON public.instances
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Enable Row Level Security
ALTER TABLE public.instances ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage, supervisors can view
CREATE POLICY "instances_admin_all" ON public.instances
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "instances_supervisor_select" ON public.instances
    FOR SELECT
    USING (has_role(auth.uid(), 'supervisor'::app_role));