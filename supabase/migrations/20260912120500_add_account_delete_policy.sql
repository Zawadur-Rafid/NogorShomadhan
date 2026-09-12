CREATE POLICY "Enable delete for public" ON "public"."account"
AS PERMISSIVE FOR DELETE
TO public
USING (true);
