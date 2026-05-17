-- PIN column is no longer required — email+password auth replaces PIN login
ALTER TABLE trainers ALTER COLUMN pin DROP NOT NULL;
