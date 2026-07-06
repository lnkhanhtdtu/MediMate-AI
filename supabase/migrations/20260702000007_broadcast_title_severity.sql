-- ============================================================================
-- Add structured title + severity to broadcasts so the client can render the
-- announcement banner with a severity-appropriate colour and icon (instead of
-- flattening everything into the message string).
-- ============================================================================
alter table public.broadcasts
  add column if not exists title text,
  add column if not exists severity text not null default 'info'
    check (severity in ('info', 'warning', 'urgent'));
