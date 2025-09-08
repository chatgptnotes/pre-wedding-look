#!/usr/bin/env node
/**
 * CRITICAL RLS DEBUGGING SCRIPT - Simple Version
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env file manually
let SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY;

try {
  const envFile = fs.readFileSync('.env', 'utf8');
  const envVars = {};
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
  
  SUPABASE_URL = envVars.VITE_SUPABASE_URL;
  SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;
  SUPABASE_SERVICE_KEY = envVars.VITE_SUPABASE_SERVICE_KEY;
} catch (err) {
  console.error('Cannot read .env file:', err.message);
  process.exit(1);
}

async function runDiagnostics() {
  console.log('🔍 CRITICAL RLS DEBUGGING SESSION');
  console.log('================================');

  console.log('Environment Check:');
  console.log('- Supabase URL:', SUPABASE_URL ? 'SET' : 'NOT SET');
  console.log('- Anon Key:', SUPABASE_ANON_KEY ? 'SET (length: ' + SUPABASE_ANON_KEY.length + ')' : 'NOT SET');
  console.log('- Service Key:', SUPABASE_SERVICE_KEY ? 'SET (length: ' + SUPABASE_SERVICE_KEY.length + ')' : 'NOT SET');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  // Test 1: Anonymous Client Connection
  console.log('\n📱 TEST 1: Anonymous Client Connection');
  console.log('=====================================');

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    console.log('Testing basic connection...');
    const { data, error } = await anonClient.from('countries').select('count').limit(1);
    
    if (error) {
      console.error('❌ Anonymous client error:', error);
    } else {
      console.log('✅ Anonymous client can connect');
    }
  } catch (err) {
    console.error('❌ Anonymous client connection failed:', err);
  }

  // Test 2: Try to query country_models table with anonymous client
  console.log('\n🏛️ TEST 2: Country Models Table Access (Anonymous)');
  console.log('==================================================');

  try {
    console.log('Attempting to read country_models table...');
    const { data, error } = await anonClient
      .from('country_models')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('❌ Country models read error with anon client:', error);
    } else {
      console.log('✅ Country models readable with anonymous client:', data?.length || 0, 'records');
    }
  } catch (err) {
    console.error('❌ Country models query failed:', err);
  }

  // Test 3: Try to insert into country_models with anonymous client (THIS SHOULD FAIL)
  console.log('\n📝 TEST 3: Country Models Table Insert (Anonymous)');
  console.log('==================================================');

  try {
    console.log('Attempting to insert into country_models table...');
    const { data, error } = await anonClient
      .from('country_models')
      .insert({
        country_id: 'test-country-id-' + Date.now(),
        role: 'bride',
        source_image_url: 'https://example.com/test.jpg',
        source_image_path: 'test/path.jpg',
        source_image_sha256: 'test-hash-' + Date.now(),
        metadata: { test: true },
        is_active: true,
      });
      
    if (error) {
      console.error('❌ CRITICAL: Country models insert failed with anon client:', error);
      console.error('   This is the RLS policy error we\'re seeing in the admin panel!');
      console.error('   Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Country models insert successful with anonymous client (unexpected!)');
      console.log('   Data:', data);
    }
  } catch (err) {
    console.error('❌ Country models insert failed:', err);
  }

  // Test 4: Service Role Client (if available)
  if (SUPABASE_SERVICE_KEY) {
    console.log('\n🔑 TEST 4: Service Role Client');
    console.log('==============================');
    
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    try {
      console.log('Testing service role connection...');
      const { data, error } = await serviceClient.from('countries').select('count').limit(1);
      
      if (error) {
        console.error('❌ Service client error:', error);
      } else {
        console.log('✅ Service client can connect');
      }
    } catch (err) {
      console.error('❌ Service client connection failed:', err);
    }

    // Test 5: Try insert with service role (THIS SHOULD WORK)
    console.log('\n📝 TEST 5: Country Models Insert (Service Role)');
    console.log('===============================================');
    
    try {
      console.log('Attempting insert with service role...');
      const { data, error } = await serviceClient
        .from('country_models')
        .insert({
          country_id: 'test-service-country-id-' + Date.now(),
          role: 'groom',
          source_image_url: 'https://example.com/service-test.jpg',
          source_image_path: 'test/service-path.jpg', 
          source_image_sha256: 'service-test-hash-' + Date.now(),
          metadata: { test: true, service_role: true },
          is_active: true,
        });
        
      if (error) {
        console.error('❌ Service role insert failed:', error);
      } else {
        console.log('✅ Service role insert successful!');
        console.log('   Data:', data);
      }
    } catch (err) {
      console.error('❌ Service role insert failed:', err);
    }
  }

  // Test 6: Check if table exists and has correct structure
  console.log('\n🗂️ TEST 6: Table Structure Check');
  console.log('=================================');

  const checkClient = SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : anonClient;

  try {
    console.log('Checking if country_models table exists...');
    const { data, error } = await checkClient
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', 'country_models');
      
    if (error) {
      console.error('❌ Cannot check table existence:', error);
    } else if (data && data.length > 0) {
      console.log('✅ country_models table exists');
    } else {
      console.error('❌ country_models table does not exist!');
    }
  } catch (err) {
    console.error('❌ Table structure check failed:', err);
  }

  console.log('\n🔍 DEBUGGING COMPLETE');
  console.log('====================');
  console.log('Review the output above to identify the exact cause of the RLS policy error.');
  console.log('\n🎯 LIKELY ROOT CAUSE:');
  console.log('The admin panel is using the anonymous client to insert into country_models,');
  console.log('but the RLS policies require authenticated or service role access.');
}

runDiagnostics().catch(console.error);