import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the migration file
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '004_blinddate_mini_game.sql');
const migration = fs.readFileSync(migrationPath, 'utf8');

console.log('🚀 Deploying Blind Date Migration to Supabase...');
console.log('⚠️  IMPORTANT: Run this SQL in your Supabase SQL Editor:');
console.log('='.repeat(80));
console.log(migration);
console.log('='.repeat(80));
console.log('✅ Copy the above SQL and paste it into Supabase SQL Editor to deploy.');

// Also create a quick test script
const testScript = `
-- Test blind date tables after migration
SELECT 'blinddate_sessions' as table_name, count(*) as count FROM blinddate_sessions
UNION ALL
SELECT 'blinddate_participants' as table_name, count(*) as count FROM blinddate_participants
UNION ALL
SELECT 'blinddate_rounds' as table_name, count(*) as count FROM blinddate_rounds
UNION ALL
SELECT 'blinddate_designs' as table_name, count(*) as count FROM blinddate_designs
UNION ALL
SELECT 'blinddate_feedback' as table_name, count(*) as count FROM blinddate_feedback
UNION ALL
SELECT 'blinddate_shares' as table_name, count(*) as count FROM blinddate_shares;
`;

console.log('\n📋 After deployment, run this test query to verify:');
console.log('-'.repeat(50));
console.log(testScript);
console.log('-'.repeat(50));