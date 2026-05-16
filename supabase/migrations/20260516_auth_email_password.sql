-- Add auth_user_id column to trainers table
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id);

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS trainers_auth_user_id_idx ON trainers(auth_user_id);

-- Enable RLS on trainers (if not already enabled)
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;

-- Policy: trainers can read their own row
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'trainers' AND policyname = 'trainers_select_own'
  ) THEN
    CREATE POLICY "trainers_select_own"
      ON trainers FOR SELECT
      USING (auth.uid() = auth_user_id);
  END IF;
END $$;

-- Policy: trainers can update their own row
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'trainers' AND policyname = 'trainers_update_own'
  ) THEN
    CREATE POLICY "trainers_update_own"
      ON trainers FOR UPDATE
      USING (auth.uid() = auth_user_id);
  END IF;
END $$;

-- Policy: allow insert during registration (auth_user_id must match)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'trainers' AND policyname = 'trainers_insert_own'
  ) THEN
    CREATE POLICY "trainers_insert_own"
      ON trainers FOR INSERT
      WITH CHECK (auth.uid() = auth_user_id);
  END IF;
END $$;
