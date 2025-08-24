import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  clerk_user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadedFile {
  id: string;
  user_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  file_content?: string;
  upload_date: string;
}

export interface EmailAnalysis {
  id: string;
  user_id: string;
  uploaded_file_id?: string;
  sender_email?: string;
  subject?: string;
  email_body?: string;
  is_phishing?: boolean;
  confidence_score?: number;
  analysis_reasons?: string[];
  analyzed_at: string;
}

// Create or get user profile
export const createOrGetUserProfile = async (clerkUserId: string, email: string, firstName?: string, lastName?: string) => {
  try {
    // First try to get existing profile
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (existingProfile) {
      return { data: existingProfile, error: null };
    }

    // Create new profile if doesn't exist
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        clerk_user_id: clerkUserId,
        email,
        first_name: firstName,
        last_name: lastName
      })
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Save uploaded file
export const saveUploadedFile = async (
  userId: string,
  file: File,
  content?: string
) => {
  try {
    const { data, error } = await supabase
      .from('uploaded_files')
      .insert({
        user_id: userId,
        filename: file.name,
        file_type: file.type || 'text/plain',
        file_size: file.size,
        file_content: content
      })
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Save email analysis
export const saveEmailAnalysis = async (
  userId: string,
  analysis: {
    uploadedFileId?: string;
    senderEmail?: string;
    subject?: string;
    emailBody?: string;
    isPhishing?: boolean;
    confidenceScore?: number;
    analysisReasons?: string[];
  }
) => {
  try {
    const { data, error } = await supabase
      .from('email_analyses')
      .insert({
        user_id: userId,
        uploaded_file_id: analysis.uploadedFileId,
        sender_email: analysis.senderEmail,
        subject: analysis.subject,
        email_body: analysis.emailBody,
        is_phishing: analysis.isPhishing,
        confidence_score: analysis.confidenceScore,
        analysis_reasons: analysis.analysisReasons
      })
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Get user's email analyses
export const getUserAnalyses = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('email_analyses')
      .select(`
        *,
        uploaded_files (
          filename,
          file_type,
          file_size
        )
      `)
      .eq('user_id', userId)
      .order('analyzed_at', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Get user's uploaded files
export const getUserFiles = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('user_id', userId)
      .order('upload_date', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Read file content helper
export const readFileContent = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};