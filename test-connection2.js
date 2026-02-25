const { Pool } = require('pg');

const passwords = ['Wertzug1234.', 'Wertzug1234'];

async function test() {
  for (const pwd of passwords) {
    console.log(`\nTesting password: ${pwd.replace(/./g, '*')}`);

    // Try pooler format
    const pool = new Pool({
      connectionString: `postgresql://postgres.uyfogthmpmenivnyiioe:${pwd}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
      ssl: { rejectUnauthorized: false }
    });

    try {
      const result = await pool.query('SELECT NOW()');
      console.log('✅ SUCCESS! Password works.');
      await pool.end();
      return pwd;
    } catch (error) {
      console.log(`❌ ${error.message}`);
    }
    await pool.end();
  }

  return null;
}

test().then(pwd => {
  if (pwd) {
    console.log(`\nWorking password found: ${pwd.replace(/./g, '*')}`);
  } else {
    console.log('\nNo working password found.');
  }
});