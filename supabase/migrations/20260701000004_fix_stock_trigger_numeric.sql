-- Fix stock trigger variables to use NUMERIC instead of INTEGER to prevent decimal rounding
CREATE OR REPLACE FUNCTION public.handle_medication_log_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_qty NUMERIC;
    v_total NUMERIC;
BEGIN
    -- Query the dosage_quantity and total_stock for this medication
    SELECT COALESCE(dosage_quantity, 1.0), total_stock INTO v_qty, v_total
    FROM public.medications
    WHERE id = NEW.medication_id;

    -- If status changes to taken, decrement remaining_stock
    IF NEW.status = 'taken' AND (OLD.status IS NULL OR OLD.status != 'taken') THEN
        UPDATE public.medications
        SET remaining_stock = GREATEST(0.0, remaining_stock - v_qty)
        WHERE id = NEW.medication_id AND remaining_stock IS NOT NULL;
    -- If status changes from taken to something else (reverted), increment remaining_stock
    ELSIF NEW.status != 'taken' AND OLD.status = 'taken' THEN
        UPDATE public.medications
        SET remaining_stock = LEAST(COALESCE(v_total, 100.0), remaining_stock + v_qty)
        WHERE id = NEW.medication_id AND remaining_stock IS NOT NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
