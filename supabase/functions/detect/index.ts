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
  explanation: {
    summary: string;
    technical_details: string[];
    confidence_factors: string[];
  };
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

// Google Safe Browsing API integration for URL blacklist checking
async function safeBrowsingCheck(links?: string[]): Promise<{
  score: number;
  reasons: string[];
  patterns: string[];
}> {
  if (!links || links.length === 0) {
    return { score: 0, reasons: [], patterns: [] };
  }

  try {
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.log('Google API key not found, skipping Safe Browsing check');
      return { score: 0, reasons: [], patterns: [] };
    }

    let totalScore = 0;
    const reasons: string[] = [];
    const patterns: string[] = [];

    for (const link of links) {
      try {
        // Extract domain from URL for Safe Browsing API
        const url = new URL(link.startsWith('http') ? link : `https://${link}`);
        const domain = url.hostname;

        const response = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client: {
              clientId: 'phishnot-scanner',
              clientVersion: '1.0.0'
            },
            threatInfo: {
              threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
              platformTypes: ['ANY_PLATFORM'],
              threatEntryTypes: ['URL'],
              threatEntries: [
                { url: link }
              ]
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.matches && data.matches.length > 0) {
            const match = data.matches[0];
            const threatType = match.threatType;
            
            // High score for known malicious URLs
            totalScore += 0.9;
            reasons.push(`URL flagged by Google Safe Browsing as ${threatType}: ${link}`);
            patterns.push('safe_browsing_threat');
            
            console.log(`Safe Browsing threat detected: ${link} - ${threatType}`);
          }
        } else {
          console.log(`Safe Browsing API error for ${link}:`, response.status);
        }
      } catch (urlError) {
        console.log(`Error processing URL ${link}:`, urlError);
      }
    }

    return {
      score: Math.min(totalScore, 1),
      reasons,
      patterns
    };
  } catch (error) {
    console.error('Safe Browsing check error:', error);
    return { score: 0, reasons: [], patterns: [] };
  }
}

// History-based learning function
async function applyHistoryBasedLearning(
  supabase: any,
  clerkUserId?: string,
  patterns?: string[],
  sender?: string
): Promise<{ adjustmentScore: number; reasons: string[] }> {
  if (!clerkUserId || !patterns || patterns.length === 0) {
    return { adjustmentScore: 0, reasons: [] };
  }

  try {
    // Get user's feedback history for similar patterns
    const { data: feedbackData, error } = await supabase
      .from('user_feedback')
      .select('original_result, user_feedback, feedback_reason')
      .eq('clerk_user_id', clerkUserId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .limit(100);

    if (error) {
      console.error('History query error:', error);
      return { adjustmentScore: 0, reasons: [] };
    }

    if (!feedbackData || feedbackData.length === 0) {
      return { adjustmentScore: 0, reasons: [] };
    }

    // Analyze user's correction patterns
    const corrections = feedbackData.filter(f => f.user_feedback === 'incorrect');
    const totalFeedback = feedbackData.length;
    
    let adjustmentScore = 0;
    const reasons: string[] = [];

    if (corrections.length > 0) {
      const correctionRate = corrections.length / totalFeedback;
      
      // If user frequently corrects false positives, be less aggressive
      if (correctionRate > 0.3) {
        adjustmentScore = -0.1; // Reduce phishing score
        reasons.push(`User history suggests lower false positive tolerance (${Math.round(correctionRate * 100)}% corrections)`);
      }
      
      // If user frequently corrects false negatives, be more aggressive
      const falseNegatives = corrections.filter(c => c.original_result === 'safe').length;
      if (falseNegatives > 2) {
        adjustmentScore = 0.15; // Increase phishing score
        reasons.push(`User history shows ${falseNegatives} missed phishing attempts - being more cautious`);
      }
    }

    // Check for sender-specific history
    if (sender) {
      const senderFeedback = feedbackData.filter(f => 
        f.feedback_reason && f.feedback_reason.toLowerCase().includes(sender.toLowerCase())
      );
      
      if (senderFeedback.length > 0) {
        const senderCorrections = senderFeedback.filter(f => f.user_feedback === 'incorrect');
        if (senderCorrections.length > 0) {
          adjustmentScore += 0.1;
          reasons.push(`Previous user feedback about similar sender patterns`);
        }
      }
    }

    return { adjustmentScore, reasons };
  } catch (error) {
    console.error('History-based learning error:', error);
    return { adjustmentScore: 0, reasons: [] };
  }
}

// Enhanced Explainable AI function
function createExplanation(
  result: 'phishing' | 'safe',
  confidence: number,
  reasons: string[],
  riskLevel: 'low' | 'medium' | 'high',
  patterns: string[],
  ruleScore: number,
  geminiScore: number,
  perplexityScore: number,
  safeBrowsingScore: number,
  historyAdjustment: number
): {
  summary: string;
  technical_details: string[];
  confidence_factors: string[];
} {
  // Create user-friendly summary
  let summary: string;
  if (result === 'phishing') {
    if (confidence > 0.8) {
      summary = `🚨 HIGH RISK: This email shows strong indicators of a phishing attempt. We strongly recommend not clicking any links or providing personal information.`;
    } else if (confidence > 0.6) {
      summary = `⚠️ MODERATE RISK: This email contains several suspicious elements that suggest it might be a phishing attempt. Exercise caution.`;
    } else {
      summary = `⚡ LOW-MODERATE RISK: This email has some concerning features. Please verify the sender's identity before taking any action.`;
    }
  } else {
    if (confidence > 0.8) {
      summary = `✅ SAFE: This email appears legitimate with no significant phishing indicators detected.`;
    } else if (confidence > 0.6) {
      summary = `✅ LIKELY SAFE: This email appears to be legitimate, though some minor concerns were noted.`;
    } else {
      summary = `❓ UNCERTAIN: The analysis is inconclusive. When in doubt, verify the sender through an independent channel.`;
    }
  }

  // Create technical details
  const technical_details: string[] = [];
  
  if (ruleScore > 0.1) {
    technical_details.push(`Rule-based analysis score: ${(ruleScore * 100).toFixed(0)}% - Traditional phishing patterns detected`);
  }
  
  if (geminiScore > 0.1) {
    technical_details.push(`AI content analysis score: ${(geminiScore * 100).toFixed(0)}% - Advanced language pattern analysis`);
  }
  
  if (perplexityScore > 0.1) {
    technical_details.push(`Threat intelligence score: ${(perplexityScore * 100).toFixed(0)}% - Real-time threat database check`);
  }
  
  if (safeBrowsingScore > 0.1) {
    technical_details.push(`URL reputation score: ${(safeBrowsingScore * 100).toFixed(0)}% - Google Safe Browsing verification`);
  }
  
  if (Math.abs(historyAdjustment) > 0.05) {
    technical_details.push(`Personalization adjustment: ${historyAdjustment > 0 ? '+' : ''}${(historyAdjustment * 100).toFixed(0)}% - Based on your feedback history`);
  }

  if (patterns.length > 0) {
    const patternCategories = [...new Set(patterns)].map(p => {
      switch(p) {
        case 'suspicious_domain': return 'Suspicious domain patterns';
        case 'url_shortener': return 'URL shorteners';
        case 'urgency_language': return 'Urgency tactics';
        case 'credential_harvesting': return 'Credential requests';
        case 'domain_spoofing': return 'Domain spoofing';
        case 'safe_browsing_threat': return 'Known malicious URLs';
        case 'social_engineering': return 'Social engineering';
        case 'brand_spoofing': return 'Brand impersonation';
        default: return p.replace(/_/g, ' ');
      }
    });
    technical_details.push(`Detected attack patterns: ${patternCategories.join(', ')}`);
  }

  // Create confidence factors
  const confidence_factors: string[] = [];
  
  const activeScores = [ruleScore, geminiScore, perplexityScore, safeBrowsingScore].filter(s => s > 0).length;
  if (activeScores >= 3) {
    confidence_factors.push('High confidence: Multiple detection methods agree');
  } else if (activeScores === 2) {
    confidence_factors.push('Moderate confidence: Two detection methods active');
  } else {
    confidence_factors.push('Limited confidence: Single detection method');
  }

  if (reasons.length > 3) {
    confidence_factors.push('Multiple specific indicators identified');
  } else if (reasons.length > 1) {
    confidence_factors.push('Several indicators present');
  } else if (reasons.length === 1) {
    confidence_factors.push('Single indicator detected');
  }

  return {
    summary,
    technical_details,
    confidence_factors
  };
}

// Enhanced result combination function with all detection methods and history learning
function combineResults(
  ruleResult: any, 
  geminiResult: any, 
  perplexityResult: any, 
  safeBrowsingResult: any, 
  historyResult: { adjustmentScore: number; reasons: string[] }
): DetectionResult {
  // Calculate weighted combination: 25% rule-based, 30% Gemini, 25% Perplexity, 20% Safe Browsing
  const baseScore = (ruleResult.score * 0.25) + (geminiResult.score * 0.30) + 
                    (perplexityResult.score * 0.25) + (safeBrowsingResult.score * 0.20);
  
  // Apply history-based adjustment
  const combinedScore = Math.max(0, Math.min(1, baseScore + historyResult.adjustmentScore));
  
  // Determine final result with adaptive threshold
  // If any method gives a high score (>0.7), be more cautious
  const highConfidenceDetection = Math.max(
    ruleResult.score, 
    geminiResult.score, 
    perplexityResult.score, 
    safeBrowsingResult.score
  ) > 0.7;
  
  // Safe Browsing gets special priority - if it flags something, lower the threshold
  const safeBrowsingDetected = safeBrowsingResult.score > 0.5;
  const threshold = safeBrowsingDetected ? 0.3 : (highConfidenceDetection ? 0.4 : 0.5);
  const isPhishing = combinedScore > threshold;
  
  // Calculate confidence based on agreement between methods
  const scores = [ruleResult.score, geminiResult.score, perplexityResult.score, safeBrowsingResult.score]
    .filter(s => s > 0);
  
  let confidence;
  
  if (scores.length === 0) {
    confidence = 0.5; // No analysis available
  } else if (scores.length === 1) {
    confidence = isPhishing ? scores[0] : (1 - scores[0]);
  } else {
    // Calculate confidence based on agreement and combined score
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - combinedScore, 2), 0) / scores.length;
    const agreement = Math.max(0, 1 - variance * 2); // Convert variance to agreement score
    
    // Boost confidence for Safe Browsing detections
    const safeBrowsingBoost = safeBrowsingDetected ? 0.1 : 0;
    
    confidence = isPhishing 
      ? Math.min(0.99, combinedScore + (agreement * 0.2) + safeBrowsingBoost)
      : Math.min(0.99, (1 - combinedScore) + (agreement * 0.2));
  }
  
  // Determine risk level based on combined score and individual high scores
  let risk_level: 'low' | 'medium' | 'high';
  if (safeBrowsingDetected) {
    risk_level = 'high'; // Safe Browsing detection always high risk
  } else if (combinedScore < 0.3 && !highConfidenceDetection) {
    risk_level = 'low';
  } else if (combinedScore < 0.6 && !highConfidenceDetection) {
    risk_level = 'medium';
  } else {
    risk_level = 'high';
  }
  
  // Combine reasons and patterns from all methods including history
  const allReasons = [
    ...ruleResult.reasons,
    ...geminiResult.reasons,
    ...perplexityResult.reasons,
    ...safeBrowsingResult.reasons,
    ...historyResult.reasons
  ].filter(reason => reason && reason.length > 0);
  
  const allPatterns = [
    ...ruleResult.patterns,
    ...geminiResult.patterns,
    ...perplexityResult.patterns,
    ...safeBrowsingResult.patterns
  ].filter(pattern => pattern && pattern.length > 0);
  
  // Create detailed explanation
  const explanation = createExplanation(
    isPhishing ? 'phishing' : 'safe',
    confidence,
    allReasons,
    risk_level,
    allPatterns,
    ruleResult.score,
    geminiResult.score,
    perplexityResult.score,
    safeBrowsingResult.score,
    historyResult.adjustmentScore
  );
  
  return {
    result: isPhishing ? 'phishing' : 'safe',
    confidence: Math.round(confidence * 100) / 100,
    reasons: allReasons.length > 0 ? allReasons : ['Analysis completed with available detection methods'],
    risk_level,
    detected_patterns: [...new Set(allPatterns)], // Remove duplicates
    explanation
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

    console.log('Starting enhanced phishing detection with multiple AI engines and history learning...');

    // Run all detection methods in parallel for maximum efficiency
    const [ruleResult, geminiResult, perplexityResult, safeBrowsingResult] = await Promise.all([
      Promise.resolve(ruleBasedDetection(
        requestData.email_text,
        requestData.sender,
        requestData.subject,
        requestData.links
      )),
      geminiAnalysis(requestData.email_text, requestData.sender, requestData.subject),
      perplexityAnalysis(requestData.email_text, requestData.sender, requestData.subject),
      safeBrowsingCheck(requestData.links)
    ]);

    console.log('Rule-based score:', ruleResult.score);
    console.log('Gemini AI score:', geminiResult.score);
    console.log('Perplexity AI score:', perplexityResult.score);
    console.log('Safe Browsing score:', safeBrowsingResult.score);

    // Apply history-based learning adjustments
    const historyResult = await applyHistoryBasedLearning(
      supabase,
      requestData.clerk_user_id,
      [...ruleResult.patterns, ...geminiResult.patterns, ...perplexityResult.patterns],
      requestData.sender
    );

    console.log('History adjustment:', historyResult.adjustmentScore);

    // Combine results from all four methods plus history learning
    const finalResult = combineResults(ruleResult, geminiResult, perplexityResult, safeBrowsingResult, historyResult);

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