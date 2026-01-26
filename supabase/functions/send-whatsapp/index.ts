import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const N8N_WEBHOOK_URL = 'https://n8n.srv743366.hstgr.cloud/webhook-test/b6e0f090-6b10-4eb6-a26f-1bc9fd21ae8b';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { instance_id, phone, message, customer_id, invoice_id } = await req.json();
    console.log('Received request:', { instance_id, phone, message: message?.substring(0, 50) + '...', customer_id, invoice_id });

    // Validate required fields
    if (!instance_id || !phone || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Campos obrigatórios: instance_id, phone, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get instance from database
    const { data: instance, error: instanceError } = await supabase
      .from('instances')
      .select('*')
      .eq('instance_id', instance_id)
      .single();

    if (instanceError || !instance) {
      console.error('Instance not found:', instanceError);
      return new Response(
        JSON.stringify({ success: false, error: 'Instância não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if instance is connected
    if (instance.status !== 'connected') {
      return new Response(
        JSON.stringify({ success: false, error: 'Instância não está conectada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean phone number (remove non-digits)
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Prepare payload for n8n webhook
    const webhookPayload = {
      instance_id: instance.instance_id,
      token: instance.token,
      phone: cleanPhone,
      message: message,
    };

    console.log('Sending to n8n webhook:', { ...webhookPayload, message: webhookPayload.message.substring(0, 50) + '...' });

    // Call n8n webhook
    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    const webhookData = await webhookResponse.text();
    console.log('Webhook response status:', webhookResponse.status);
    console.log('Webhook response:', webhookData);

    if (!webhookResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro ao enviar mensagem: ${webhookResponse.status}` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to parse webhook response
    let responseData;
    try {
      responseData = JSON.parse(webhookData);
    } catch {
      responseData = { raw: webhookData };
    }

    // Register collection attempt if customer_id and invoice_id are provided
    let attemptId: string | null = null;
    if (customer_id && invoice_id) {
      console.log('Registering collection attempt...');
      const { data: attemptData, error: attemptError } = await supabase
        .from('collection_attempts')
        .insert({
          customer_id,
          invoice_id,
          collector_id: user.id,
          channel: 'whatsapp',
          status: 'sucesso',
          notes: 'Mensagem enviada automaticamente via template',
        })
        .select('id')
        .single();

      if (attemptError) {
        console.error('Error registering attempt:', attemptError);
        // Don't fail the request, just log the error
      } else {
        attemptId = attemptData?.id;
        console.log('Collection attempt registered:', attemptId);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Mensagem enviada com sucesso',
        data: responseData,
        attempt_id: attemptId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-whatsapp:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
