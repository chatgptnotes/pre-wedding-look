#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://opchrnceamwydfszzzco.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wY2hybmNlYW13eWRmc3p6emNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM0NTc0OSwiZXhwIjoyMDcyOTIxNzQ5fQ.PQLA5YTdEGK1FemKdFwZBI7hv-2WA6JT_JhNRxK8210';

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  try {
    console.log('🚀 Starting database migration...');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/005_complete_database_setup.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded, executing SQL...');
    
    // Split the SQL into individual statements (simple approach)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0) continue;
      
      console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          // Continue with next statement for non-critical errors
          if (error.message.includes('already exists')) {
            console.log('⚠️  Object already exists, skipping...');
            continue;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
      }
    }
    
    console.log('🎉 Migration completed!');
    
    // Verify some key tables were created
    console.log('🔍 Verifying table creation...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'profiles', 
        'countries', 
        'styles', 
        'user_projects', 
        'generated_images',
        'blinddate_sessions',
        'blinddate_participants'
      ]);
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
    } else {
      console.log('✅ Tables verified:', tables.map(t => t.table_name));
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Alternative approach using direct SQL execution
async function applyMigrationDirect() {
  try {
    console.log('🚀 Starting direct migration...');
    
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/005_complete_database_setup.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Try to execute the entire migration as one block
    const { data, error } = await supabase.rpc('exec', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Migration error:', error);
      
      // Fall back to statement-by-statement execution
      console.log('🔄 Falling back to statement-by-statement execution...');
      await applyMigration();
    } else {
      console.log('✅ Migration executed successfully!');
      console.log('Result:', data);
    }
    
  } catch (error) {
    console.error('💥 Direct migration failed, trying statement-by-statement:', error.message);
    await applyMigration();
  }
}

// Check if exec_sql function exists, if not create it
async function ensureExecFunction() {
  const createExecSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text) 
    RETURNS text 
    LANGUAGE plpgsql 
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
      RETURN 'OK';
    END;
    $$;
  `;
  
  try {
    const { error } = await supabase.rpc('exec', { sql: createExecSQL });
    if (error) {
      console.log('Note: Could not create exec_sql function, using alternative approach');
    }
  } catch (e) {
    console.log('Note: Using alternative migration approach');
  }
}

// Main execution
async function main() {
  await ensureExecFunction();
  await applyMigrationDirect();
}

main();