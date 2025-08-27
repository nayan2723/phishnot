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

// Enhanced AI analysis using Google Gemini for content analysis
async function geminiAnalysis(email_text: string, sender?: string, subject?: string): Promise<{
  score: number;
  reasons: string[];
  patterns: string[];
}> {
  try {
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.log('Google Gemini API key not found, skipping Gemini analysis');
      return { score: 0, reasons: [], patterns: [] };
    }

    const fullText = `Subject: ${subject || 'No subject'}
Sender: ${sender || 'Unknown sender'}
Content: ${email_text}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a cybersecurity expert specializing in phishing detection. Analyze this email for phishing indicators and respond ONLY with valid JSON in this exact format:
{
  "score": <float between 0-1, where 0=safe and 1=definitely phishing>,
  "reasons": [<array of specific reasons why this might be phishing>],
  "patterns": [<array of detected attack patterns like "social_engineering", "credential_theft", "impersonation", "malware_delivery", "urgency_tactics", "brand_spoofing">]
}

Email to analyze:
${fullText}`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500
        }
      }),
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status, await response.text());
      return { score: 0, reasons: [], patterns: [] };
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      console.error('No content in Gemini response');
      return { score: 0, reasons: [], patterns: [] };
    }
    
    // Try to parse JSON response
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const analysis = JSON.parse(cleanContent);
      return {
        score: Math.max(0, Math.min(1, analysis.score || 0)),
        reasons: Array.isArray(analysis.reasons) ? analysis.reasons : [],
        patterns: Array.isArray(analysis.patterns) ? analysis.patterns : []
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', content);
      // Fallback: extract score and basic analysis
      const scoreMatch = content.match(/["']?score["']?\s*:\s*([0-9.]+)/i);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0.5;
      return {
        score: Math.max(0, Math.min(1, score)),
        reasons: ['Gemini AI detected potential phishing indicators'],
        patterns: ['ai_detected']
      };
    }
  } catch (error) {
    console.error('Gemini analysis error:', error);
    return { score: 0, reasons: [], patterns: [] };
  }
}

// Perplexity analysis for real-time threat intelligence
async function perplexityAnalysis(email_text: string, sender?: string, subject?: string): Promise<{
  score: number;
  reasons: string[];
  patterns: string[];
}> {
  try {
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      console.log('Perplexity API key not found, skipping Perplexity analysis');
      return { score: 0, reasons: [], patterns: [] };
    }

    const fullText = `Subject: ${subject || 'No subject'}
Sender: ${sender || 'Unknown sender'}
Content: ${email_text}`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: `You are a cybersecurity expert with access to current threat intelligence. Analyze this email for phishing indicators using the latest known attack patterns and respond with JSON:
{
  "score": <float 0-1, where 0=safe, 1=phishing>,
  "reasons": [<specific reasons for classification>],
  "patterns": [<attack patterns detected>]
}

Focus on current phishing campaigns, known malicious domains, and recent attack vectors.`
          },
          {
            role: 'user',
            content: `Analyze this email for phishing indicators using current threat intelligence:

${fullText}`
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 400,
        search_recency_filter: 'month'
      }),
    });

    if (!response.ok) {
      console.error('Perplexity API error:', response.status, await response.text());
      return { score: 0, reasons: [], patterns: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in Perplexity response');
      return { score: 0, reasons: [], patterns: [] };
    }
    
    // Try to parse JSON response
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const analysis = JSON.parse(cleanContent);
      return {
        score: Math.max(0, Math.min(1, analysis.score || 0)),
        reasons: Array.isArray(analysis.reasons) ? analysis.reasons : [],
        patterns: Array.isArray(analysis.patterns) ? analysis.patterns : []
      };
    } catch (parseError) {
      console.error('Failed to parse Perplexity response:', content);
      // Fallback: extract score and basic analysis
      const scoreMatch = content.match(/["']?score["']?\s*:\s*([0-9.]+)/i);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0.5;
      return {
        score: Math.max(0, Math.min(1, score)),
        reasons: ['Perplexity AI detected potential phishing indicators based on current threat intelligence'],
        patterns: ['ai_detected']
      };
    }
  } catch (error) {
    console.error('Perplexity analysis error:', error);
    return { score: 0, reasons: [], patterns: [] };
  }
}

// Combine rule-based, Gemini, and Perplexity results for maximum accuracy
function combineResults(ruleResult: any, geminiResult: any, perplexityResult: any): DetectionResult {
  // Calculate weighted combination: 30% rule-based, 40% Gemini, 30% Perplexity
  // Give Gemini slightly more weight as it's designed for complex analysis
  const combinedScore = (ruleResult.score * 0.3) + (geminiResult.score * 0.4) + (perplexityResult.score * 0.3);
  
  // Determine final result with adaptive threshold
  // If any method gives a high score (>0.7), be more cautious
  const highConfidenceDetection = Math.max(ruleResult.score, geminiResult.score, perplexityResult.score) > 0.7;
  const threshold = highConfidenceDetection ? 0.4 : 0.5;
  const isPhishing = combinedScore > threshold;
  
  // Calculate confidence based on agreement between methods
  const scores = [ruleResult.score, geminiResult.score, perplexityResult.score].filter(s => s > 0);
  let confidence;
  
  if (scores.length === 0) {
    confidence = 0.5; // No analysis available
  } else if (scores.length === 1) {
    confidence = isPhishing ? scores[0] : (1 - scores[0]);
  } else {
    // Calculate confidence based on agreement and combined score
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - combinedScore, 2), 0) / scores.length;
    const agreement = Math.max(0, 1 - variance * 2); // Convert variance to agreement score
    confidence = isPhishing 
      ? Math.min(0.99, combinedScore + (agreement * 0.2))
      : Math.min(0.99, (1 - combinedScore) + (agreement * 0.2));
  }
  
  // Determine risk level based on combined score and individual high scores
  let risk_level: 'low' | 'medium' | 'high';
  if (combinedScore < 0.3 && !highConfidenceDetection) {
    risk_level = 'low';
  } else if (combinedScore < 0.6 && !highConfidenceDetection) {
    risk_level = 'medium';
  } else {
    risk_level = 'high';
  }
  
  // Combine reasons and patterns from all methods
  const allReasons = [
    ...ruleResult.reasons,
    ...geminiResult.reasons,
    ...perplexityResult.reasons
  ].filter(reason => reason && reason.length > 0);
  
  const allPatterns = [
    ...ruleResult.patterns,
    ...geminiResult.patterns,
    ...perplexityResult.patterns
  ].filter(pattern => pattern && pattern.length > 0);
  
  return {
    result: isPhishing ? 'phishing' : 'safe',
    confidence: Math.round(confidence * 100) / 100,
    reasons: allReasons.length > 0 ? allReasons : ['Analysis completed with available detection methods'],
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

    console.log('Starting enhanced phishing detection with multiple AI engines...');

    // Run rule-based, Gemini, and Perplexity analysis in parallel for maximum efficiency
    const [ruleResult, geminiResult, perplexityResult] = await Promise.all([
      Promise.resolve(ruleBasedDetection(
        requestData.email_text,
        requestData.sender,
        requestData.subject,
        requestData.links
      )),
      geminiAnalysis(requestData.email_text, requestData.sender, requestData.subject),
      perplexityAnalysis(requestData.email_text, requestData.sender, requestData.subject)
    ]);

    console.log('Rule-based score:', ruleResult.score);
    console.log('Gemini AI score:', geminiResult.score);
    console.log('Perplexity AI score:', perplexityResult.score);

    // Combine results from all three methods
    const finalResult = combineResults(ruleResult, geminiResult, perplexityResult);

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