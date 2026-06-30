-- Add stock fields to medications table
ALTER TABLE public.medications 
ADD COLUMN IF NOT EXISTS total_stock INTEGER,
ADD COLUMN IF NOT EXISTS remaining_stock INTEGER;

-- Create function to auto-decrement stock when log is marked as taken
CREATE OR REPLACE FUNCTION public.handle_medication_log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changes to taken, decrement remaining_stock
    IF NEW.status = 'taken' AND (OLD.status IS NULL OR OLD.status != 'taken') THEN
        UPDATE public.medications
        SET remaining_stock = GREATEST(0, remaining_stock - 1)
        WHERE id = NEW.medication_id AND remaining_stock IS NOT NULL;
    -- If status changes from taken to something else (e.g. reverted to scheduled/missed), increment remaining_stock
    ELSIF NEW.status != 'taken' AND OLD.status = 'taken' THEN
        UPDATE public.medications
        SET remaining_stock = LEAST(total_stock, remaining_stock + 1)
        WHERE id = NEW.medication_id AND remaining_stock IS NOT NULL AND total_stock IS NOT NULL;
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
