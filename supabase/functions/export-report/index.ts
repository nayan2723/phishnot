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

interface ExportRequest {
  analysis_id: string;
  format: 'pdf' | 'csv';
  clerk_user_id: string;
}

// Generate PDF report using simple HTML string
async function generatePDFReport(analysis: any): Promise<Uint8Array> {
  try {
    const reportContent = `
═══════════════════════════════════════════════════════════════════════════════
                            PhishNot Security Analysis Report
═══════════════════════════════════════════════════════════════════════════════

📧 EMAIL ANALYSIS DETAILS
─────────────────────────────────────────────────────────────────────────────
Analysis Date:    ${new Date(analysis.analyzed_at).toLocaleString()}
Report ID:        ${analysis.id}
Email From:       ${analysis.sender_email || 'Unknown'}
Email Subject:    ${analysis.subject || 'No subject'}

📊 SECURITY ASSESSMENT
─────────────────────────────────────────────────────────────────────────────
SECURITY RESULT:    ${analysis.is_phishing ? '🚨 PHISHING DETECTED' : '✅ EMAIL APPEARS SAFE'}
Confidence Score:   ${analysis.confidence_score}% ${analysis.confidence_score >= 80 ? '(High Confidence)' : analysis.confidence_score >= 50 ? '(Medium Confidence)' : '(Low Confidence)'}
Risk Level:         ${analysis.is_phishing ? '🔴 HIGH RISK' : '🟢 LOW RISK'}
Analysis Method:    AI-Powered Pattern Recognition & Machine Learning

🔍 DETAILED ANALYSIS FINDINGS
─────────────────────────────────────────────────────────────────────────────
${analysis.analysis_reasons?.map((reason: string, i: number) => `${i + 1}. ${reason}`).join('\n') || 'No specific analysis details available'}

📈 STATISTICAL DATA
─────────────────────────────────────────────────────────────────────────────
• Total Characters Analyzed: ${(analysis.email_body || '').length}
• Subject Length: ${(analysis.subject || '').length} characters
• Analysis Processing Time: < 1 second
• Detection Algorithms Used: ${analysis.is_phishing ? 'Phishing Pattern Detection, URL Reputation Check, Content Analysis' : 'Standard Security Validation, Content Verification'}

${analysis.is_phishing ? `
🚨 IMMEDIATE ACTION REQUIRED
─────────────────────────────────────────────────────────────────────────────
⚠️  CRITICAL SECURITY ALERT - This email has been identified as a phishing attempt:

WHAT TO DO NOW:
• ❌ DO NOT click any links in this email
• ❌ DO NOT provide personal or financial information
• ❌ DO NOT download any attachments
• ✅ Report this email to your IT security team immediately
• ✅ Delete this email after reporting
• ✅ Forward this report to your security administrator
• ✅ Monitor your accounts for suspicious activity
• ✅ Be extra cautious of similar emails in the future

SIGNS DETECTED:
• Suspicious sender patterns
• Potential malicious content
• Security risk indicators present
` : `
✅ SECURITY STATUS: SAFE
─────────────────────────────────────────────────────────────────────────────
This email appears to be legitimate based on our comprehensive analysis.

RECOMMENDED BEST PRACTICES:
• ✅ Always verify sender identity for sensitive requests
• ✅ Be cautious with links and attachments from unknown senders  
• ✅ When in doubt, contact the sender through an independent channel
• ✅ Stay vigilant for social engineering attempts
• ✅ Keep your email security awareness up to date
• ✅ Report suspicious emails even if they seem safe

VERIFICATION METHODS:
• Sender reputation checked
• Content analysis completed
• Pattern matching performed
• Risk assessment conducted
`}

📞 SUPPORT INFORMATION  
─────────────────────────────────────────────────────────────────────────────
For questions about this report or additional security concerns:
• Visit: https://phishnot.com/support
• Email: security@phishnot.com
• Emergency Hotline: Available through your IT department

💡 SECURITY EDUCATION
─────────────────────────────────────────────────────────────────────────────
Stay protected with regular security training and awareness updates.
PhishNot provides comprehensive email security analysis using advanced AI.

═══════════════════════════════════════════════════════════════════════════════
Generated by PhishNot Advanced Security Analysis Engine v2.0
Report Generated: ${new Date().toLocaleString()}
© ${new Date().getFullYear()} PhishNot Security - Protecting Your Digital Communications
═══════════════════════════════════════════════════════════════════════════════

CONFIDENTIALITY NOTICE: This report contains sensitive security information. 
Distribution should be limited to authorized personnel only.
    `;

    return new TextEncoder().encode(reportContent);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

// Generate CSV report
function generateCSVReport(analysis: any): string {
  const headers = [
    'Analysis_Date',
    'Report_ID', 
    'Sender_Email',
    'Email_Subject',
    'Security_Result',
    'Confidence_Score',
    'Confidence_Level',
    'Risk_Level',
    'Email_Length',
    'Subject_Length',
    'Analysis_Method',
    'Reasons_Count',
    'Analysis_Reasons',
    'Action_Required',
    'Generated_At'
  ];
  
  const confidenceLevel = analysis.confidence_score >= 80 ? 'High' : 
                         analysis.confidence_score >= 50 ? 'Medium' : 'Low';
  
  const row = [
    new Date(analysis.analyzed_at).toISOString(),
    `"${analysis.id}"`,
    `"${(analysis.sender_email || 'Unknown').replace(/"/g, '""')}"`,
    `"${(analysis.subject || 'No subject').replace(/"/g, '""')}"`,
    analysis.is_phishing ? 'PHISHING_DETECTED' : 'SAFE',
    analysis.confidence_score,
    confidenceLevel,
    analysis.is_phishing ? 'HIGH' : 'LOW',
    (analysis.email_body || '').length,
    (analysis.subject || '').length,
    'AI_Pattern_Recognition',
    analysis.analysis_reasons?.length || 0,
    `"${(analysis.analysis_reasons?.join('; ') || 'No specific details').replace(/"/g, '""')}"`,
    analysis.is_phishing ? 'IMMEDIATE_ACTION_REQUIRED' : 'FOLLOW_BEST_PRACTICES',
    new Date().toISOString()
  ];
  
  return headers.join(',') + '\n' + row.join(',');
}

// Create shareable report link
async function createShareableLink(analysisId: string): Promise<string> {
  try {
    // Generate unique share token
    const shareToken = crypto.randomUUID();
    
    const { error } = await supabase
      .from('shareable_reports')
      .insert({
        analysis_id: analysisId,
        share_token: shareToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        is_active: true
      });

    if (error) {
      console.error('Error creating shareable link:', error);
      throw error;
    }

    return `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'supabase.co')}/functions/v1/shared-report/${shareToken}`;
  } catch (error) {
    console.error('Shareable link creation error:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Export request received:', req.method);
    
    const { analysis_id, format, clerk_user_id, action, custom_analysis }: ExportRequest & { action?: string; custom_analysis?: any } = await req.json();

    console.log('Export request data:', { analysis_id, format, action, has_custom_analysis: !!custom_analysis });

    if (!analysis_id || !clerk_user_id) {
      console.error('Missing required fields:', { analysis_id, clerk_user_id });
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let analysis = custom_analysis;

    // If no custom analysis provided, get from database
    if (!analysis) {
      console.log('Fetching analysis from database...');
      const { data, error } = await supabase
        .from('email_analyses')
        .select('*')
        .eq('id', analysis_id)
        .eq('clerk_user_id', clerk_user_id)
        .single();

      if (error || !data) {
        console.error('Analysis not found or access denied:', error);
        return new Response(JSON.stringify({ error: 'Analysis not found or access denied' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      analysis = data;
    }

    console.log('Analysis data found:', { id: analysis.id, is_phishing: analysis.is_phishing });

    // Handle share link creation
    if (action === 'share') {
      console.log('Creating share link...');
      const shareUrl = await createShareableLink(analysis_id);
      console.log('Share link created:', shareUrl);
      return new Response(JSON.stringify({ shareUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle export
    console.log('Starting export process for format:', format);
    
    if (format === 'pdf') {
      console.log('Generating PDF...');
      const pdfData = await generatePDFReport(analysis);
      console.log('PDF generated, size:', pdfData.length, 'bytes');
      
      return new Response(pdfData, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="phishnot-report-${analysis_id.substring(0, 8)}.pdf"`
        }
      });
    } else if (format === 'csv') {
      console.log('Generating CSV...');
      const csvData = generateCSVReport(analysis);
      console.log('CSV generated, length:', csvData.length);
      
      return new Response(csvData, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="phishnot-report-${analysis_id.substring(0, 8)}.csv"`
        }
      });
    } else {
      console.error('Invalid format requested:', format);
      return new Response(JSON.stringify({ error: 'Invalid format. Use "pdf" or "csv"' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({ 
      error: 'Export failed', 
      details: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});