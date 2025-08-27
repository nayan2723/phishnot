import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      'https://jpxnekifttziwkiiptlv.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweG5la2lmdHR6aXdraWlwdGx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDk0NDgsImV4cCI6MjA3MTQyNTQ0OH0.WDLMYC66wqJC_FSXuLzoIXb2WiPzM9Vo0hmYBaULDIY'
    );

    if (req.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    // Get clerk_user_id from query parameters
    const url = new URL(req.url);
    const clerkUserId = url.searchParams.get('clerk_user_id');

    if (!clerkUserId) {
      return new Response(
        JSON.stringify({ error: 'clerk_user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's analysis history
    const { data: analyses, error } = await supabase
      .from('email_analyses')
      .select(`
        id,
        sender_email,
        subject,
        email_body,
        is_phishing,
        confidence_score,
        analysis_reasons,
        analyzed_at,
        uploaded_files (
          filename,
          file_type,
          file_size
        )
      `)
      .eq('clerk_user_id', clerkUserId)
      .order('analyzed_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Database query error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch history' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform data for frontend
    const transformedAnalyses = analyses?.map(analysis => ({
      id: analysis.id,
      sender: analysis.sender_email || 'Unknown',
      subject: analysis.subject || 'No subject',
      emailBody: analysis.email_body || '',
      isPhishing: analysis.is_phishing,
      confidence: (analysis.confidence_score || 0) / 100,
      reasons: analysis.analysis_reasons || [],
      analyzedAt: analysis.analyzed_at,
      uploadedFile: analysis.uploaded_files ? {
        filename: analysis.uploaded_files.filename,
        fileType: analysis.uploaded_files.file_type,
        fileSize: analysis.uploaded_files.file_size
      } : null
    })) || [];

    // Get statistics
    const totalAnalyses = transformedAnalyses.length;
    const phishingDetected = transformedAnalyses.filter(a => a.isPhishing).length;
    const safeEmails = totalAnalyses - phishingDetected;
    const averageConfidence = totalAnalyses > 0 
      ? transformedAnalyses.reduce((sum, a) => sum + a.confidence, 0) / totalAnalyses 
      : 0;

    const response = {
      analyses: transformedAnalyses,
      statistics: {
        total: totalAnalyses,
        phishing: phishingDetected,
        safe: safeEmails,
        averageConfidence: Math.round(averageConfidence * 100) / 100
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('History error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});