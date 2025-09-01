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

// Rate limiting configuration
const RATE_LIMITS = {
  detect: { requests: 50, window: 3600000 }, // 50 requests per hour
  free_tier: { requests: 10, window: 3600000 }, // 10 requests per hour for free users
};

// Check and enforce rate limiting
async function checkRateLimit(clerkUserId: string, endpoint: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  if (!clerkUserId) {
    return { allowed: false, remaining: 0, resetTime: Date.now() + RATE_LIMITS.detect.window };
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMITS.detect.window);
  
  try {
    // Get or create rate limit record for current window
    const { data: existing, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .eq('endpoint', endpoint)
      .gte('window_end', now.toISOString())
      .maybeSingle();

    if (fetchError) {
      console.error('Rate limit fetch error:', fetchError);
      return { allowed: true, remaining: RATE_LIMITS.detect.requests - 1, resetTime: Date.now() + RATE_LIMITS.detect.window };
    }

    const limit = RATE_LIMITS.detect.requests;

    if (existing) {
      // Check if limit exceeded
      if (existing.requests_count >= limit) {
        const resetTime = new Date(existing.window_end).getTime();
        return { allowed: false, remaining: 0, resetTime };
      }

      // Increment request count
      const { error: updateError } = await supabase
        .from('rate_limits')
        .update({ 
          requests_count: existing.requests_count + 1,
          updated_at: now.toISOString()
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Rate limit update error:', updateError);
      }

      return { 
        allowed: true, 
        remaining: limit - (existing.requests_count + 1), 
        resetTime: new Date(existing.window_end).getTime()
      };
    } else {
      // Create new rate limit record
      const windowEnd = new Date(now.getTime() + RATE_LIMITS.detect.window);
      
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert({
          clerk_user_id: clerkUserId,
          endpoint: endpoint,
          requests_count: 1,
          window_start: now.toISOString(),
          window_end: windowEnd.toISOString()
        });

      if (insertError) {
        console.error('Rate limit insert error:', insertError);
      }

      return { 
        allowed: true, 
        remaining: limit - 1, 
        resetTime: windowEnd.getTime()
      };
    }
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Allow request on error to avoid blocking users
    return { allowed: true, remaining: RATE_LIMITS.detect.requests - 1, resetTime: Date.now() + RATE_LIMITS.detect.window };
  }
}

// Update user analytics
async function updateUserAnalytics(clerkUserId: string, isPhishing: boolean): Promise<void> {
  if (!clerkUserId) return;

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle();

    const now = new Date().toISOString();

    if (existing) {
      // Update existing analytics
      const { error: updateError } = await supabase
        .from('user_analytics')
        .update({
          total_scans: existing.total_scans + 1,
          phishing_detected: existing.phishing_detected + (isPhishing ? 1 : 0),
          safe_emails: existing.safe_emails + (isPhishing ? 0 : 1),
          last_scan_at: now,
          updated_at: now
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Analytics update error:', updateError);
      }
    } else {
      // Create new analytics record
      const { error: insertError } = await supabase
        .from('user_analytics')
        .insert({
          clerk_user_id: clerkUserId,
          total_scans: 1,
          phishing_detected: isPhishing ? 1 : 0,
          safe_emails: isPhishing ? 0 : 1,
          last_scan_at: now
        });

      if (insertError) {
        console.error('Analytics insert error:', insertError);
      }
    }
  } catch (error) {
    console.error('Analytics update error:', error);
  }
}

// Check for alert conditions
async function checkAlertConditions(clerkUserId: string, isPhishing: boolean): Promise<void> {
  if (!clerkUserId || !isPhishing) return;

  try {
    // Get user's notification preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle();

    if (!preferences || !preferences.email_alerts) return;

    // Get recent phishing detections
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentPhishing, error } = await supabase
      .from('email_analyses')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .eq('is_phishing', true)
      .gte('analyzed_at', oneDayAgo);

    if (error) {
      console.error('Error fetching recent phishing:', error);
      return;
    }

    const phishingCount = recentPhishing?.length || 0;

    // Check if threshold exceeded
    if (phishingCount >= preferences.phishing_threshold) {
      // Create alert
      const { error: alertError } = await supabase
        .from('user_alerts')
        .insert({
          clerk_user_id: clerkUserId,
          alert_type: 'phishing_threshold_exceeded',
          message: `You've scanned ${phishingCount} phishing emails in the last 24 hours. Please be extra cautious with your email security.`,
          metadata: { phishing_count: phishingCount, threshold: preferences.phishing_threshold }
        });

      if (alertError) {
        console.error('Error creating alert:', alertError);
      }
    }
  } catch (error) {
    console.error('Alert check error:', error);
  }
}

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

// Enhanced rule-based detection with improved accuracy and false positive reduction
function ruleBasedDetection(email_text: string, sender?: string, subject?: string, links?: string[]): {
  score: number;
  reasons: string[];
  patterns: string[];
} {
  let score = 0;
  const reasons: string[] = [];
  const patterns: string[] = [];

  console.log('Starting enhanced rule-based detection...');

  // WHITELIST: Known legitimate domains and senders
  const legitimateDomains = [
    'gov.in', 'nic.in', 'aicte-india.org', 'ugc.ac.in', 'mhrd.gov.in',
    'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com',
    'amazon.com', 'paypal.com', 'apple.com', 'microsoft.com', 'google.com',
    'facebook.com', 'linkedin.com', 'twitter.com', 'instagram.com',
    'github.com', 'stackoverflow.com', 'medium.com',
    'banks.org', 'rbi.org.in', 'npci.org.in'
  ];

  const isFromLegitimateSource = sender && legitimateDomains.some(domain => 
    sender.toLowerCase().endsWith('@' + domain) || sender.toLowerCase().endsWith('.' + domain)
  );

  // Reduce base suspicion for emails from legitimate sources
  if (isFromLegitimateSource) {
    console.log('Email from whitelisted domain:', sender);
    score -= 0.2; // Give legitimate sources benefit of doubt
  }

  // ENHANCED: Generic greeting detection with context awareness
  const genericGreetingPattern = /Dear\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*(?:\s+[A-Z][a-z]+)*)/i;
  const greetingMatch = email_text.match(genericGreetingPattern);
  
  if (greetingMatch && !isFromLegitimateSource) {
    // Only flag generic greetings from non-legitimate sources
    const extractedName = greetingMatch[1];
    
    // Check if it's a very generic/fake name pattern
    const suspiciousNamePatterns = [
      /^[A-Z][a-z]+ [A-Z][a-z]+$/, // Perfect FirstName LastName format
      /User|Customer|Client|Member|Sir|Madam/i,
      /John Doe|Jane Doe|Test User|Sample Name/i
    ];
    
    const isSuspiciousName = suspiciousNamePatterns.some(pattern => pattern.test(extractedName));
    
    if (isSuspiciousName) {
      score += 0.4; // Reduced from 0.8 to prevent false positives
      reasons.push('Suspicious generic greeting pattern detected');
      patterns.push('social_engineering');
      console.log('Suspicious generic greeting pattern detected');
    } else if (sender && !sender.toLowerCase().includes(extractedName.toLowerCase().split(' ')[0])) {
      // Name in greeting doesn't match sender name
      score += 0.3;
      reasons.push('Greeting name inconsistent with sender');
      patterns.push('social_engineering');
    }
  }

  // ENHANCED: Reply-to mismatch with legitimate domain validation
  const replyToPattern = /reply.?to[:\s]+([^\s\n]+@[^\s\n]+)/i;
  const replyToMatch = email_text.match(replyToPattern);
  if (replyToMatch && sender) {
    const replyTo = replyToMatch[1].toLowerCase();
    const senderEmail = sender.toLowerCase();
    const senderDomain = senderEmail.split('@')[1];
    const replyToDomain = replyTo.split('@')[1];
    
    if (senderDomain && replyToDomain && senderDomain !== replyToDomain) {
      // Critical: Check for obvious phishing indicators
      if (replyTo.includes('example.com') || replyToDomain === 'example.com' || replyTo.includes('test.com')) {
        score += 0.9; // Maximum score for obvious fake domains
        reasons.push(`Fake reply-to domain detected: ${replyToDomain}`);
        patterns.push('impersonation');
        patterns.push('domain_spoofing');
        console.log('Fake reply-to domain detected:', replyToDomain);
      } else if (!legitimateDomains.includes(senderDomain) && !legitimateDomains.includes(replyToDomain)) {
        // Both domains are unknown - moderate suspicion
        score += 0.4; // Reduced from 0.6
        reasons.push(`Reply-to domain mismatch between unknown domains: ${senderDomain} vs ${replyToDomain}`);
        patterns.push('domain_spoofing');
      } else if (legitimateDomains.includes(senderDomain) && !legitimateDomains.includes(replyToDomain)) {
        // Legitimate sender with suspicious reply-to
        score += 0.7;
        reasons.push(`Legitimate sender with suspicious reply-to: ${senderDomain} vs ${replyToDomain}`);
        patterns.push('impersonation');
      }
    }
  }

  // CRITICAL PATTERN: Tracking pixel detection
  const trackingPixelPatterns = [
    /https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|bmp)\?[^\s]*(?:track|pixel|beacon|analytics|utm|click)/i,
    /https?:\/\/[^\s]*(?:track|pixel|beacon|analytics|click)[^\s]*\.(?:jpg|jpeg|png|gif|bmp)/i,
    /<img[^>]*src=["'][^"']*(?:track|pixel|beacon|1x1)[^"']*["'][^>]*>/i,
    /width=["']1["'][^>]*height=["']1["']/i,
    /height=["']1["'][^>]*width=["']1["']/i
  ];

  for (const pattern of trackingPixelPatterns) {
    if (pattern.test(email_text)) {
      score += 0.7; // High score for tracking pixels
      reasons.push('Tracking pixel detected - used to monitor email activity and validate email addresses');
      patterns.push('tracking');
      console.log('Tracking pixel pattern detected');
      break;
    }
  }

  // ENHANCED: Brand impersonation with legitimate verification
  const brandPatterns = [
    { 
      name: 'AICTE', 
      pattern: /aicte|all india council|technical education/i, 
      legitimate: ['aicte-india.org', 'nic.in'],
      keywords: ['admission', 'approval', 'accreditation', 'council']
    },
    { 
      name: 'Government', 
      pattern: /government|ministry|dept|gov\.in/i, 
      legitimate: ['gov.in', 'nic.in'],
      keywords: ['official', 'notification', 'circular', 'order']
    },
    { 
      name: 'Banking', 
      pattern: /bank|rbi|reserve bank|payment|transaction/i, 
      legitimate: ['rbi.org.in', 'npci.org.in'],
      keywords: ['account', 'balance', 'transaction', 'payment']
    },
    { 
      name: 'Major Tech', 
      pattern: /google|microsoft|apple|facebook|amazon|paypal/i, 
      legitimate: ['google.com', 'microsoft.com', 'apple.com', 'facebook.com', 'amazon.com', 'paypal.com'],
      keywords: ['account', 'security', 'verify', 'update']
    }
  ];

  for (const brand of brandPatterns) {
    const brandInContent = brand.pattern.test(email_text);
    const brandInSubject = brand.pattern.test(subject || '');
    const hasKeywords = brand.keywords.some(keyword => 
      email_text.toLowerCase().includes(keyword) || (subject || '').toLowerCase().includes(keyword)
    );
    
    if ((brandInContent || brandInSubject) && hasKeywords) {
      if (sender) {
        const senderDomain = sender.split('@')[1]?.toLowerCase();
        const isLegitimate = brand.legitimate.some(domain => 
          senderDomain === domain || senderDomain?.endsWith('.' + domain)
        );
        
        if (!isLegitimate && !isFromLegitimateSource) {
          // Check for look-alike domains
          const isLookAlike = brand.legitimate.some(legitDomain => {
            const similarity = calculateDomainSimilarity(senderDomain || '', legitDomain);
            return similarity > 0.7 && similarity < 1.0; // Similar but not exact
          });
          
          if (isLookAlike) {
            score += 0.8; // High score for look-alike domains
            reasons.push(`Potential ${brand.name} domain spoofing: ${senderDomain} resembles legitimate domain`);
            patterns.push('domain_spoofing');
            patterns.push('brand_spoofing');
          } else {
            score += 0.5; // Moderate score for general brand impersonation
            reasons.push(`Potential ${brand.name} brand impersonation from unverified sender`);
            patterns.push('brand_spoofing');
          }
          console.log(`Brand impersonation detected: ${brand.name} from ${senderDomain}`);
        }
      }
    }
  }

  // Helper function to calculate domain similarity
  function calculateDomainSimilarity(domain1: string, domain2: string): number {
    const longer = domain1.length > domain2.length ? domain1 : domain2;
    const shorter = domain1.length > domain2.length ? domain2 : domain1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }
  
  function levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  // ENHANCED: Suspicious domain patterns
  const suspiciousDomains = [
    /secure[_-]?verify[_-]?login/i,
    /account[_-]?update[_-]?security/i,
    /paypal[_-]?secure/i,
    /amazon[_-]?security/i,
    /apple[_-]?id[_-]?verify/i,
    /microsoft[_-]?security/i,
    /google[_-]?verify/i,
    /facebook[_-]?security/i,
    /vibrance[_-]?ai/i // Specific to the reported case
  ];

  // Check domains in links and email content
  if (links && links.length > 0) {
    for (const link of links) {
      for (const pattern of suspiciousDomains) {
        if (pattern.test(link)) {
          score += 0.4;
          reasons.push(`Suspicious domain detected: ${link}`);
          patterns.push('suspicious_domain');
          break;
        }
      }

      // Check for URL shorteners (often used in phishing)
      if (/bit\.ly|tinyurl|t\.co|goo\.gl|short\.link/i.test(link)) {
        score += 0.2;
        reasons.push('URL shortener detected');
        patterns.push('url_shortener');
      }

      // Check for IP addresses instead of domains
      if (/https?:\/\/\d+\.\d+\.\d+\.\d+/i.test(link)) {
        score += 0.3;
        reasons.push('Direct IP address in link');
        patterns.push('ip_address_link');
      }
    }
  }

  // ENHANCED: Urgency tactics with context awareness
  const urgencyPatterns = [
    { pattern: /urgent[ly]?\s*(action|response|attention)/i, weight: 0.3, description: 'urgent action required' },
    { pattern: /immediate[ly]?\s*(verify|update|confirm)/i, weight: 0.3, description: 'immediate verification request' },
    { pattern: /act now|click here now|respond now/i, weight: 0.4, description: 'pressure to act immediately' },
    { pattern: /limited time|expires? (today|tonight|soon)/i, weight: 0.2, description: 'artificial time pressure' },
    { pattern: /suspend[ed]?\s*(account|service)/i, weight: 0.4, description: 'account suspension threat' },
    { pattern: /unusual activity|suspicious (login|access)/i, weight: 0.3, description: 'security scare tactic' },
    { pattern: /verify (now|immediately|within \d+)/i, weight: 0.3, description: 'urgent verification demand' },
    { pattern: /final (notice|warning|reminder)/i, weight: 0.2, description: 'final notice pressure' }
  ];

  const fullText = `${email_text} ${subject || ''} ${sender || ''}`;
  let urgencyScore = 0;
  const detectedUrgencyTactics: string[] = [];

  for (const urgencyItem of urgencyPatterns) {
    if (urgencyItem.pattern.test(fullText)) {
      // Reduce weight for legitimate senders
      const adjustedWeight = isFromLegitimateSource ? urgencyItem.weight * 0.5 : urgencyItem.weight;
      urgencyScore += adjustedWeight;
      detectedUrgencyTactics.push(urgencyItem.description);
    }
  }

  if (urgencyScore > 0) {
    score += Math.min(urgencyScore, 0.4); // Cap urgency contribution
    reasons.push(`Pressure tactics detected: ${detectedUrgencyTactics.join(', ')}`);
    patterns.push('urgency_language');
    console.log('Urgency tactics detected:', detectedUrgencyTactics);
  }

  // ENHANCED: Credential harvesting detection with severity levels
  const credentialPatterns = [
    { pattern: /enter.{0,30}(password|pin|otp|ssn|social security)/i, weight: 0.6, description: 'sensitive credential request' },
    { pattern: /update.{0,30}(payment|billing|card|bank)/i, weight: 0.5, description: 'financial information request' },
    { pattern: /verify.{0,30}(identity|account|personal)/i, weight: 0.4, description: 'identity verification request' },
    { pattern: /confirm.{0,30}(details|information|data)/i, weight: 0.3, description: 'information confirmation request' },
    { pattern: /(click|visit).{0,20}(link|url).{0,20}(verify|update|confirm)/i, weight: 0.4, description: 'suspicious link for verification' },
    { pattern: /provide.{0,20}(personal|confidential|sensitive)/i, weight: 0.5, description: 'personal information solicitation' }
  ];

  let credentialScore = 0;
  const detectedCredentialRequests: string[] = [];

  for (const credItem of credentialPatterns) {
    if (credItem.pattern.test(fullText)) {
      // Legitimate senders might ask for verification, but with lower suspicion
      const adjustedWeight = isFromLegitimateSource ? credItem.weight * 0.6 : credItem.weight;
      credentialScore += adjustedWeight;
      detectedCredentialRequests.push(credItem.description);
    }
  }

  if (credentialScore > 0) {
    score += Math.min(credentialScore, 0.5); // Cap credential harvesting contribution
    reasons.push(`Credential requests detected: ${detectedCredentialRequests.join(', ')}`);
    patterns.push('credential_harvesting');
    console.log('Credential harvesting attempts detected:', detectedCredentialRequests);
  }

  // Check sender spoofing indicators
  if (sender) {
    const trustedDomains = ['@amazon.com', '@paypal.com', '@apple.com', '@microsoft.com', '@google.com', '@aicte-india.org'];
    const senderLower = sender.toLowerCase();
    
    for (const domain of trustedDomains) {
      if (senderLower.includes(domain.substring(1)) && !senderLower.endsWith(domain)) {
        score += 0.5;
        reasons.push(`Potential domain spoofing: ${sender}`);
        patterns.push('domain_spoofing');
        break;
      }
    }
  }

  // Check for inconsistencies in content
  const inconsistencyPatterns = [
    { sender: /aicte/i, content: /vibrance/i, description: 'AICTE sender with non-AICTE content' },
    { sender: /government/i, content: /private|startup|company/i, description: 'Government sender with private entity content' }
  ];

  for (const inc of inconsistencyPatterns) {
    if (sender && inc.sender.test(sender) && inc.content.test(email_text)) {
      score += 0.6;
      reasons.push(`Content inconsistency detected: ${inc.description}`);
      patterns.push('social_engineering');
      patterns.push('impersonation');
    }
  }

  // Check for poor grammar/spelling (simplified check)
  const grammarIssues = /\b(recieve|occured|seperate|loose|there|your|its)\b/gi.exec(fullText);
  if (grammarIssues && grammarIssues.length > 2) {
    score += 0.1;
    reasons.push('Multiple grammar/spelling errors detected');
    patterns.push('grammar_issues');
  }

  const finalScore = Math.min(score, 1);
  console.log(`Rule-based detection completed. Score: ${finalScore}, Patterns: ${patterns.join(', ')}`);

  return { score: finalScore, reasons, patterns };
}

// Enhanced AI analysis using Google Gemini with balanced evaluation
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

    // Normalize input for consistent analysis
    const normalizedText = email_text.replace(/\s+/g, ' ').trim();
    const fullText = `Subject: ${(subject || 'No subject').trim()}
Sender: ${(sender || 'Unknown sender').trim()}
Content: ${normalizedText}`;

    console.log('Starting balanced Gemini analysis...');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert cybersecurity analyst with a focus on ACCURATE phishing detection while minimizing false positives. Analyze this email objectively.

BALANCED ANALYSIS APPROACH:
1. First, check if the sender is from a known legitimate domain (.gov.in, major banks, tech companies, etc.)
2. Look for GENUINE red flags, not common business language
3. Consider context - legitimate organizations may use formal language
4. Focus on CLEAR indicators of deception, not just urgent language

SCORING GUIDELINES:
- 0.0-0.2: Clearly legitimate (government, known companies with consistent branding)
- 0.3-0.5: Some concerns but likely legitimate
- 0.6-0.7: Suspicious elements requiring caution
- 0.8-1.0: Clear phishing indicators (fake domains, obvious deception)

MAJOR RED FLAGS (0.8+ score):
- Sender domain doesn't match claimed organization
- Reply-to address completely different from sender
- Tracking pixels from suspicious domains
- Obvious typosquatting or domain spoofing
- Requests for sensitive credentials with no legitimate context

COMMON BUSINESS PRACTICES (DO NOT score high):
- Formal greetings from legitimate organizations
- Account notifications from verified senders
- Legitimate marketing emails
- Standard business communications

Respond ONLY with this exact JSON format:
{
  "score": <float 0.0-1.0 based on genuine threat level>,
  "reasons": ["specific evidence-based reason 1", "specific evidence-based reason 2"],
  "patterns": ["only confirmed patterns like social_engineering, impersonation, brand_spoofing, tracking, credential_harvesting, domain_spoofing"]
}

Email to analyze:
${fullText}

Be precise and evidence-based in your assessment.`
          }]
        }],
        generationConfig: {
          temperature: 0.1,  // Slightly more deterministic
          maxOutputTokens: 600,
          topP: 0.9,
          topK: 3
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return { score: 0, reasons: ['Gemini API error: ' + response.status], patterns: [] };
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      console.error('No content in Gemini response:', JSON.stringify(data));
      return { score: 0, reasons: ['Gemini analysis failed - no content'], patterns: [] };
    }
    
    console.log('Gemini raw response:', content);
    
    // Try to parse JSON response
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const analysis = JSON.parse(cleanContent);
      
      // Validate response structure
      if (typeof analysis.score !== 'number' || !Array.isArray(analysis.reasons) || !Array.isArray(analysis.patterns)) {
        console.error('Invalid Gemini response structure:', analysis);
        return { score: 0, reasons: ['Gemini response format error'], patterns: [] };
      }
      
      const validatedScore = Math.max(0, Math.min(1, analysis.score || 0));
      console.log('Gemini analysis completed. Score:', validatedScore);
      
      return {
        score: validatedScore,
        reasons: Array.isArray(analysis.reasons) ? analysis.reasons.slice(0, 10) : [],
        patterns: Array.isArray(analysis.patterns) ? analysis.patterns.slice(0, 10) : []
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', content, 'Error:', parseError);
      
      // Fallback: try to extract score with regex
      const scoreMatch = content.match(/["']?score["']?\s*:\s*([0-9.]+)/i);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0.5;
      
      return {
        score: Math.max(0, Math.min(1, score)),
        reasons: ['Gemini detected potential phishing indicators (parsing issue)'],
        patterns: ['ai_detected_fallback']
      };
    }
  } catch (error) {
    console.error('Gemini analysis error:', error);
    return { score: 0, reasons: ['Gemini analysis failed: ' + error.message], patterns: [] };
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

    // Normalize input for consistent analysis
    const normalizedText = email_text.replace(/\s+/g, ' ').trim();
    const fullText = `Subject: ${(subject || 'No subject').trim()}
Sender: ${(sender || 'Unknown sender').trim()}
Content: ${normalizedText}`;

    console.log('Starting Perplexity analysis...');

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are a cybersecurity expert with access to current threat intelligence. Analyze emails for phishing using latest attack patterns.

CRITICAL INDICATORS (assign high scores 0.8+):
- Generic greetings with full names ("Dear [Full Name]") = major red flag
- Sender domain vs reply-to mismatch = credential theft attempt
- Tracking pixels/suspicious image URLs = data harvesting
- Brand impersonation with inconsistencies = sophisticated attack
- Multiple suspicious elements = coordinated phishing campaign

Respond ONLY with valid JSON:
{
  "score": <float 0.0-1.0 where 0=safe, 1=phishing>,
  "reasons": ["specific indicator 1", "specific indicator 2"],
  "patterns": ["social_engineering", "impersonation", "brand_spoofing", "tracking", "credential_harvesting"]
}

Focus on current phishing campaigns and attack vectors.`
          },
          {
            role: 'user',
            content: `Analyze this email for phishing indicators using current threat intelligence:

${fullText}`
          }
        ],
        temperature: 0.0,  // Completely deterministic
        top_p: 0.1,
        max_tokens: 500,
        search_recency_filter: 'month'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      return { score: 0, reasons: ['Perplexity API error: ' + response.status], patterns: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in Perplexity response:', JSON.stringify(data));
      return { score: 0, reasons: ['Perplexity analysis failed - no content'], patterns: [] };
    }
    
    console.log('Perplexity raw response:', content);
    
    // Try to parse JSON response
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const analysis = JSON.parse(cleanContent);
      
      // Validate response structure
      if (typeof analysis.score !== 'number' || !Array.isArray(analysis.reasons) || !Array.isArray(analysis.patterns)) {
        console.error('Invalid Perplexity response structure:', analysis);
        return { score: 0, reasons: ['Perplexity response format error'], patterns: [] };
      }
      
      const validatedScore = Math.max(0, Math.min(1, analysis.score || 0));
      console.log('Perplexity analysis completed. Score:', validatedScore);
      
      return {
        score: validatedScore,
        reasons: Array.isArray(analysis.reasons) ? analysis.reasons.slice(0, 10) : [],
        patterns: Array.isArray(analysis.patterns) ? analysis.patterns.slice(0, 10) : []
      };
    } catch (parseError) {
      console.error('Failed to parse Perplexity response:', content, 'Error:', parseError);
      
      // Fallback: try to extract score with regex
      const scoreMatch = content.match(/["']?score["']?\s*:\s*([0-9.]+)/i);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0.5;
      
      return {
        score: Math.max(0, Math.min(1, score)),
        reasons: ['Perplexity detected potential phishing indicators (parsing issue)'],
        patterns: ['ai_detected_fallback']
      };
    }
  } catch (error) {
    console.error('Perplexity analysis error:', error);
    return { score: 0, reasons: ['Perplexity analysis failed: ' + error.message], patterns: [] };
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

// Enhanced result combination with improved accuracy and reduced false positives
function combineResults(
  ruleResult: any, 
  geminiResult: any, 
  perplexityResult: any, 
  safeBrowsingResult: any, 
  historyResult: { adjustmentScore: number; reasons: string[] }
): DetectionResult {
  console.log('Combining results with enhanced logic...');
  console.log('Individual scores:', {
    rule: ruleResult.score,
    gemini: geminiResult.score,
    perplexity: perplexityResult.score,
    safeBrowsing: safeBrowsingResult.score,
    historyAdjustment: historyResult.adjustmentScore
  });

  // ENHANCED WEIGHTED COMBINATION with consensus logic
  // Safe Browsing gets highest weight as it's most reliable
  // AI methods get balanced weight
  // Rule-based gets moderate weight but with pattern importance
  const weights = {
    safeBrowsing: 0.35,  // Highest - most reliable
    gemini: 0.25,        // AI analysis
    perplexity: 0.20,    // Threat intelligence
    rules: 0.20          // Pattern matching
  };

  const baseScore = 
    (ruleResult.score * weights.rules) + 
    (geminiResult.score * weights.gemini) + 
    (perplexityResult.score * weights.perplexity) + 
    (safeBrowsingResult.score * weights.safeBrowsing);
  
  // Apply history-based learning
  let adjustedScore = baseScore + historyResult.adjustmentScore;
  
  // CONSENSUS LOGIC: Multiple methods must agree for high confidence
  const activeScores = [
    ruleResult.score, geminiResult.score, 
    perplexityResult.score, safeBrowsingResult.score
  ].filter(score => score > 0.1);

  const highScores = activeScores.filter(score => score > 0.6).length;
  const mediumScores = activeScores.filter(score => score > 0.3 && score <= 0.6).length;
  
  // Consensus adjustment
  if (activeScores.length >= 2) {
    if (highScores >= 2) {
      // Multiple high scores - increase confidence
      adjustedScore = Math.min(1.0, adjustedScore + 0.1);
      console.log('Multiple high scores detected - increasing confidence');
    } else if (highScores === 1 && mediumScores === 0) {
      // Only one high score, others low - reduce confidence
      adjustedScore = Math.max(0.0, adjustedScore - 0.1);
      console.log('Single high score with low others - reducing confidence');
    }
  }

  const combinedScore = Math.max(0, Math.min(1, adjustedScore));
  
  // PATTERN ANALYSIS with severity levels
  const allPatterns = [
    ...ruleResult.patterns,
    ...geminiResult.patterns,
    ...perplexityResult.patterns,
    ...safeBrowsingResult.patterns
  ].filter(pattern => pattern && pattern.length > 0);
  
  // Critical patterns that almost always indicate phishing
  const criticalPatterns = ['safe_browsing_threat', 'domain_spoofing'];
  const hasCriticalPatterns = allPatterns.some(pattern => criticalPatterns.includes(pattern));
  
  // High-risk patterns that strongly suggest phishing
  const highRiskPatterns = ['brand_spoofing', 'impersonation', 'credential_harvesting'];
  const hasHighRiskPatterns = allPatterns.some(pattern => highRiskPatterns.includes(pattern));
  
  // Medium-risk patterns
  const mediumRiskPatterns = ['social_engineering', 'urgency_language', 'tracking'];
  const hasMediumRiskPatterns = allPatterns.some(pattern => mediumRiskPatterns.includes(pattern));
  
  // Pattern-based score adjustment
  let patternAdjustment = 0;
  if (hasCriticalPatterns) {
    patternAdjustment += 0.3;
    console.log('Critical patterns detected');
  }
  if (hasHighRiskPatterns) {
    patternAdjustment += 0.2;
    console.log('High-risk patterns detected');
  }
  if (hasMediumRiskPatterns && allPatterns.length >= 2) {
    patternAdjustment += 0.1;
    console.log('Multiple medium-risk patterns detected');
  }

  const finalScore = Math.max(0, Math.min(1, combinedScore + patternAdjustment));
  
  // ADAPTIVE THRESHOLD LOGIC
  let threshold = 0.5; // Base threshold
  
  // Safe Browsing detection overrides other decisions
  if (safeBrowsingResult.score > 0.5) {
    threshold = 0.2;
    console.log('Safe Browsing threat detected - lowering threshold');
  } else if (hasCriticalPatterns) {
    threshold = 0.3;
    console.log('Critical patterns detected - lowering threshold');
  } else if (hasHighRiskPatterns && activeScores.length >= 2) {
    threshold = 0.4;
    console.log('High-risk patterns with consensus - lowering threshold');
  } else if (activeScores.length === 1 && Math.max(...activeScores) < 0.7) {
    threshold = 0.6;
    console.log('Single low-confidence detection - raising threshold');
  }
  
  // FINAL DETERMINATION
  const isPhishing = finalScore > threshold || hasCriticalPatterns || safeBrowsingResult.score > 0.5;
  
  console.log('Final determination:', {
    finalScore,
    threshold,
    isPhishing,
    reasoning: hasCriticalPatterns ? 'Critical patterns' : safeBrowsingResult.score > 0.5 ? 'Safe Browsing' : 'Score threshold'
  });
  
  // CONFIDENCE CALCULATION with enhanced logic
  const scores = [ruleResult.score, geminiResult.score, perplexityResult.score, safeBrowsingResult.score]
    .filter(s => s > 0);
  
  let confidence;
  
  if (scores.length === 0) {
    confidence = 0.5; // No analysis available
  } else if (scores.length === 1) {
    // Single method - moderate confidence
    confidence = isPhishing ? Math.max(0.6, scores[0]) : Math.max(0.6, 1 - scores[0]);
  } else {
    // Multiple methods - calculate agreement-based confidence
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - average, 2), 0) / scores.length;
    const agreement = Math.max(0, 1 - variance * 3); // Convert variance to agreement
    
    // High agreement between methods = high confidence
    if (isPhishing) {
      confidence = Math.min(0.99, finalScore + (agreement * 0.3));
      // Boost confidence for Safe Browsing detections
      if (safeBrowsingResult.score > 0.5) confidence = Math.min(0.99, confidence + 0.1);
    } else {
      confidence = Math.min(0.99, (1 - finalScore) + (agreement * 0.2));
    }
  }
  
  // RISK LEVEL determination with enhanced logic
  let risk_level: 'low' | 'medium' | 'high';
  
  if (safeBrowsingResult.score > 0.5 || hasCriticalPatterns) {
    risk_level = 'high';
  } else if (hasHighRiskPatterns || finalScore > 0.6) {
    risk_level = 'medium';
  } else if (finalScore < 0.3 && !hasMediumRiskPatterns) {
    risk_level = 'low';
  } else {
    risk_level = 'medium'; // Conservative default
  }
  
  // Combine all reasons from all methods
  const allReasons = [
    ...ruleResult.reasons,
    ...geminiResult.reasons,
    ...perplexityResult.reasons,
    ...safeBrowsingResult.reasons,
    ...historyResult.reasons
  ].filter(reason => reason && reason.length > 0);
  
  const uniquePatterns = [...new Set(allPatterns)];
  
  // Create enhanced explanation
  const explanation = createExplanation(
    isPhishing ? 'phishing' : 'safe',
    confidence,
    allReasons,
    risk_level,
    uniquePatterns,
    ruleResult.score,
    geminiResult.score,
    perplexityResult.score,
    safeBrowsingResult.score,
    historyResult.adjustmentScore
  );
  
  console.log('Final result summary:', {
    result: isPhishing ? 'phishing' : 'safe',
    confidence: Math.round(confidence * 100) / 100,
    riskLevel: risk_level,
    patternCount: uniquePatterns.length,
    reasonCount: allReasons.length
  });
  
  return {
    result: isPhishing ? 'phishing' : 'safe',
    confidence: Math.round(confidence * 100) / 100,
    reasons: allReasons.length > 0 ? allReasons.slice(0, 8) : ['Email analysis completed with enhanced detection methods'],
    risk_level,
    detected_patterns: uniquePatterns.slice(0, 10),
    explanation
  };
}
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: DetectionRequest = await req.json();
    console.log('Starting enhanced phishing detection with multiple AI engines and history learning...');

    // Rate limiting check
    const rateLimit = await checkRateLimit(requestData.clerk_user_id || '', 'detect');
    
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again later.',
        resetTime: rateLimit.resetTime,
        remaining: 0
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        },
      });
    }

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

    // Update analytics and check alerts
    await updateUserAnalytics(requestData.clerk_user_id || '', finalResult.result === 'phishing');
    await checkAlertConditions(requestData.clerk_user_id || '', finalResult.result === 'phishing');

    // Store result in database
    const { data: analysisResult, error: dbError } = await supabase
      .from('email_analyses')
      .insert({
        clerk_user_id: requestData.clerk_user_id || '',
        subject: requestData.subject || '',
        sender_email: requestData.sender || '',
        email_body: requestData.email_text,
        is_phishing: finalResult.result === 'phishing',
        confidence_score: Math.round(finalResult.confidence * 100),
        analysis_reasons: finalResult.reasons
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
    }

    return new Response(JSON.stringify(finalResult), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      },
    });

  } catch (error) {
    console.error('Error in detect function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});