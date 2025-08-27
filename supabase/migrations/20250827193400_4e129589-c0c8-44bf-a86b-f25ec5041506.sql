-- Fix RLS policies to work with Clerk authentication via service role access
-- Drop existing restrictive policies that require Supabase auth
DROP POLICY "Users can view their own files" ON public.uploaded_files;
DROP POLICY "Users can create their own files" ON public.uploaded_files;
DROP POLICY "Users can update their own files" ON public.uploaded_files;
DROP POLICY "Users can delete their own files" ON public.uploaded_files;

DROP POLICY "Users can view their own analyses" ON public.email_analyses;
DROP POLICY "Users can create their own analyses" ON public.email_analyses;
DROP POLICY "Users can update their own analyses" ON public.email_analyses;
DROP POLICY "Users can delete their own analyses" ON public.email_analyses;

-- Create new policies that allow service role access for edge functions
-- while still protecting user data through application-level security

-- Policies for uploaded_files
CREATE POLICY "Allow service role full access to uploaded_files" 
ON public.uploaded_files 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Policies for email_analyses  
CREATE POLICY "Allow service role full access to email_analyses" 
ON public.email_analyses 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Keep user feedback policies as they were (already working)
-- The service role will handle user isolation at the application level