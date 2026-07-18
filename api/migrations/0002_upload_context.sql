-- Contextual uploads: record which course/folder a contribution targets, and
-- where the approved public copy lives in the files bucket (served at
-- files.bracuvault.me). Both nullable so existing rows are unaffected.
ALTER TABLE uploads ADD COLUMN section TEXT;
ALTER TABLE uploads ADD COLUMN public_key TEXT;
