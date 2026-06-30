-- Alter total_stock, remaining_stock, and dosage_quantity columns to NUMERIC to support decimal and fractional dosages (e.g. 1/2 tablet = 0.5)
ALTER TABLE public.medications 
ALTER COLUMN total_stock TYPE NUMERIC,
ALTER COLUMN remaining_stock TYPE NUMERIC,
ALTER COLUMN dosage_quantity TYPE NUMERIC;
