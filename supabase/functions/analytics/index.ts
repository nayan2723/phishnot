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

interface AnalyticsRequest {
  clerk_user_id: string;
  period?: 'day' | 'week' | 'month' | 'year';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clerk_user_id, period = 'month' }: AnalyticsRequest = await req.json();

    if (!clerk_user_id) {
      return new Response(JSON.stringify({ error: 'clerk_user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get user analytics summary
    const { data: userAnalytics, error: analyticsError } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('clerk_user_id', clerk_user_id)
      .single();

    if (analyticsError && analyticsError.code !== 'PGRST116') { // Ignore "no rows" error
      console.error('Analytics query error:', analyticsError);
    }

    // Get detailed analysis history for the period
    const { data: analysisHistory, error: historyError } = await supabase
      .from('email_analyses')
      .select('*')
      .eq('clerk_user_id', clerk_user_id)
      .gte('analyzed_at', startDate.toISOString())
      .order('analyzed_at', { ascending: false });

    if (historyError) {
      console.error('History query error:', historyError);
      return new Response(JSON.stringify({ error: 'Failed to fetch analysis history' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get rate limit info
    const { data: rateLimits, error: rateLimitError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('clerk_user_id', clerk_user_id)
      .gte('window_end', now.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    // Get recent alerts
    const { data: recentAlerts, error: alertsError } = await supabase
      .from('user_alerts')
      .select('*')
      .eq('clerk_user_id', clerk_user_id)
      .gte('sent_at', startDate.toISOString())
      .order('sent_at', { ascending: false });

    // Calculate analytics for the period
    const periodAnalytics = {
      total_scans: analysisHistory?.length || 0,
      phishing_detected: analysisHistory?.filter(a => a.is_phishing).length || 0,
      safe_emails: analysisHistory?.filter(a => !a.is_phishing).length || 0,
      avg_confidence: analysisHistory?.length > 0 
        ? Math.round(analysisHistory.reduce((sum, a) => sum + (a.confidence_score || 0), 0) / analysisHistory.length)
        : 0
    };

    // Calculate daily breakdown for charts
    const dailyBreakdown = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayAnalyses = analysisHistory?.filter(a => {
        const analyzedDate = new Date(a.analyzed_at);
        return analyzedDate >= dayStart && analyzedDate < dayEnd;
      }) || [];

      dailyBreakdown.push({
        date: dayStart.toISOString().split('T')[0],
        total: dayAnalyses.length,
        phishing: dayAnalyses.filter(a => a.is_phishing).length,
        safe: dayAnalyses.filter(a => !a.is_phishing).length
      });
    }

    // Top flagged domains
    const domainCounts: { [key: string]: number } = {};
    analysisHistory?.forEach(analysis => {
      if (analysis.sender_email) {
        const domain = analysis.sender_email.split('@')[1]?.toLowerCase();
        if (domain) {
          domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        }
      }
    });

    const topDomains = Object.entries(domainCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([domain, count]) => ({ domain, count }));

    // Recent activity
    const recentActivity = analysisHistory?.slice(0, 10).map(analysis => ({
      id: analysis.id,
      date: analysis.analyzed_at,
      sender: analysis.sender_email,
      subject: analysis.subject,
      result: analysis.is_phishing ? 'phishing' : 'safe',
      confidence: analysis.confidence_score
    })) || [];

    // Calculate threat trends
    const threatTrends = {
      increasing: false,
      percentage_change: 0
    };

    if (analysisHistory && analysisHistory.length > 0) {
      const halfwayPoint = Math.floor(analysisHistory.length / 2);
      const recentHalf = analysisHistory.slice(0, halfwayPoint);
      const olderHalf = analysisHistory.slice(halfwayPoint);

      const recentPhishingRate = recentHalf.filter(a => a.is_phishing).length / recentHalf.length;
      const olderPhishingRate = olderHalf.length > 0 
        ? olderHalf.filter(a => a.is_phishing).length / olderHalf.length 
        : 0;

      if (olderPhishingRate > 0) {
        threatTrends.percentage_change = Math.round(((recentPhishingRate - olderPhishingRate) / olderPhishingRate) * 100);
        threatTrends.increasing = recentPhishingRate > olderPhishingRate;
      }
    }

    const response = {
      // Overall user statistics
      user_analytics: userAnalytics || {
        total_scans: 0,
        phishing_detected: 0,
        safe_emails: 0,
        last_scan_at: null
      },
      
      // Period-specific analytics
      period_analytics: periodAnalytics,
      
      // Charts data
      daily_breakdown: dailyBreakdown,
      
      // Additional insights
      top_domains: topDomains,
      recent_activity: recentActivity,
      threat_trends: threatTrends,
      
      // Rate limiting info
      rate_limit: rateLimits?.[0] ? {
        requests_used: rateLimits[0].requests_count,
        requests_limit: 50,
        reset_time: rateLimits[0].window_end
      } : {
        requests_used: 0,
        requests_limit: 50,
        reset_time: new Date(now.getTime() + 3600000).toISOString()
      },
      
      // Alerts
      recent_alerts: recentAlerts || [],
      
      // Metadata
      period: period,
      generated_at: now.toISOString()
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});