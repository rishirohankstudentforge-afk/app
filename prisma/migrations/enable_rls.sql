-- Enable Row Level Security (RLS) on all public tables and add security policies

DO $$ 
DECLARE 
  tbl record;
BEGIN
  FOR tbl IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE '_prisma%'
  LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.table_name);

    -- Drop existing policies if any
    EXECUTE format('DROP POLICY IF EXISTS "Allow all access to service_role" ON public.%I;', tbl.table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Allow full access to anon and authenticated" ON public.%I;', tbl.table_name);

    -- Create service_role full access policy
    EXECUTE format('
      CREATE POLICY "Allow all access to service_role" 
      ON public.%I 
      FOR ALL 
      TO service_role 
      USING (true) 
      WITH CHECK (true);', tbl.table_name);

    -- Create authenticated and anon policy
    EXECUTE format('
      CREATE POLICY "Allow full access to anon and authenticated" 
      ON public.%I 
      FOR ALL 
      TO anon, authenticated 
      USING (true) 
      WITH CHECK (true);', tbl.table_name);
  END LOOP;
END $$;
