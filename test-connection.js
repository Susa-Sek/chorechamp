const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Try different connection formats
const connectionConfigs = [
  // Pooler connection (port 6543, uses postgres.[project-ref])
  {
    name: 'Pooler Connection',
    connectionString: 'postgresql://postgres.uyfogthmpmenivnyiioe:Wertzug1234@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  },
  // Direct connection (port 5432, uses postgres)
  {
    name: 'Direct Connection',
    connectionString: 'postgresql://postgres:Wertzug1234@db.uyfogthmpmenivnyiioe.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  },
  // Transaction pooler
  {
    name: 'Transaction Pooler',
    connectionString: 'postgresql://postgres.uyfogthmpmenivnyiioe:Wertzug1234@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    ssl: { rejectUnauthorized: false }
  }
];

async function testConnections() {
  for (const config of connectionConfigs) {
    console.log(`\n🔍 Testing: ${config.name}`);
    console.log(`   Connection string: ${config.connectionString.replace(/:[^:@]+@/, ':****@')}`);

    const pool = new Pool(config);

    try {
      const result = await pool.query('SELECT NOW()');
      console.log(`   ✅ SUCCESS! Connected at ${result.rows[0].now}`);
      await pool.end();
      return config;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      await pool.end();
    }
  }

  return null;
}

async function main() {
  console.log('🔌 Testing database connection formats...\n');

  const workingConfig = await testConnections();

  if (!workingConfig) {
    console.log('\n❌ All connection attempts failed.');
    console.log('\nPlease check:');
    console.log('1. Database password is correct');
    console.log('2. Database is accessible (not paused)');
    console.log('3. Connection pooling is enabled in Supabase');
    return;
  }

  console.log(`\n✨ Found working connection: ${workingConfig.name}`);
}

main().catch(console.error);