#!/usr/bin/env node
/**
 * CRITICAL RLS DEBUGGING SCRIPT
 * This script will test the exact authentication and RLS policy issue
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY;

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

// Test 2: Check current authentication state
console.log('\n🔐 TEST 2: Authentication State');
console.log('===============================');

try {
  const { data: { user }, error: userError } = await anonClient.auth.getUser();
  
  if (userError) {
    console.log('⚠️  No authenticated user (expected for anon client):', userError.message);
  } else if (user) {
    console.log('✅ User authenticated:', user.email);
  } else {
    console.log('ℹ️  No user session (using anonymous access)');
  }
} catch (err) {
  console.error('❌ Auth check failed:', err);
}

// Test 3: Try to query country_models table with anonymous client
console.log('\n🏛️ TEST 3: Country Models Table Access (Anonymous)');
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

// Test 4: Try to insert into country_models with anonymous client
console.log('\n📝 TEST 4: Country Models Table Insert (Anonymous)');
console.log('==================================================');

try {
  console.log('Attempting to insert into country_models table...');
  const { data, error } = await anonClient
    .from('country_models')
    .insert({
      country_id: 'test-country-id',
      role: 'bride',
      source_image_url: 'https://example.com/test.jpg',
      source_image_path: 'test/path.jpg',
      source_image_sha256: 'test-hash',
      metadata: { test: true },
      is_active: true,
    });
    
  if (error) {
    console.error('❌ CRITICAL: Country models insert failed with anon client:', error);
    console.error('   This is likely the RLS policy error we\'re seeing in the admin panel!');
  } else {
    console.log('✅ Country models insert successful with anonymous client');
    console.log('   Data:', data);
  }
} catch (err) {
  console.error('❌ Country models insert failed:', err);
}

// Test 5: Service Role Client (if available)
if (SUPABASE_SERVICE_KEY) {
  console.log('\n🔑 TEST 5: Service Role Client');
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

  // Test 6: Try insert with service role
  console.log('\n📝 TEST 6: Country Models Insert (Service Role)');
  console.log('===============================================');
  
  try {
    console.log('Attempting insert with service role...');
    const { data, error } = await serviceClient
      .from('country_models')
      .insert({
        country_id: 'test-service-country-id',
        role: 'groom',
        source_image_url: 'https://example.com/service-test.jpg',
        source_image_path: 'test/service-path.jpg', 
        source_image_sha256: 'service-test-hash',
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

// Test 7: Check RLS policies
console.log('\n🛡️ TEST 7: Check RLS Policies');
console.log('==============================');

const checkClient = SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : anonClient;

try {
  console.log('Querying RLS policies for country_models table...');
  const { data, error } = await checkClient
    .rpc('exec_sql', { 
      query: `
        SELECT 
          policyname,
          cmd,
          roles,
          qual,
          with_check
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'country_models'
        ORDER BY policyname;
      `
    });
    
  if (error) {
    console.error('❌ Cannot check RLS policies:', error);
  } else {
    console.log('✅ Current RLS Policies on country_models:');
    if (data && data.length > 0) {
      data.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd}): ${policy.roles}`);
      });
    } else {
      console.log('   No RLS policies found');
    }
  }
} catch (err) {
  console.error('❌ RLS policies check failed:', err);
}

// Test 8: Check if table exists and has correct structure
console.log('\n🗂️ TEST 8: Table Structure Check');
console.log('=================================');

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
    
    // Check columns
    const { data: columns, error: colError } = await checkClient
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'country_models')
      .order('ordinal_position');
      
    if (colError) {
      console.error('❌ Cannot check table columns:', colError);
    } else {
      console.log('   Table columns:');
      columns?.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    }
  } else {
    console.error('❌ country_models table does not exist!');
  }
} catch (err) {
  console.error('❌ Table structure check failed:', err);
}

console.log('\n🔍 DEBUGGING COMPLETE');
console.log('====================');
console.log('Review the output above to identify the exact cause of the RLS policy error.');