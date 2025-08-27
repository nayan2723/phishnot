import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DetectionRequest {
  email_text: string;
  sender?: string;
  subject?: string;
  links?: string[];
  clerk_user_id?: string;
}

interface DetectionResult {
  result: 'phishing' | 'safe';
  confidence: number;
  reasons: string[];
  risk_level: 'low' | 'medium' | 'high';
  detected_patterns: string[];
}

// Rule-based detection engine
function ruleBasedDetection(email_text: string, sender?: string, subject?: string, links?: string[]): {
  score: number;
  reasons: string[];
  patterns: string[];
} {
  let score = 0;
  const reasons: string[] = [];
  const patterns: string[] = [];

  // Suspicious domain patterns
  const suspiciousDomains = [
    /secure[_-]?verify[_-]?login/i,
    /account[_-]?update[_-]?security/i,
    /paypal[_-]?secure/i,
    /amazon[_-]?security/i,
    /apple[_-]?id[_-]?verify/i,
    /microsoft[_-]?security/i,
    /google[_-]?verify/i,
    /facebook[_-]?security/i
  ];

  // Check domains in links
  if (links && links.length > 0) {
    for (const link of links) {
      for (const pattern of suspiciousDomains) {
        if (pattern.test(link)) {
          score += 0.3;
          reasons.push(`Suspicious domain detected: ${link}`);
          patterns.push('suspicious_domain');
          break;
        }
      }

      // Check for URL shorteners (often used in phishing)
      if (/bit\.ly|tinyurl|t\.co|goo\.gl|short\.link/i.test(link)) {
        score += 0.15;
        reasons.push('URL shortener detected');
        patterns.push('url_shortener');
      }

      // Check for IP addresses instead of domains
      if (/https?:\/\/\d+\.\d+\.\d+\.\d+/i.test(link)) {
        score += 0.25;
        reasons.push('Direct IP address in link');
        patterns.push('ip_address_link');
      }
    }
  }

  // Urgency and pressure tactics
  const urgencyPatterns = [
    /urgent[ly]?/i,
    /immediate[ly]?/i,
    /act now/i,
    /limited time/i,
    /expire[sd]? (today|soon|within)/i,
    /verify (now|immediately|within)/i,
    /suspend[ed]? account/i,
    /unusual activity/i,
    /security alert/i,
    /confirm (identity|account)/i
  ];

  const fullText = `${email_text} ${subject || ''} ${sender || ''}`;
  for (const pattern of urgencyPatterns) {
    if (pattern.test(fullText)) {
      score += 0.2;
      reasons.push(`Urgency language detected: "${pattern.source}"`);
      patterns.push('urgency_language');
      break;
    }
  }

  // Check for credential requests
  const credentialPatterns = [
    /enter.{0,20}(password|username|ssn|social security)/i,
    /update.{0,20}(payment|billing|card)/i,
    /verify.{0,20}(identity|account|information)/i,
    /confirm.{0,20}(details|information)/i
  ];

  for (const pattern of credentialPatterns) {
    if (pattern.test(fullText)) {
      score += 0.25;
      reasons.push('Credential harvesting attempt detected');
      patterns.push('credential_harvesting');
      break;
    }
  }

  // Check sender spoofing indicators
  if (sender) {
    const trustedDomains = ['@amazon.com', '@paypal.com', '@apple.com', '@microsoft.com', '@google.com'];
    const senderLower = sender.toLowerCase();
    
    for (const domain of trustedDomains) {
      if (senderLower.includes(domain.substring(1)) && !senderLower.endsWith(domain)) {
        score += 0.4;
        reasons.push(`Potential domain spoofing: ${sender}`);
        patterns.push('domain_spoofing');
        break;
      }
    }
  }

  // Check for poor grammar/spelling (simplified check)
  const grammarIssues = /\b(recieve|occured|seperate|loose|there|your|its)\b/gi.exec(fullText);
  if (grammarIssues && grammarIssues.length > 2) {
    score += 0.1;
    reasons.push('Multiple grammar/spelling errors detected');
    patterns.push('grammar_issues');
  }

  return { score: Math.min(score, 1), reasons, patterns };
}

// Enhanced ML analysis using OpenAI
async function mlAnalysis(email_text: string, sender?: string, subject?: string): Promise<{
  score: number;
  reasons: string[];
  patterns: string[];
}> {
  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.log('OpenAI API key not found, skipping ML analysis');
      return { score: 0, reasons: [], patterns: [] };
    }

    const fullText = `Subject: ${subject || 'No subject'}
Sender: ${sender || 'Unknown sender'}
Content: ${email_text}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a cybersecurity expert specializing in phishing detection. Analyze the email and return a JSON response with:
            - "score": float between 0-1 (0=safe, 1=definitely phishing)
            - "reasons": array of specific reasons why this might be phishing
            - "patterns": array of detected attack patterns (e.g., "social_engineering", "credential_theft", "impersonation", "malware_delivery")
            
            Be precise and focus on concrete indicators like suspicious language, impersonation attempts, social engineering tactics, and credential harvesting.`
          },
          {
            role: 'user',
            content: fullText
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      return { score: 0, reasons: [], patterns: [] };
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Try to parse JSON response
    try {
      const analysis = JSON.parse(content);
      return {
        score: Math.max(0, Math.min(1, analysis.score || 0)),
        reasons: Array.isArray(analysis.reasons) ? analysis.reasons : [],
        patterns: Array.isArray(analysis.patterns) ? analysis.patterns : []
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      // Fallback: extract score and basic analysis
      const scoreMatch = content.match(/score[":]\s*([0-9.]+)/i);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0.5;
      return {
        score: Math.max(0, Math.min(1, score)),
        reasons: ['AI analysis detected potential phishing indicators'],
        patterns: ['ai_detected']
      };
    }
  } catch (error) {
    console.error('ML analysis error:', error);
    return { score: 0, reasons: [], patterns: [] };
  }
}

// Combine rule-based and ML results
function combineResults(ruleResult: any, mlResult: any): DetectionResult {
  // Weighted combination: 40% rule-based, 60% ML
  const combinedScore = (ruleResult.score * 0.4) + (mlResult.score * 0.6);
  
  // Determine final result
  const isPhishing = combinedScore > 0.5;
  const confidence = isPhishing ? combinedScore : (1 - combinedScore);
  
  // Determine risk level
  let risk_level: 'low' | 'medium' | 'high';
  if (combinedScore < 0.3) risk_level = 'low';
  else if (combinedScore < 0.7) risk_level = 'medium';
  else risk_level = 'high';
  
  // Combine reasons and patterns
  const allReasons = [...ruleResult.reasons, ...mlResult.reasons];
  const allPatterns = [...ruleResult.patterns, ...mlResult.patterns];
  
  return {
    result: isPhishing ? 'phishing' : 'safe',
    confidence: Math.round(confidence * 100) / 100,
    reasons: allReasons,
    risk_level,
    detected_patterns: [...new Set(allPatterns)] // Remove duplicates
  };
}

// Save analysis to database
async function saveAnalysis(
  supabase: any,
  clerkUserId: string,
  request: DetectionRequest,
  result: DetectionResult
) {
  try {
    const { error } = await supabase
      .from('email_analyses')
      .insert({
        clerk_user_id: clerkUserId,
        sender_email: request.sender,
        subject: request.subject,
        email_body: request.email_text,
        is_phishing: result.result === 'phishing',
        confidence_score: Math.round(result.confidence * 100),
        analysis_reasons: result.reasons
      });

    if (error) {
      console.error('Database save error:', error);
    }
  } catch (error) {
    console.error('Save analysis error:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      'https://jpxnekifttziwkiiptlv.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweG5la2lmdHR6aXdraWlwdGx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDk0NDgsImV4cCI6MjA3MTQyNTQ0OH0.WDLMYC66wqJC_FSXuLzoIXb2WiPzM9Vo0hmYBaULDIY'
    );

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const requestData: DetectionRequest = await req.json();
    
    if (!requestData.email_text) {
      return new Response(
        JSON.stringify({ error: 'email_text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting phishing detection analysis...');

    // Run rule-based and ML analysis in parallel
    const [ruleResult, mlResult] = await Promise.all([
      Promise.resolve(ruleBasedDetection(
        requestData.email_text,
        requestData.sender,
        requestData.subject,
        requestData.links
      )),
      mlAnalysis(requestData.email_text, requestData.sender, requestData.subject)
    ]);

    console.log('Rule-based score:', ruleResult.score);
    console.log('ML score:', mlResult.score);

    // Combine results
    const finalResult = combineResults(ruleResult, mlResult);

    console.log('Final result:', finalResult.result, 'Confidence:', finalResult.confidence);

    // Save to database if user is authenticated
    if (requestData.clerk_user_id) {
      await saveAnalysis(supabase, requestData.clerk_user_id, requestData, finalResult);
    }

    return new Response(JSON.stringify(finalResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Detection error:', error);
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