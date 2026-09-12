-- Allow the current anonymous-client admin flow to save duplicate decisions.
-- This permissive policy is intended for the university demo architecture.

ALTER TABLE duplicate ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS duplicate_review_update_public ON duplicate;

CREATE POLICY duplicate_review_update_public
    ON duplicate
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);
