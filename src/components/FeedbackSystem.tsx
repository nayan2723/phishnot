import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, MessageSquare, Send, CheckCircle } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FeedbackSystemProps {
  scanResult: {
    isPhishing: boolean;
    confidence: number;
    reasons: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
  emailData: {
    sender?: string;
    subject?: string;
    content: string;
  };
}

export const FeedbackSystem = ({ scanResult, emailData }: FeedbackSystemProps) => {
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();

  const handleFeedbackSubmission = async () => {
    if (!user || !feedbackType) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          clerk_user_id: user.id,
          original_result: scanResult.isPhishing ? 'phishing' : 'safe',
          user_feedback: feedbackType,
          feedback_reason: feedbackText || null,
          sender_email: emailData.sender,
          subject: emailData.subject,
          email_content: emailData.content.substring(0, 1000), // Limit content length
          confidence_score: scanResult.confidence,
          detected_patterns: scanResult.reasons
        });

      if (error) {
        console.error('Feedback submission error:', error);
        toast({
          variant: "destructive",
          title: "Feedback Error",
          description: "Failed to submit feedback. Please try again.",
        });
        return;
      }

      setIsSubmitted(true);
      toast({
        title: "Feedback Submitted",
        description: "Thank you! Your feedback helps improve our detection accuracy.",
      });

      // Reset form after successful submission
      setTimeout(() => {
        setFeedbackType(null);
        setFeedbackText("");
        setIsSubmitted(false);
      }, 3000);

    } catch (error) {
      console.error('Feedback submission error:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "An error occurred while submitting your feedback.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null; // Don't show feedback system for non-authenticated users
  }

  return (
    <Card className="mt-6 border-border/40 bg-background/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="w-5 h-5 text-primary" />
          Help Improve Accuracy
        </CardTitle>
        <CardDescription>
          Was this analysis correct? Your feedback helps train our AI to be more accurate.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-4"
            >
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
              <h3 className="text-lg font-medium text-success mb-2">Thank You!</h3>
              <p className="text-muted-foreground">
                Your feedback has been submitted and will help improve our detection system.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Current Analysis Summary */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Current Analysis:</span>
                  <Badge variant={scanResult.isPhishing ? "destructive" : "secondary"}>
                    {scanResult.isPhishing ? "Phishing" : "Safe"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Confidence: {scanResult.confidence}% | Risk: {scanResult.riskLevel}
                </div>
              </div>

              {/* Feedback Buttons */}
              <div className="flex gap-3">
                <Button
                  variant={feedbackType === 'correct' ? "default" : "outline"}
                  onClick={() => setFeedbackType('correct')}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Correct Analysis
                </Button>
                <Button
                  variant={feedbackType === 'incorrect' ? "destructive" : "outline"}
                  onClick={() => setFeedbackType('incorrect')}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Incorrect Analysis
                </Button>
              </div>

              {/* Additional Comments */}
              <AnimatePresence>
                {feedbackType && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <label className="block text-sm font-medium text-foreground">
                      {feedbackType === 'correct' 
                        ? "Additional comments (optional):" 
                        : "What did we get wrong? (helps us improve)"
                      }
                    </label>
                    <Textarea
                      placeholder={
                        feedbackType === 'correct'
                          ? "Any additional insights about this email..."
                          : "e.g., This is actually from a legitimate company, The sender is known to me, etc."
                      }
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      rows={3}
                      className="bg-input border-border/40"
                      disabled={isSubmitting}
                    />
                    
                    <Button
                      onClick={handleFeedbackSubmission}
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Feedback
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};