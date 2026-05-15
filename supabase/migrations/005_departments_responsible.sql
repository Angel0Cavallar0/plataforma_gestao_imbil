ALTER TABLE departments
  ADD COLUMN responsible_name text,
  ADD COLUMN responsible_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
