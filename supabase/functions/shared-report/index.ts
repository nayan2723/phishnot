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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shareToken = url.pathname.split('/').pop();

    if (!shareToken) {
      return new Response('Invalid share link', { status: 400, headers: corsHeaders });
    }

    // Get shared report data
    const { data: sharedReport, error: shareError } = await supabase
      .from('shareable_reports')
      .select(`
        analysis_id,
        expires_at,
        is_active,
        email_analyses (
          sender_email,
          subject,
          is_phishing,
          confidence_score,
          analysis_reasons,
          analyzed_at
        )
      `)
      .eq('share_token', shareToken)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (shareError || !sharedReport) {
      return new Response(generateErrorPage('Report not found or expired'), {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      });
    }

    const analysis = sharedReport.email_analyses;
    const htmlReport = generateSharedReportHTML(analysis, shareToken);

    return new Response(htmlReport, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Shared report error:', error);
    return new Response(generateErrorPage('Internal server error'), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/html' }
    });
  }
});

function generateSharedReportHTML(analysis: any, shareToken: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PhishNot Security Report - Shared Analysis</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: #333;
            }
            .container { 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px;
            }
            .header { 
                text-align: center; 
                color: white; 
                margin-bottom: 30px;
            }
            .logo { 
                font-size: 2.5rem; 
                font-weight: bold; 
                margin-bottom: 10px;
            }
            .card {
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
                margin-bottom: 20px;
            }
            .card-header {
                padding: 30px;
                text-align: center;
                border-bottom: 1px solid #f0f0f0;
            }
            .result-badge {
                display: inline-block;
                padding: 12px 24px;
                border-radius: 50px;
                font-weight: bold;
                font-size: 1.1rem;
                margin-bottom: 15px;
            }
            .safe { background: #d1fae5; color: #065f46; }
            .phishing { background: #fee2e2; color: #991b1b; }
            .confidence {
                font-size: 2rem;
                font-weight: bold;
                color: #4f46e5;
                margin-bottom: 10px;
            }
            .card-content {
                padding: 30px;
            }
            .section {
                margin-bottom: 25px;
            }
            .section-title {
                font-size: 1.2rem;
                font-weight: 600;
                color: #374151;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .email-info {
                background: #f8fafc;
                border-radius: 12px;
                padding: 20px;
                border-left: 4px solid #4f46e5;
            }
            .info-row {
                display: flex;
                margin-bottom: 10px;
            }
            .info-label {
                font-weight: 600;
                min-width: 100px;
                color: #6b7280;
            }
            .info-value {
                color: #374151;
                word-break: break-all;
            }
            .reasons {
                background: ${analysis.is_phishing ? '#fef2f2' : '#f0fdf4'};
                border-radius: 12px;
                padding: 20px;
                border-left: 4px solid ${analysis.is_phishing ? '#ef4444' : '#22c55e'};
            }
            .reason-item {
                margin: 8px 0;
                padding-left: 20px;
                position: relative;
            }
            .reason-item:before {
                content: "•";
                position: absolute;
                left: 0;
                color: ${analysis.is_phishing ? '#ef4444' : '#22c55e'};
                font-weight: bold;
            }
            .footer {
                text-align: center;
                color: white;
                margin-top: 30px;
                font-size: 0.9rem;
            }
            .warning {
                background: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 12px;
                padding: 15px;
                margin: 20px 0;
                color: #92400e;
            }
            .recommendations {
                background: #eff6ff;
                border-radius: 12px;
                padding: 20px;
                border-left: 4px solid #3b82f6;
            }
            .rec-item {
                margin: 8px 0;
                padding-left: 20px;
                position: relative;
            }
            .rec-item:before {
                content: "✓";
                position: absolute;
                left: 0;
                color: #22c55e;
                font-weight: bold;
            }
            @media (max-width: 768px) {
                .container { padding: 10px; }
                .card-header, .card-content { padding: 20px; }
                .confidence { font-size: 1.5rem; }
                .logo { font-size: 2rem; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔒 PhishNot</div>
                <p>Shared Email Security Analysis Report</p>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="result-badge ${analysis.is_phishing ? 'phishing' : 'safe'}">
                        ${analysis.is_phishing ? '🚨 PHISHING DETECTED' : '✅ EMAIL APPEARS SAFE'}
                    </div>
                    <div class="confidence">${analysis.confidence_score}% Confidence</div>
                    <p>Analysis completed on ${new Date(analysis.analyzed_at).toLocaleDateString()}</p>
                </div>

                <div class="card-content">
                    <div class="section">
                        <div class="section-title">
                            📧 Email Information
                        </div>
                        <div class="email-info">
                            <div class="info-row">
                                <div class="info-label">From:</div>
                                <div class="info-value">${analysis.sender_email || 'Unknown'}</div>
                            </div>
                            <div class="info-row">
                                <div class="info-label">Subject:</div>
                                <div class="info-value">${analysis.subject || 'No subject'}</div>
                            </div>
                            <div class="info-row">
                                <div class="info-label">Analyzed:</div>
                                <div class="info-value">${new Date(analysis.analyzed_at).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    ${analysis.analysis_reasons && analysis.analysis_reasons.length > 0 ? `
                    <div class="section">
                        <div class="section-title">
                            🔍 Analysis Results
                        </div>
                        <div class="reasons">
                            ${analysis.analysis_reasons.map((reason: string) => 
                                `<div class="reason-item">${reason}</div>`
                            ).join('')}
                        </div>
                    </div>
                    ` : ''}

                    ${analysis.is_phishing ? `
                    <div class="warning">
                        <strong>⚠️ Security Warning:</strong> This email has been identified as a phishing attempt. 
                        Do not click any links, download attachments, or provide personal information.
                    </div>
                    ` : ''}

                    <div class="section">
                        <div class="section-title">
                            🛡️ Security Recommendations
                        </div>
                        <div class="recommendations">
                            ${analysis.is_phishing ? `
                                <div class="rec-item">Do not click any links in this email</div>
                                <div class="rec-item">Do not provide personal or financial information</div>
                                <div class="rec-item">Report this email to your IT department</div>
                                <div class="rec-item">Delete the email after reporting</div>
                                <div class="rec-item">Be cautious of similar emails in the future</div>
                            ` : `
                                <div class="rec-item">This email appears legitimate based on our analysis</div>
                                <div class="rec-item">Always verify sender identity for sensitive requests</div>
                                <div class="rec-item">Be cautious with links from unknown senders</div>
                                <div class="rec-item">When in doubt, contact sender through independent channel</div>
                            `}
                        </div>
                    </div>
                </div>
            </div>

            <div class="footer">
                <p>This report was generated by PhishNot Advanced Email Security Analysis</p>
                <p>Share Token: ${shareToken}</p>
                <p>© ${new Date().getFullYear()} PhishNot Security. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateErrorPage(message: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PhishNot - Error</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
            }
            .error-card {
                background: white;
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 400px;
            }
            .error-icon { font-size: 4rem; margin-bottom: 20px; }
            h1 { color: #ef4444; margin-bottom: 20px; }
            p { color: #6b7280; }
        </style>
    </head>
    <body>
        <div class="error-card">
            <div class="error-icon">🔒</div>
            <h1>PhishNot</h1>
            <p>${message}</p>
        </div>
    </body>
    </html>
  `;
}