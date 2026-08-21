const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres.bqfcylhnjadiljzpwkve:NpZlAmWSypqwVTKm@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
});

async function check() {
  try {
    await client.connect();
    
    // Get organizer
    const orgRes = await client.query("SELECT id FROM organizers WHERE email = $1", ['padarthidhanush0@gmail.com']);
    if (orgRes.rows.length === 0) {
      console.log("No organizer found with email padarthidhanush0@gmail.com");
      return;
    }
    const orgId = orgRes.rows[0].id;
    
    // Get hackathons
    const hackRes = await client.query("SELECT * FROM hackathons WHERE organizer_id = $1", [orgId]);
    console.log(`Found ${hackRes.rows.length} hackathons:`);
    console.log(JSON.stringify(hackRes.rows, null, 2));
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

check();
