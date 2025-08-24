import { supabase } from "@/integrations/supabase/client";

export interface UploadedFile {
  id: string;
  clerk_user_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  file_content?: string;
  upload_date: string;
}

export interface EmailAnalysis {
  id: string;
  clerk_user_id: string;
  uploaded_file_id?: string;
  sender_email?: string;
  subject?: string;
  email_body?: string;
  is_phishing?: boolean;
  confidence_score?: number;
  analysis_reasons?: string[];
  analyzed_at: string;
}

// Save uploaded file
export const saveUploadedFile = async (
  clerkUserId: string,
  file: File,
  content?: string
) => {
  try {
    const { data, error } = await supabase
      .from('uploaded_files')
      .insert({
        clerk_user_id: clerkUserId,
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
  clerkUserId: string,
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
        clerk_user_id: clerkUserId,
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
export const getUserAnalyses = async (clerkUserId: string) => {
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
      .eq('clerk_user_id', clerkUserId)
      .order('analyzed_at', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Get user's uploaded files
export const getUserFiles = async (clerkUserId: string) => {
  try {
    const { data, error } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
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