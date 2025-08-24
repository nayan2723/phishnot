-- Create user profiles table to store additional user data
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create uploaded files table to store file metadata
CREATE TABLE public.uploaded_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_content TEXT, -- Store file content as text for analysis
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email analyses table to store email data and scan results
CREATE TABLE public.email_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  uploaded_file_id UUID REFERENCES public.uploaded_files(id) ON DELETE SET NULL,
  sender_email TEXT,
  subject TEXT,
  email_body TEXT,
  is_phishing BOOLEAN,
  confidence_score INTEGER,
  analysis_reasons TEXT[],
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can create their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Create RLS policies for uploaded_files
CREATE POLICY "Users can view their own files" 
ON public.uploaded_files 
FOR SELECT 
USING (user_id IN (
  SELECT id FROM public.user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
));

CREATE POLICY "Users can create their own files" 
ON public.uploaded_files 
FOR INSERT 
WITH CHECK (user_id IN (
  SELECT id FROM public.user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
));

-- Create RLS policies for email_analyses
CREATE POLICY "Users can view their own analyses" 
ON public.email_analyses 
FOR SELECT 
USING (user_id IN (
  SELECT id FROM public.user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
));

CREATE POLICY "Users can create their own analyses" 
ON public.email_analyses 
FOR INSERT 
WITH CHECK (user_id IN (
  SELECT id FROM public.user_profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_clerk_user_id ON public.user_profiles(clerk_user_id);
CREATE INDEX idx_uploaded_files_user_id ON public.uploaded_files(user_id);
CREATE INDEX idx_email_analyses_user_id ON public.email_analyses(user_id);
CREATE INDEX idx_email_analyses_analyzed_at ON public.email_analyses(analyzed_at);