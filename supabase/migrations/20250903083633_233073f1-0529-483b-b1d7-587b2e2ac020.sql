-- PHASE 1: EMERGENCY DATA PROTECTION - Fix Email Analysis Data Exposure
-- Remove the overly permissive policy and add proper user-specific access
DROP POLICY IF EXISTS "Allow service role full access to email_analyses" ON email_analyses;

-- Add proper RLS policy for email analyses
CREATE POLICY "Users can only access their own email analyses" 
ON email_analyses 
FOR ALL 
USING (clerk_user_id = (auth.uid())::text)
WITH CHECK (clerk_user_id = (auth.uid())::text);

-- Fix uploaded_files table - similar issue
DROP POLICY IF EXISTS "Allow service role full access to uploaded_files" ON uploaded_files;

CREATE POLICY "Users can only access their own uploaded files" 
ON uploaded_files 
FOR ALL 
USING (clerk_user_id = (auth.uid())::text)
WITH CHECK (clerk_user_id = (auth.uid())::text);

-- Service role still needs access for edge functions
CREATE POLICY "Service role can access all email analyses" 
ON email_analyses 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can access all uploaded files" 
ON uploaded_files 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);