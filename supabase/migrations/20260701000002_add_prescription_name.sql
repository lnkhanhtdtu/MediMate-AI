-- Add prescription_name to medications table to allow grouping of medications by prescription
ALTER TABLE public.medications 
ADD COLUMN IF NOT EXISTS prescription_name VARCHAR(255);
