import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TODO: Configure these webhook URLs
const WEBHOOK_BASE_URL = Deno.env.get('INSTANCE_WEBHOOK_URL') || '';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, name, instance_id, token } = body;

    console.log(`[instance-webhook] Action: ${action}, User: ${user.id}`);

    switch (action) {
      case 'create': {
        if (!name) {
          return new Response(
            JSON.stringify({ success: false, error: 'Nome é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Call external webhook to create instance
        // For now, we'll simulate the response
        // TODO: Replace with actual webhook call when URL is provided
        const webhookResponse = WEBHOOK_BASE_URL
          ? await fetch(`${WEBHOOK_BASE_URL}/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name }),
            }).then(r => r.json())
          : {
              instance_id: `inst_${crypto.randomUUID().slice(0, 8)}`,
              token: crypto.randomUUID(),
            };

        // Save to database
        const { data: instance, error: insertError } = await supabase
          .from('instances')
          .insert({
            instance_id: webhookResponse.instance_id,
            token: webhookResponse.token,
            name,
            status: 'disconnected',
            created_by: user.id,
          })
          .select()
          .single();

        if (insertError) {
          console.error('[instance-webhook] Insert error:', insertError);
          return new Response(
            JSON.stringify({ success: false, error: 'Erro ao salvar instância' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, instance }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'connect': {
        if (!instance_id || !token) {
          return new Response(
            JSON.stringify({ success: false, error: 'Instance ID e token são obrigatórios' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update status to connecting
        await supabase
          .from('instances')
          .update({ status: 'connecting' })
          .eq('instance_id', instance_id);

        // Call external webhook to get QR code
        // TODO: Replace with actual webhook call when URL is provided
        const webhookResponse = WEBHOOK_BASE_URL
          ? await fetch(`${WEBHOOK_BASE_URL}/connect`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ instance_id, token }),
            }).then(r => r.json())
          : {
              // Placeholder QR code (a simple black square encoded as base64)
              qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            };

        return new Response(
          JSON.stringify({ success: true, qr_code_base64: webhookResponse.qr_code_base64 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'status': {
        if (!instance_id || !token) {
          return new Response(
            JSON.stringify({ success: false, error: 'Instance ID e token são obrigatórios' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Call external webhook to check status
        // TODO: Replace with actual webhook call when URL is provided
        const webhookResponse = WEBHOOK_BASE_URL
          ? await fetch(`${WEBHOOK_BASE_URL}/status?instance_id=${instance_id}&token=${token}`, {
              method: 'GET',
            }).then(r => r.json())
          : {
              status: 'connecting', // Simulated - would be 'connected' with phone_number when connected
              phone_number: null,
            };

        // If connected, update the database
        if (webhookResponse.status === 'connected') {
          await supabase
            .from('instances')
            .update({ 
              status: 'connected',
              phone_number: webhookResponse.phone_number,
            })
            .eq('instance_id', instance_id);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            status: webhookResponse.status,
            phone_number: webhookResponse.phone_number,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'disconnect': {
        if (!instance_id || !token) {
          return new Response(
            JSON.stringify({ success: false, error: 'Instance ID e token são obrigatórios' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Call external webhook to disconnect
        // TODO: Replace with actual webhook call when URL is provided
        if (WEBHOOK_BASE_URL) {
          await fetch(`${WEBHOOK_BASE_URL}/disconnect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instance_id, token }),
          });
        }

        // Update database
        await supabase
          .from('instances')
          .update({ 
            status: 'disconnected',
            phone_number: null,
          })
          .eq('instance_id', instance_id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Ação inválida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[instance-webhook] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
