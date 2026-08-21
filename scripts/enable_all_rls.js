const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Load .env.local if present
try {
  const envPath = path.join(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.warn("Could not read .env.local:", e.message);
}

const DEFAULT_DATABASE_URL =
  "postgresql://postgres.bqfcylhnjadiljzpwkve:NpZlAmWSypqwVTKm@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const connectionString = (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) || DEFAULT_DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function enableRlsOnAllTables() {
  const client = await pool.connect();
  try {
    console.log("Connected to PostgreSQL. Querying public tables...");

    // 1. Get all base tables in public schema
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE '_prisma%'
      ORDER BY table_name;
    `);

    const tables = res.rows.map((r) => r.table_name);
    console.log(`Found ${tables.length} tables in public schema:`, tables);

    for (const table of tables) {
      console.log(`\nEnabling RLS on "${table}"...`);

      // Enable RLS
      await client.query(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);

      // Drop existing generic policies if any
      await client.query(`DROP POLICY IF EXISTS "Allow all access to service_role" ON public."${table}";`);
      await client.query(`DROP POLICY IF EXISTS "Allow full access to anon and authenticated" ON public."${table}";`);
      await client.query(`DROP POLICY IF EXISTS "Public full access policy" ON public."${table}";`);

      // Create policy for service_role
      await client.query(`
        CREATE POLICY "Allow all access to service_role" 
        ON public."${table}" 
        FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
      `);

      // Create policy for authenticated and anon users
      await client.query(`
        CREATE POLICY "Allow full access to anon and authenticated" 
        ON public."${table}" 
        FOR ALL 
        TO anon, authenticated 
        USING (true) 
        WITH CHECK (true);
      `);

      console.log(`✓ RLS and policies enabled on "${table}"`);
    }

    console.log("\n==========================================");
    console.log("✓ SUCCESS: RLS enabled on all schema tables!");
    console.log("==========================================");
  } catch (err) {
    console.error("Error enabling RLS on tables:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

enableRlsOnAllTables();
