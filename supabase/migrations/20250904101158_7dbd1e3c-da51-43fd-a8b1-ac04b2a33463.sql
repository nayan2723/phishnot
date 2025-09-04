-- Fix critical security vulnerability: User Analytics and Rate Limiting Data Exposed to Public

-- Ensure RLS is enabled on both tables
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive policies and create restrictive ones
DROP POLICY IF EXISTS "Users can view their own analytics" ON public.user_analytics;
DROP POLICY IF EXISTS "Service role can manage analytics" ON public.user_analytics;
DROP POLICY IF EXISTS "Users can view their own rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;

-- Create restrictive policies for user_analytics table
-- Deny all public access
CREATE POLICY "Deny public access to user analytics" 
ON public.user_analytics 
FOR ALL 
TO public 
USING (false);

-- Allow authenticated users to view only their own analytics
CREATE POLICY "Authenticated users view own analytics only" 
ON public.user_analytics 
FOR SELECT 
TO authenticated 
USING (clerk_user_id = (auth.uid())::text);

-- Allow service role full access for system operations
CREATE POLICY "Service role full analytics access" 
ON public.user_analytics 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create restrictive policies for rate_limits table
-- Deny all public access
CREATE POLICY "Deny public access to rate limits" 
ON public.rate_limits 
FOR ALL 
TO public 
USING (false);

-- Allow authenticated users to view only their own rate limits
CREATE POLICY "Authenticated users view own rate limits only" 
ON public.rate_limits 
FOR SELECT 
TO authenticated 
USING (clerk_user_id = (auth.uid())::text);

-- Allow service role full access for system operations
CREATE POLICY "Service role full rate limits access" 
ON public.rate_limits 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);