-- Create table for user feedback to enable history-based learning
CREATE TABLE public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  analysis_id UUID REFERENCES public.email_analyses(id),
  original_result TEXT NOT NULL, -- 'phishing' or 'safe'
  user_feedback TEXT NOT NULL, -- 'correct' or 'incorrect'
  feedback_reason TEXT, -- Optional reason why user disagrees
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for user feedback
CREATE POLICY "Users can view their own feedback" 
ON public.user_feedback 
FOR SELECT 
USING (auth.uid()::text = clerk_user_id);

CREATE POLICY "Users can create their own feedback" 
ON public.user_feedback 
FOR INSERT 
WITH CHECK (auth.uid()::text = clerk_user_id);

-- Create trigger for timestamp updates
CREATE TRIGGER update_user_feedback_updated_at
BEFORE UPDATE ON public.user_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_user_feedback_user_id ON public.user_feedback(clerk_user_id);
CREATE INDEX idx_user_feedback_created_at ON public.user_feedback(created_at);

-- Create table for URL reputation tracking
CREATE TABLE public.url_reputation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url_domain TEXT NOT NULL UNIQUE,
  reputation_score FLOAT NOT NULL DEFAULT 0.5, -- 0=safe, 1=malicious
  safe_browsing_status TEXT, -- 'safe', 'phishing', 'malware', 'unwanted'
  last_checked TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  check_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (this data can be shared across users)
ALTER TABLE public.url_reputation ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read
CREATE POLICY "Authenticated users can read URL reputation" 
ON public.url_reputation 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create policy to allow system updates (for API updates)
CREATE POLICY "System can update URL reputation" 
ON public.url_reputation 
FOR ALL 
USING (true);

-- Create trigger for timestamp updates
CREATE TRIGGER update_url_reputation_updated_at
BEFORE UPDATE ON public.url_reputation
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_url_reputation_domain ON public.url_reputation(url_domain);
CREATE INDEX idx_url_reputation_last_checked ON public.url_reputation(last_checked);