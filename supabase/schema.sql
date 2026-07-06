-- SQL Schema for MediMate AI
-- Run this in the Supabase SQL Editor

-- 1. Create Medications Table
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    schedule JSONB NOT NULL DEFAULT '[]'::jsonb, -- e.g., ["08:00", "20:00"]
    prescription_name TEXT,
    total_stock NUMERIC,
    remaining_stock NUMERIC,
    dosage_quantity NUMERIC DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- 2. Create Medication Logs Table
CREATE TABLE IF NOT EXISTS public.medication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
    scheduled_time TIMESTAMPTZ NOT NULL,
    taken_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('taken', 'missed', 'scheduled')) DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON public.medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_id ON public.medication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_medication_id ON public.medication_logs(medication_id);

-- 4. RLS Policies for Medications
CREATE POLICY "Users can view their own medications" 
    ON public.medications 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medications" 
    ON public.medications 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medications" 
    ON public.medications 
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medications" 
    ON public.medications 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- 5. RLS Policies for Medication Logs
CREATE POLICY "Users can view their own medication logs" 
    ON public.medication_logs 
    FOR SELECT 
    USING (auth.uid() = user_id);

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

CREATE POLICY "Users can update their own medication logs" 
    ON public.medication_logs 
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medication logs" 
    ON public.medication_logs 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- 6. Trigger to auto-decrement stock when log is marked as taken (NUMERIC-safe)
CREATE OR REPLACE FUNCTION public.handle_medication_log_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_qty NUMERIC;
    v_total NUMERIC;
BEGIN
    SELECT COALESCE(dosage_quantity, 1.0), total_stock INTO v_qty, v_total
    FROM public.medications
    WHERE id = NEW.medication_id;

    IF NEW.status = 'taken' AND (OLD.status IS NULL OR OLD.status != 'taken') THEN
        UPDATE public.medications
        SET remaining_stock = GREATEST(0.0, remaining_stock - v_qty)
        WHERE id = NEW.medication_id AND remaining_stock IS NOT NULL;
    ELSIF NEW.status != 'taken' AND OLD.status = 'taken' THEN
        UPDATE public.medications
        SET remaining_stock = LEAST(COALESCE(v_total, 100.0), remaining_stock + v_qty)
        WHERE id = NEW.medication_id AND remaining_stock IS NOT NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_medication_log_status_change ON public.medication_logs;
CREATE TRIGGER on_medication_log_status_change
    AFTER INSERT OR UPDATE ON public.medication_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_medication_log_status_change();

-- 7. Prevent duplicate daily logs (guards against a race where two concurrent
-- page loads both generate today's logs for the same medication + time).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_medication_logs_med_time
    ON public.medication_logs (medication_id, scheduled_time);

-- 8. Broadcasts: system-wide announcements sent by admins, visible to all users.
CREATE TABLE IF NOT EXISTS public.broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    title TEXT,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'urgent')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

-- Any authenticated user may READ broadcasts (to see the latest announcement banner).
DROP POLICY IF EXISTS "broadcasts_select_authenticated" ON public.broadcasts;
CREATE POLICY "broadcasts_select_authenticated"
    ON public.broadcasts
    FOR SELECT
    TO authenticated
    USING (true);

-- No INSERT/UPDATE/DELETE policy for normal users: broadcasts are created only through
-- the admin API using the service-role key (which bypasses RLS).
CREATE INDEX IF NOT EXISTS broadcasts_created_at_idx ON public.broadcasts (created_at DESC);
