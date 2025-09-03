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

interface FeedbackRequest {
  feedbackId: string;
  clerkUserId: string;
}

// Validate feedback quality based on user history and consistency
async function validateFeedback(clerkUserId: string, feedback: any) {
  console.log('Validating feedback for user:', clerkUserId);

  // Get user's feedback quality score
  const { data: userQuality } = await supabase
    .from('user_feedback_quality')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  let reputationScore = 0.5; // Default for new users
  if (userQuality) {
    const totalFeedback = userQuality.correct_feedback_count + userQuality.incorrect_feedback_count;
    if (totalFeedback > 0) {
      reputationScore = userQuality.correct_feedback_count / totalFeedback;
    }
  }

  console.log('User reputation score:', reputationScore);

  // Check for feedback consistency patterns
  const { data: recentFeedback } = await supabase
    .from('user_feedback')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .order('created_at', { ascending: false })
    .limit(10);

  let consistencyScore = 1.0;
  if (recentFeedback && recentFeedback.length > 3) {
    // Check for patterns that might indicate abuse
    const incorrectCount = recentFeedback.filter(f => f.user_feedback === 'incorrect').length;
    const recentIncorrectRatio = incorrectCount / recentFeedback.length;
    
    if (recentIncorrectRatio > 0.8) {
      consistencyScore = 0.3; // High incorrect ratio is suspicious
      console.log('High incorrect feedback ratio detected:', recentIncorrectRatio);
    }
  }

  // Validation score combines reputation and consistency
  const validationScore = (reputationScore * 0.7) + (consistencyScore * 0.3);
  console.log('Validation score:', validationScore);

  return {
    isValid: validationScore > 0.4,
    validationScore,
    reputationScore,
    consistencyScore
  };
}

// Extract learning patterns from validated feedback
async function extractLearningPatterns(feedback: any) {
  console.log('Extracting learning patterns from feedback');

  const patterns: any[] = [];

  // Extract sender domain patterns
  if (feedback.sender_email) {
    const domain = feedback.sender_email.split('@')[1];
    if (domain) {
      patterns.push({
        type: 'sender_domain',
        value: domain.toLowerCase(),
        feedback_type: feedback.user_feedback,
        original_result: feedback.original_result
      });
    }
  }

  // Extract subject patterns
  if (feedback.subject) {
    const lowercaseSubject = feedback.subject.toLowerCase();
    
    // Check for urgent words
    const urgentWords = ['urgent', 'immediate', 'action required', 'suspended', 'expires'];
    urgentWords.forEach(word => {
      if (lowercaseSubject.includes(word)) {
        patterns.push({
          type: 'subject_keyword',
          value: word,
          feedback_type: feedback.user_feedback,
          original_result: feedback.original_result
        });
      }
    });

    // Check for suspicious patterns
    const suspiciousPatterns = ['re:', 'fwd:', 'verify', 'confirm', 'click here'];
    suspiciousPatterns.forEach(pattern => {
      if (lowercaseSubject.includes(pattern)) {
        patterns.push({
          type: 'subject_pattern',
          value: pattern,
          feedback_type: feedback.user_feedback,
          original_result: feedback.original_result
        });
      }
    });
  }

  // Extract content patterns
  if (feedback.email_content) {
    const lowercaseContent = feedback.email_content.toLowerCase();
    
    // Check for phishing indicators
    const phishingIndicators = [
      'click here', 'verify account', 'suspended', 'expires today',
      'confirm identity', 'update information', 'login credentials'
    ];
    
    phishingIndicators.forEach(indicator => {
      if (lowercaseContent.includes(indicator)) {
        patterns.push({
          type: 'content_indicator',
          value: indicator,
          feedback_type: feedback.user_feedback,
          original_result: feedback.original_result
        });
      }
    });
  }

  console.log('Extracted patterns:', patterns.length);
  return patterns;
}

// Update validated patterns with feedback
async function updateValidatedPatterns(patterns: any[], validationScore: number) {
  console.log('Updating validated patterns with score:', validationScore);

  for (const pattern of patterns) {
    // Calculate confidence boost based on feedback type and validation score
    let confidenceBoost = 0;
    
    if (pattern.feedback_type === 'correct') {
      // Feedback confirms the original result - no change needed
      continue;
    } else if (pattern.feedback_type === 'incorrect') {
      // Feedback contradicts original result - adjust patterns
      if (pattern.original_result === 'phishing') {
        // False positive - reduce confidence for this pattern
        confidenceBoost = -0.1 * validationScore;
      } else {
        // False negative - increase confidence for this pattern
        confidenceBoost = 0.1 * validationScore;
      }
    }

    if (Math.abs(confidenceBoost) < 0.01) continue; // Skip minimal adjustments

    // Check if pattern already exists
    const { data: existing } = await supabase
      .from('validated_feedback_patterns')
      .select('*')
      .eq('pattern_type', pattern.type)
      .eq('pattern_value', pattern.value)
      .maybeSingle();

    if (existing) {
      // Update existing pattern
      const newFeedbackCount = existing.feedback_count + 1;
      const newConfidenceBoost = ((existing.confidence_boost * existing.feedback_count) + confidenceBoost) / newFeedbackCount;
      
      // Cap confidence boost to reasonable bounds
      const cappedBoost = Math.max(-0.5, Math.min(0.5, newConfidenceBoost));
      
      await supabase
        .from('validated_feedback_patterns')
        .update({
          feedback_count: newFeedbackCount,
          confidence_boost: cappedBoost
        })
        .eq('id', existing.id);
        
      console.log(`Updated pattern ${pattern.type}:${pattern.value} with boost ${cappedBoost}`);
    } else {
      // Create new pattern
      const cappedBoost = Math.max(-0.5, Math.min(0.5, confidenceBoost));
      
      await supabase
        .from('validated_feedback_patterns')
        .insert({
          pattern_type: pattern.type,
          pattern_value: pattern.value,
          feedback_count: 1,
          confidence_boost: cappedBoost
        });
        
      console.log(`Created new pattern ${pattern.type}:${pattern.value} with boost ${cappedBoost}`);
    }
  }
}

// Update user feedback quality tracking
async function updateUserQuality(clerkUserId: string, feedbackType: string, validationScore: number) {
  console.log('Updating user quality for:', clerkUserId);

  const { data: existing } = await supabase
    .from('user_feedback_quality')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  if (existing) {
    // Update existing record
    const correctCount = existing.correct_feedback_count + (feedbackType === 'correct' ? 1 : 0);
    const incorrectCount = existing.incorrect_feedback_count + (feedbackType === 'incorrect' ? 1 : 0);
    const totalCount = correctCount + incorrectCount;
    const newReputationScore = totalCount > 0 ? correctCount / totalCount : 0.5;

    await supabase
      .from('user_feedback_quality')
      .update({
        correct_feedback_count: correctCount,
        incorrect_feedback_count: incorrectCount,
        reputation_score: newReputationScore
      })
      .eq('clerk_user_id', clerkUserId);
  } else {
    // Create new record
    await supabase
      .from('user_feedback_quality')
      .insert({
        clerk_user_id: clerkUserId,
        correct_feedback_count: feedbackType === 'correct' ? 1 : 0,
        incorrect_feedback_count: feedbackType === 'incorrect' ? 1 : 0,
        reputation_score: 0.5
      });
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body with validation
    const { feedbackId, clerkUserId }: FeedbackRequest = await req.json();
    
    if (!feedbackId || !clerkUserId) {
      console.error('Missing required fields:', { feedbackId, clerkUserId });
      return new Response(
        JSON.stringify({ error: 'Missing feedbackId or clerkUserId' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify user authentication by checking if the user owns this feedback
    const { data: userCheck, error: userError } = await supabase
      .from('user_feedback')
      .select('clerk_user_id')
      .eq('id', feedbackId)
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userError || !userCheck) {
      console.error('User verification failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized or invalid feedback ID' }),
        { status: 403, headers: corsHeaders }
      );
    }

    console.log('Processing feedback:', feedbackId, 'for user:', clerkUserId);

    // Get the feedback record with related data
    const { data: feedback, error: feedbackError } = await supabase
      .from('user_feedback')
      .select(`
        *,
        email_analyses!left (
          sender_email,
          subject,
          email_body,
          is_phishing,
          confidence_score,
          analysis_reasons
        )
      `)
      .eq('id', feedbackId)
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (feedbackError || !feedback) {
      console.error('Feedback not found:', feedbackError);
      return new Response(JSON.stringify({ error: 'Feedback not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate the feedback
    const validation = await validateFeedback(clerkUserId, feedback);
    
    if (!validation.isValid) {
      console.log('Feedback validation failed with score:', validation.validationScore);
      return new Response(JSON.stringify({ 
        error: 'Feedback validation failed',
        validationScore: validation.validationScore 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Feedback validation passed with score:', validation.validationScore);

    // Extract learning patterns
    const patterns = await extractLearningPatterns(feedback);

    // Update validated patterns if we have them
    if (patterns.length > 0) {
      await updateValidatedPatterns(patterns, validation.validationScore);
    }

    // Update user quality tracking
    await updateUserQuality(clerkUserId, feedback.user_feedback, validation.validationScore);

    console.log('Feedback processing completed successfully');

    return new Response(JSON.stringify({ 
      success: true,
      patternsExtracted: patterns.length,
      validationScore: validation.validationScore
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing feedback:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});