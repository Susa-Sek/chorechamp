const { Pool } = require('pg');

const passwords = [
  'Wertzug1234',
  'Wertzug1234.',
  encodeURIComponent('Wertzug1234'),
  encodeURIComponent('Wertzug1234.')
];

const hosts = [
  'db.uyfogthmpmenivnyiioe.supabase.co',
  'aws-0-eu-central-1.pooler.supabase.com'
];

async function test() {
  for (const host of hosts) {
    for (const pwd of passwords) {
      const isPooler = host.includes('pooler');
      const user = isPooler ? 'postgres.uyfogthmpmenivnyiioe' : 'postgres';
      const port = isPooler ? 6543 : 5432;

      const connStr = `postgresql://${user}:${pwd}@${host}:${port}/postgres`;

      console.log(`\nTesting: ${user}@${host}:${port} (pwd: ${pwd.replace(/./g, '*').substring(0,8)}...)`);

      const pool = new Pool({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });

      try {
        const result = await pool.query('SELECT NOW() as time, current_database() as db');
        console.log(`✅ SUCCESS!`);
        console.log(`   Time: ${result.rows[0].time}`);
        console.log(`   Database: ${result.rows[0].db}`);
        await pool.end();
        console.log(`\n\n🎉 Working connection string:`);
        console.log(connStr);
        return connStr;
      } catch (error) {
        console.log(`❌ ${error.message.split('\n')[0]}`);
      }
      await pool.end().catch(() => {});
    }
  }

  return null;
}

test().then(result => {
  if (!result) {
    console.log('\n\n❌ No working connection found.');
    console.log('Please verify the password in Supabase Dashboard > Settings > Database');
  }
});