const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres.bqfcylhnjadiljzpwkve:NpZlAmWSypqwVTKm@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
});

async function run() {
  try {
    await client.connect();
    await client.query(`UPDATE "Hackathon" SET image = null WHERE id = 'cmsu7cfev0001hgr3mfha7e9w'`);
    console.log("Cleared Hackathon image!");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
