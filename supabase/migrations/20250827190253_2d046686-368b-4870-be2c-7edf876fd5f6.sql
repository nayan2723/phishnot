-- Update RLS policies to work with Clerk authentication
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can create their own files" ON uploaded_files;
DROP POLICY IF EXISTS "Users can view their own analyses" ON email_analyses;
DROP POLICY IF EXISTS "Users can create their own analyses" ON email_analyses;

-- Create new policies that work with direct clerk_user_id comparison
-- For uploaded_files table
CREATE POLICY "Users can view their own files"
ON uploaded_files
FOR SELECT
USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can create their own files"
ON uploaded_files
FOR INSERT
WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- For email_analyses table  
CREATE POLICY "Users can view their own analyses"
ON email_analyses
FOR SELECT
USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can create their own analyses"
ON email_analyses
FOR INSERT
WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Also add UPDATE and DELETE policies for better functionality
CREATE POLICY "Users can update their own files"
ON uploaded_files
FOR UPDATE
USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete their own files"
ON uploaded_files
FOR DELETE
USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own analyses"
ON email_analyses
FOR UPDATE
USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete their own analyses"
ON email_analyses
FOR DELETE
USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');