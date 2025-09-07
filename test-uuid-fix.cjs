#!/usr/bin/env node
/**
 * Test the UUID fix for country_models insertion
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

async function testUuidFix() {
  console.log('🔧 TESTING UUID FIX FOR COUNTRY MODELS');
  console.log('======================================');

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Test 1: Get actual country UUIDs from database
  console.log('\n🏛️ TEST 1: Get Real Country IDs');
  console.log('================================');

  try {
    const { data: countries, error } = await serviceClient
      .from('countries')
      .select('id, iso_code, name')
      .order('iso_code');

    if (error) {
      console.error('❌ Cannot get countries:', error);
      return;
    }

    console.log('✅ Available countries:');
    countries.forEach(country => {
      console.log(`   ${country.iso_code}: ${country.name} (ID: ${country.id})`);
    });

    // Test 2: Try insert with real country UUID
    if (countries.length > 0) {
      const testCountry = countries[0]; // Use first country
      
      console.log(`\n📝 TEST 2: Insert Model with Real UUID`);
      console.log('=====================================');
      console.log(`Using country: ${testCountry.iso_code} (${testCountry.name})`);
      console.log(`Country ID: ${testCountry.id}`);

      try {
        const { data, error } = await serviceClient
          .from('country_models')
          .insert({
            country_id: testCountry.id, // Use real UUID
            role: 'bride',
            source_image_url: 'https://example.com/test.jpg',
            source_image_path: 'test/path.jpg',
            source_image_sha256: 'test-hash-' + Date.now(),
            metadata: { test: true },
            is_active: true,
          });

        if (error) {
          console.error('❌ Insert failed with real UUID:', error);
        } else {
          console.log('✅ Insert successful with real UUID!');
          console.log('   Created model:', data);
        }
      } catch (err) {
        console.error('❌ Insert failed:', err);
      }
    }

  } catch (err) {
    console.error('❌ Test failed:', err);
  }

  console.log('\n🔍 TEST COMPLETE');
  console.log('================');
}

testUuidFix().catch(console.error);