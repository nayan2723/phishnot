import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface NotificationRequest {
  clerk_user_id: string;
  action: 'get' | 'mark_read' | 'mark_all_read' | 'delete';
  alert_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clerk_user_id, action, alert_id }: NotificationRequest = await req.json();

    if (!clerk_user_id) {
      return new Response(JSON.stringify({ error: 'clerk_user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    switch (action) {
      case 'get': {
        const { data: alerts, error } = await supabase
          .from('user_alerts')
          .select('*')
          .eq('clerk_user_id', clerk_user_id)
          .order('sent_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        const unreadCount = alerts?.filter(alert => !alert.read_at).length || 0;

        return new Response(JSON.stringify({ 
          alerts: alerts || [],
          unread_count: unreadCount
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'mark_read': {
        if (!alert_id) {
          return new Response(JSON.stringify({ error: 'alert_id is required for mark_read' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { error } = await supabase
          .from('user_alerts')
          .update({ read_at: new Date().toISOString() })
          .eq('id', alert_id)
          .eq('clerk_user_id', clerk_user_id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'mark_all_read': {
        const { error } = await supabase
          .from('user_alerts')
          .update({ read_at: new Date().toISOString() })
          .eq('clerk_user_id', clerk_user_id)
          .is('read_at', null);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'delete': {
        if (!alert_id) {
          return new Response(JSON.stringify({ error: 'alert_id is required for delete' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { error } = await supabase
          .from('user_alerts')
          .delete()
          .eq('id', alert_id)
          .eq('clerk_user_id', clerk_user_id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('Notifications error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});