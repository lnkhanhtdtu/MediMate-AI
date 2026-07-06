-- Prevent duplicate daily logs and, more importantly, provide the unique
-- constraint that the app's log-generation upsert targets.
--
-- The application generates each day's medication_logs with:
--   upsert(rows, { onConflict: 'medication_id,scheduled_time', ignoreDuplicates: true })
-- Postgres requires a matching UNIQUE constraint/index for that ON CONFLICT
-- target. This index existed in the consolidated schema.sql but was never
-- shipped as a migration, so any database set up via migrations (00 -> 07)
-- was missing it — every log insert then failed with 42P10 and no doses were
-- ever scheduled for the day. This migration closes that gap.
--
-- If pre-existing duplicate (medication_id, scheduled_time) rows exist, dedupe
-- them first (keep the most advanced status, then the earliest row) so the
-- unique index can be created.
DELETE FROM public.medication_logs a
USING public.medication_logs b
WHERE a.medication_id = b.medication_id
  AND a.scheduled_time = b.scheduled_time
  AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_medication_logs_med_time
    ON public.medication_logs (medication_id, scheduled_time);
