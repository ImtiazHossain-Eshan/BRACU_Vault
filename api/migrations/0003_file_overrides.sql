-- Admin overrides for the STATIC archive files (the ones from vault-index.json,
-- which have no uploads row). Keyed by the vault path. Lets admins hide (delete)
-- or re-file/rename a preloaded file live, without a rebuild. Student uploads are
-- managed directly on the `uploads` row instead.
CREATE TABLE IF NOT EXISTS file_overrides (
  p          TEXT PRIMARY KEY,           -- vault-index path (archive file id)
  hidden     INTEGER NOT NULL DEFAULT 0, -- 1 = removed from the catalog
  name       TEXT,                       -- display-name override (null = original)
  course     TEXT,                       -- course override (null = original)
  section    TEXT,                       -- folder override (null = original)
  size       INTEGER,                    -- carried so re-filed files still render
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
