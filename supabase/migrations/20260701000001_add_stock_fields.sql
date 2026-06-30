-- Add stock fields and dosage quantity to medications table
ALTER TABLE public.medications 
ADD COLUMN IF NOT EXISTS total_stock INTEGER,
ADD COLUMN IF NOT EXISTS remaining_stock INTEGER,
ADD COLUMN IF NOT EXISTS dosage_quantity INTEGER DEFAULT 1;

-- Create function to auto-decrement stock when log is marked as taken
CREATE OR REPLACE FUNCTION public.handle_medication_log_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_qty INTEGER;
    v_total INTEGER;
BEGIN
    -- Query the dosage_quantity and total_stock for this medication
    SELECT COALESCE(dosage_quantity, 1), total_stock INTO v_qty, v_total
    FROM public.medications
    WHERE id = NEW.medication_id;

    -- If status changes to taken, decrement remaining_stock
    IF NEW.status = 'taken' AND (OLD.status IS NULL OR OLD.status != 'taken') THEN
        UPDATE public.medications
        SET remaining_stock = GREATEST(0, remaining_stock - v_qty)
        WHERE id = NEW.medication_id AND remaining_stock IS NOT NULL;
    -- If status changes from taken to something else (e.g. reverted to scheduled/missed), increment remaining_stock
    ELSIF NEW.status != 'taken' AND OLD.status = 'taken' THEN
        UPDATE public.medications
        SET remaining_stock = LEAST(COALESCE(v_total, 100), remaining_stock + v_qty)
        WHERE id = NEW.medication_id AND remaining_stock IS NOT NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on medication_logs
DROP TRIGGER IF EXISTS on_medication_log_status_change ON public.medication_logs;
CREATE TRIGGER on_medication_log_status_change
    AFTER INSERT OR UPDATE ON public.medication_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_medication_log_status_change();
