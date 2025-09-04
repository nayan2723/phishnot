-- Fix critical security vulnerability: Email Analysis Reports Exposed to Anyone on Internet

-- Remove all public access policies from shareable_reports table
DROP POLICY IF EXISTS "Public can view valid shared reports" ON public.shareable_reports;
DROP POLICY IF EXISTS "Allow access to valid unexpired shared reports only" ON public.shareable_reports;
DROP POLICY IF EXISTS "Service role can manage shared reports" ON public.shareable_reports;

-- Deny all public access to shareable_reports table
CREATE POLICY "Deny all public access to shareable_reports" 
ON public.shareable_reports 
FOR ALL 
TO public 
USING (false);

-- Allow service role full access for edge functions to validate tokens securely
CREATE POLICY "Service role can manage shared reports securely" 
ON public.shareable_reports 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Optional: Allow authenticated users to view their own created shared reports
-- (This assumes we add a creator_user_id column in the future if needed)
-- For now, we'll rely on the service role access through edge functions only