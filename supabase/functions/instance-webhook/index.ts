import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Webhook URLs
const WEBHOOK_CREATE_URL = 'https://n8n.srv743366.hstgr.cloud/webhook/whats-instance';
const WEBHOOK_CONNECT_URL = 'https://n8n.srv743366.hstgr.cloud/webhook/2cbcb10a-8584-4edd-b109-da71d825f14c';

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

        console.log(`[instance-webhook] Creating instance with name: ${name}`);

        // Call external webhook to create instance
        const webhookRes = await fetch(WEBHOOK_CREATE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });

        const webhookText = await webhookRes.text();
        console.log(`[instance-webhook] Create webhook response: ${webhookText}`);

        let webhookResponse;
        try {
          webhookResponse = JSON.parse(webhookText);
        } catch {
          console.error('[instance-webhook] Failed to parse webhook response');
          return new Response(
            JSON.stringify({ success: false, error: 'Resposta inválida do webhook' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!webhookResponse.instance_id || !webhookResponse.token) {
          console.error('[instance-webhook] Missing instance_id or token in response');
          return new Response(
            JSON.stringify({ success: false, error: 'Resposta do webhook incompleta' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

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

        console.log(`[instance-webhook] Instance created successfully: ${instance.id}`);

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

        console.log(`[instance-webhook] Connecting instance: ${instance_id}`);

        // Update status to connecting
        await supabase
          .from('instances')
          .update({ status: 'connecting' })
          .eq('instance_id', instance_id);

        // Call external webhook to get QR code
        const webhookRes = await fetch(WEBHOOK_CONNECT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instance_id, token }),
        });

        const webhookText = await webhookRes.text();
        console.log(`[instance-webhook] Connect webhook response length: ${webhookText.length}`);

        let webhookResponse;
        try {
          webhookResponse = JSON.parse(webhookText);
        } catch {
          console.error('[instance-webhook] Failed to parse connect webhook response');
          return new Response(
            JSON.stringify({ success: false, error: 'Resposta inválida do webhook de conexão' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if already connected
        if (webhookResponse.status === 'connected') {
          await supabase
            .from('instances')
            .update({ 
              status: 'connected',
              phone_number: webhookResponse.phone_number || null,
            })
            .eq('instance_id', instance_id);

          return new Response(
            JSON.stringify({ 
              success: true, 
              status: 'connected',
              phone_number: webhookResponse.phone_number,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            qr_code_base64: webhookResponse.qr_code_base64 || webhookResponse.qrcode || webhookResponse.qr,
          }),
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

        console.log(`[instance-webhook] Checking status for: ${instance_id}`);

        // Call the connect webhook to check status (it may return status instead of QR)
        const webhookRes = await fetch(WEBHOOK_CONNECT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instance_id, token, action: 'status' }),
        });

        const webhookText = await webhookRes.text();
        console.log(`[instance-webhook] Status webhook response: ${webhookText}`);

        let webhookResponse;
        try {
          webhookResponse = JSON.parse(webhookText);
        } catch {
          return new Response(
            JSON.stringify({ success: true, status: 'connecting' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const status = webhookResponse.status || 'connecting';
        const phoneNumber = webhookResponse.phone_number || webhookResponse.phoneNumber || null;

        // If connected, update the database
        if (status === 'connected') {
          await supabase
            .from('instances')
            .update({ 
              status: 'connected',
              phone_number: phoneNumber,
            })
            .eq('instance_id', instance_id);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            status,
            phone_number: phoneNumber,
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

        console.log(`[instance-webhook] Disconnecting instance: ${instance_id}`);

        // Call the connect webhook with disconnect action
        try {
          await fetch(WEBHOOK_CONNECT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instance_id, token, action: 'disconnect' }),
          });
        } catch (e) {
          console.error('[instance-webhook] Disconnect webhook error:', e);
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
