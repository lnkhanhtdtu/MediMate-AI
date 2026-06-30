-- SQL Schema for MediMate AI
-- Initial migration

-- 1. Create Medications Table
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    schedule JSONB NOT NULL DEFAULT '[]'::jsonb, -- e.g., ["08:00", "20:00"]
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

CREATE POLICY "Users can insert their own medication logs" 
    ON public.medication_logs 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medication logs" 
    ON public.medication_logs 
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medication logs" 
    ON public.medication_logs 
    FOR DELETE 
    USING (auth.uid() = user_id);
