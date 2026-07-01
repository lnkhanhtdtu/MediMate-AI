-- Drop the old loose insert policy for medication logs
DROP POLICY IF EXISTS "Users can insert their own medication logs" ON public.medication_logs;

-- Re-create a tightened RLS insert policy enforcing that the referenced medication also belongs to the authenticated user
CREATE POLICY "Users can insert their own medication logs referencing their own medications"
    ON public.medication_logs
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.medications
            WHERE id = medication_id AND user_id = auth.uid()
        )
    );
