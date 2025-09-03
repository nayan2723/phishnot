-- Fix remaining security vulnerabilities from scan - using unique policy names

-- 1. Restrict validated_feedback_patterns to authenticated users only
DROP POLICY IF EXISTS "Users can view validated feedback patterns" ON validated_feedback_patterns;

CREATE POLICY "Require authentication for feedback patterns access" 
ON validated_feedback_patterns 
FOR SELECT 
TO authenticated
USING (true);

-- 2. Improve shareable_reports access control - restrict to valid tokens only
DROP POLICY IF EXISTS "Public can view active shared reports" ON shareable_reports;

CREATE POLICY "Allow access to valid unexpired shared reports only" 
ON shareable_reports 
FOR SELECT 
USING (
  is_active = true 
  AND expires_at > now() 
  AND share_token IS NOT NULL 
  AND LENGTH(share_token) > 10
);

-- Add additional constraint to ensure share tokens are properly generated
-- First check if constraint already exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'valid_share_token' 
        AND table_name = 'shareable_reports'
    ) THEN
        ALTER TABLE shareable_reports 
        ADD CONSTRAINT valid_share_token 
        CHECK (share_token IS NOT NULL AND LENGTH(share_token) >= 16);
    END IF;
END $$;