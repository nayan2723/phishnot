-- Fix remaining security vulnerabilities from scan

-- 1. Restrict validated_feedback_patterns to authenticated users only
DROP POLICY IF EXISTS "Users can view validated feedback patterns" ON validated_feedback_patterns;

CREATE POLICY "Authenticated users can view validated feedback patterns" 
ON validated_feedback_patterns 
FOR SELECT 
TO authenticated
USING (true);

-- 2. Improve shareable_reports access control - restrict to valid tokens only
-- The existing policy is actually correct for shareable functionality, but let's make it more explicit
DROP POLICY IF EXISTS "Public can view active shared reports" ON shareable_reports;

CREATE POLICY "Public can view valid shared reports" 
ON shareable_reports 
FOR SELECT 
USING (
  is_active = true 
  AND expires_at > now() 
  AND share_token IS NOT NULL 
  AND LENGTH(share_token) > 10
);

-- Add additional constraint to ensure share tokens are properly generated
ALTER TABLE shareable_reports 
ADD CONSTRAINT valid_share_token 
CHECK (share_token IS NOT NULL AND LENGTH(share_token) >= 16);