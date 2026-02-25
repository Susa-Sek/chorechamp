const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Wertzug1234@db.uyfogthmpmenivnyiioe.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');

async function applyMigrations() {
  console.log('🚀 Starting database migrations...\n');

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files:\n${files.map(f => `  - ${f}`).join('\n')}\n`);

  for (const file of files) {
    console.log(`📄 Applying: ${file}`);

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    try {
      await pool.query(sql);
      console.log(`✅ Success: ${file}\n`);
    } catch (error) {
      // Check if it's a "already exists" type error that we can ignore
      if (error.code === '42P07' || error.code === '42710') {
        console.log(`⚠️  Already exists: ${file} (skipping)\n`);
      } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log(`⚠️  Already exists: ${file} (skipping)\n`);
      } else {
        console.error(`❌ Error in ${file}:`, error.message);
        // Continue with other migrations
      }
    }
  }

  // Verify tables were created
  console.log('\n📋 Verifying tables...');
  const result = await pool.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);

  console.log('Tables in public schema:');
  result.rows.forEach(row => console.log(`  - ${row.table_name}`));

  await pool.end();
  console.log('\n✨ Migrations complete!');
}

applyMigrations().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});