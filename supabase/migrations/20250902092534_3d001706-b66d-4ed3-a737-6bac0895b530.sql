-- Create table for validated feedback patterns
CREATE TABLE IF NOT EXISTS public.validated_feedback_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_type TEXT NOT NULL,
  pattern_value TEXT NOT NULL,
  feedback_count INTEGER DEFAULT 1,
  confidence_boost FLOAT DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user feedback quality tracking
CREATE TABLE IF NOT EXISTS public.user_feedback_quality (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  correct_feedback_count INTEGER DEFAULT 0,
  incorrect_feedback_count INTEGER DEFAULT 0,
  reputation_score FLOAT DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(clerk_user_id)
);

-- Enable RLS
ALTER TABLE public.validated_feedback_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback_quality ENABLE ROW LEVEL SECURITY;

-- Create policies for validated_feedback_patterns (read-only for users, full access for service role)
CREATE POLICY "Users can view validated feedback patterns" 
ON public.validated_feedback_patterns 
FOR SELECT 
USING (true);

-- Create policies for user_feedback_quality 
CREATE POLICY "Users can view their own feedback quality" 
ON public.user_feedback_quality 
FOR SELECT 
USING (auth.uid()::text = clerk_user_id);

CREATE POLICY "Users can update their own feedback quality" 
ON public.user_feedback_quality 
FOR UPDATE 
USING (auth.uid()::text = clerk_user_id);

-- Create triggers for timestamps
CREATE TRIGGER update_validated_feedback_patterns_updated_at
BEFORE UPDATE ON public.validated_feedback_patterns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_feedback_quality_updated_at
BEFORE UPDATE ON public.user_feedback_quality
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();