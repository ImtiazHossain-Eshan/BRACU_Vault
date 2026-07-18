-- Demo data for testing the admin dashboard: a verified student + sample uploads
-- (pending ones land in the moderation queue). Idempotent.

INSERT OR IGNORE INTO users (id, clerk_user_id, email, status, email_verified_at, created_at)
VALUES ('demo-user-0001', 'demo_clerk_0001', 'demo.student@g.bracu.ac.bd', 'verified', strftime('%s','now'), strftime('%s','now'));

INSERT OR IGNORE INTO user_roles (user_id, role_id, granted_at)
VALUES ('demo-user-0001', 'verified_student', strftime('%s','now'));

INSERT OR IGNORE INTO uploads (id, user_id, r2_key, filename, mime, size, status, course, created_at) VALUES
 ('demo-up-0001', 'demo-user-0001', 'uploads/demo/0001-cse110-notes.pdf', 'CSE110 Final Notes.pdf', 'application/pdf', 1843200, 'pending', 'CSE 110', strftime('%s','now')),
 ('demo-up-0002', 'demo-user-0001', 'uploads/demo/0002-cse220-labs.zip', 'CSE220 Lab Solutions.zip', 'application/zip', 5242880, 'pending', 'CSE 220', strftime('%s','now')),
 ('demo-up-0003', 'demo-user-0001', 'uploads/demo/0003-cse370-er.png',  'CSE370 ER Diagram.png',  'image/png',       460800, 'approved', 'CSE 370', strftime('%s','now'));
