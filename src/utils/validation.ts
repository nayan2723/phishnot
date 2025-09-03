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

// Enhanced XSS protection and input sanitization
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  // Limit input length to prevent DoS
  const maxLength = 10000;
  const truncated = text.length > maxLength ? text.substring(0, maxLength) : text;
  
  return truncated
    // HTML entity encoding for basic characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    // Remove dangerous protocols
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remove potentially dangerous HTML tags
    .replace(/<(script|iframe|object|embed|form|input|meta|link)[^>]*>/gi, '')
    // Clean up whitespace
    .trim();
};

// Sanitize HTML content more thoroughly
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') return '';
  
  // Remove all HTML tags except safe ones
  const allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br'];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^<>]*>/gi;
  
  return html.replace(tagRegex, (match, tagName) => {
    return allowedTags.includes(tagName.toLowerCase()) ? match : '';
  });
};

// Validate email addresses more strictly
export const validateEmailAddress = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  // Basic format check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) return false;
  
  // Additional security checks
  const suspiciousPatterns = [
    /[<>]/,                    // HTML tags
    /javascript:/i,            // JavaScript protocol
    /['"]/,                   // Quotes that might break out of attributes
    /\s/,                     // Whitespace
    /[\x00-\x1f\x7f-\x9f]/   // Control characters
  ];
  
  return !suspiciousPatterns.some(pattern => pattern.test(email));
};

export type EmailFormData = z.infer<typeof emailSchema>;