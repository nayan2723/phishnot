-- Drop the user_profiles table and update other tables to reference Clerk user IDs directly
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Update uploaded_files table to reference Clerk user ID directly
ALTER TABLE public.uploaded_files 
DROP CONSTRAINT uploaded_files_user_id_fkey,
DROP COLUMN user_id,
ADD COLUMN clerk_user_id TEXT NOT NULL;

-- Update email_analyses table to reference Clerk user ID directly  
ALTER TABLE public.email_analyses
DROP CONSTRAINT email_analyses_user_id_fkey,
DROP COLUMN user_id,
ADD COLUMN clerk_user_id TEXT NOT NULL;

-- Update RLS policies for uploaded_files
DROP POLICY IF EXISTS "Users can view their own files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can create their own files" ON public.uploaded_files;

CREATE POLICY "Users can view their own files" 
ON public.uploaded_files 
FOR SELECT 
USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can create their own files" 
ON public.uploaded_files 
FOR INSERT 
WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- Update RLS policies for email_analyses
DROP POLICY IF EXISTS "Users can view their own analyses" ON public.email_analyses;
DROP POLICY IF EXISTS "Users can create their own analyses" ON public.email_analyses;

CREATE POLICY "Users can view their own analyses" 
ON public.email_analyses 
FOR SELECT 
USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can create their own analyses" 
ON public.email_analyses 
FOR INSERT 
WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- Update indexes
DROP INDEX IF EXISTS idx_uploaded_files_user_id;
DROP INDEX IF EXISTS idx_email_analyses_user_id;

CREATE INDEX idx_uploaded_files_clerk_user_id ON public.uploaded_files(clerk_user_id);
CREATE INDEX idx_email_analyses_clerk_user_id ON public.email_analyses(clerk_user_id);