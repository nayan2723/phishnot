import { z } from 'zod';

// Email validation schema
export const emailSchema = z.object({
  senderEmail: z
    .string()
    .min(1, "Sender email is required")
    .email("Please enter a valid email address")
    .max(254, "Email address is too long"),
  subject: z
    .string()
    .min(1, "Subject line is required")
    .max(998, "Subject line is too long"), // RFC 5322 limit
  emailBody: z
    .string()
    .min(1, "Email body is required")
    .max(10000, "Email body is too long") // Reasonable limit for email content
});

// File validation constants
export const ALLOWED_FILE_TYPES = ['.eml', '.txt', '.msg'] as const;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const validateFile = (file: File) => {
  const errors: string[] = [];
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }
  
  // Check file type by extension
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_FILE_TYPES.includes(fileExtension as any)) {
    errors.push(`File type not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`);
  }
  
  // Check for suspicious file names
  const suspiciousPatterns = [
    /[<>:"|?*]/,  // Windows forbidden characters
    /^\./,        // Hidden files
    /\.\./,       // Directory traversal
    /\s{2,}/,     // Multiple spaces
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    errors.push('File name contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitize input text to prevent basic XSS
export const sanitizeText = (text: string): string => {
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

export type EmailFormData = z.infer<typeof emailSchema>;