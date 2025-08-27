-- Rate Limiting Tables
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  requests_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  window_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(clerk_user_id, endpoint, window_start)
);

-- User Analytics Table
CREATE TABLE public.user_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  total_scans INTEGER NOT NULL DEFAULT 0,
  phishing_detected INTEGER NOT NULL DEFAULT 0,
  safe_emails INTEGER NOT NULL DEFAULT 0,
  last_scan_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(clerk_user_id)
);

-- Shareable Reports Table
CREATE TABLE public.shareable_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL,
  share_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- User Notification Preferences
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  email_alerts BOOLEAN NOT NULL DEFAULT true,
  phishing_threshold INTEGER NOT NULL DEFAULT 3,
  alert_frequency TEXT NOT NULL DEFAULT 'immediate',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Alert History
CREATE TABLE public.user_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shareable_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rate_limits
CREATE POLICY "Users can view their own rate limits" 
ON public.rate_limits 
FOR SELECT 
USING ((auth.uid())::text = clerk_user_id);

CREATE POLICY "Service role can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (true);

-- RLS Policies for user_analytics
CREATE POLICY "Users can view their own analytics" 
ON public.user_analytics 
FOR SELECT 
USING ((auth.uid())::text = clerk_user_id);

CREATE POLICY "Service role can manage analytics" 
ON public.user_analytics 
FOR ALL 
USING (true);

-- RLS Policies for shareable_reports
CREATE POLICY "Public can view active shared reports" 
ON public.shareable_reports 
FOR SELECT 
USING (is_active = true AND expires_at > now());

CREATE POLICY "Service role can manage shared reports" 
ON public.shareable_reports 
FOR ALL 
USING (true);

-- RLS Policies for notification_preferences
CREATE POLICY "Users can manage their notification preferences" 
ON public.notification_preferences 
FOR ALL 
USING ((auth.uid())::text = clerk_user_id);

-- RLS Policies for user_alerts
CREATE POLICY "Users can view their own alerts" 
ON public.user_alerts 
FOR SELECT 
USING ((auth.uid())::text = clerk_user_id);

CREATE POLICY "Users can update their own alerts" 
ON public.user_alerts 
FOR UPDATE 
USING ((auth.uid())::text = clerk_user_id);

CREATE POLICY "Service role can create alerts" 
ON public.user_alerts 
FOR INSERT 
WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_rate_limits_updated_at
BEFORE UPDATE ON public.rate_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_analytics_updated_at
BEFORE UPDATE ON public.user_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_rate_limits_user_endpoint ON public.rate_limits(clerk_user_id, endpoint);
CREATE INDEX idx_rate_limits_window ON public.rate_limits(window_start, window_end);
CREATE INDEX idx_shareable_reports_token ON public.shareable_reports(share_token);
CREATE INDEX idx_shareable_reports_expires ON public.shareable_reports(expires_at, is_active);
CREATE INDEX idx_user_alerts_user_read ON public.user_alerts(clerk_user_id, read_at);