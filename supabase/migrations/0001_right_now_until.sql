-- Surge — Phase 0: Right Now signal becomes a first-class column.
-- Previously "Right Now" was derived from a `looking_for` value; the UI and
-- feed now read this timestamp instead. Additive only — safe to apply before
-- the frontend deploy that references it.
ALTER TABLE surge_users
  ADD COLUMN IF NOT EXISTS right_now_until timestamptz;