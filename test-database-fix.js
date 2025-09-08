#!/usr/bin/env node

/**
 * Test Database Fix - Verify RLS Policy Fixes
 * This script tests database operations to ensure RLS policies are working correctly
 */

import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://epquxwteezyqizrdjjme.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwcXV4d3RlZXp5cWl6cmRqam1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NjkxNDMsImV4cCI6MjA3MjU0NTE0M30.KPEijM0LNSSIfaZ9Zk_1ih4gpg1iGt0tZQCoQmocKfU'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwcXV4d3RlZXp5cWl6cmRqam1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk2OTE0MywiZXhwIjoyMDcyNTQ1MTQzfQ.bcyjVfDZcb_aKO88L5K-wqconRefLClHCxUSc3vKoBI'

// Create clients
const supabaseAnon = createClient(supabaseUrl, anonKey)
const supabaseService = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testDatabaseOperations() {
  console.log('🧪 Testing Database Operations After RLS Fix')
  console.log('============================================\n')

  const testResults = {
    tableAccess: [],
    insertOperations: [],
    storageAccess: []
  }

  // Test 1: Table access (should work with public read)
  console.log('📊 Testing table access...')
  
  const tables = [
    'countries',
    'country_models', 
    'styles',
    'generated_images',
    'generation_queue'
  ]

  for (const table of tables) {
    try {
      const { data, error } = await supabaseAnon
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
        testResults.tableAccess.push({ table, status: 'FAIL', error: error.message })
      } else {
        console.log(`✅ ${table}: Access OK`)
        testResults.tableAccess.push({ table, status: 'PASS' })
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`)
      testResults.tableAccess.push({ table, status: 'FAIL', error: err.message })
    }
  }

  // Test 2: Insert operations (with service role)
  console.log('\n📝 Testing insert operations...')
  
  // Test country insert
  try {
    const { data, error } = await supabaseService
      .from('countries')
      .insert({
        iso_code: 'TS',
        name: 'Test Country',
        flag_emoji: '🧪',
        cultural_styles: ['test']
      })
      .select()

    if (error) {
      console.log(`❌ Country insert: ${error.message}`)
      testResults.insertOperations.push({ operation: 'country_insert', status: 'FAIL', error: error.message })
    } else {
      console.log(`✅ Country insert: Success`)
      testResults.insertOperations.push({ operation: 'country_insert', status: 'PASS' })
      
      // Clean up test data
      if (data && data[0]) {
        await supabaseService.from('countries').delete().eq('id', data[0].id)
      }
    }
  } catch (err) {
    console.log(`❌ Country insert: ${err.message}`)
    testResults.insertOperations.push({ operation: 'country_insert', status: 'FAIL', error: err.message })
  }

  // Test generated_images insert
  try {
    // First get a country to reference
    const { data: countries } = await supabaseService
      .from('countries')
      .select('id')
      .limit(1)

    if (countries && countries.length > 0) {
      // Get a style to reference
      const { data: styles } = await supabaseService
        .from('styles')
        .select('id')
        .limit(1)

      if (styles && styles.length > 0) {
        // Try inserting a generated image
        const { data, error } = await supabaseService
          .from('generated_images')
          .insert({
            country_id: countries[0].id,
            style_id: styles[0].id,
            role: 'bride',
            image_url: 'https://test.com/test.jpg',
            image_path: '/test/path.jpg'
          })
          .select()

        if (error) {
          console.log(`❌ Generated image insert: ${error.message}`)
          testResults.insertOperations.push({ operation: 'generated_image_insert', status: 'FAIL', error: error.message })
        } else {
          console.log(`✅ Generated image insert: Success`)
          testResults.insertOperations.push({ operation: 'generated_image_insert', status: 'PASS' })
          
          // Clean up test data
          if (data && data[0]) {
            await supabaseService.from('generated_images').delete().eq('id', data[0].id)
          }
        }
      } else {
        console.log(`⚠️  Generated image insert: No styles found to reference`)
        testResults.insertOperations.push({ operation: 'generated_image_insert', status: 'SKIP', error: 'No styles found' })
      }
    } else {
      console.log(`⚠️  Generated image insert: No countries found to reference`)
      testResults.insertOperations.push({ operation: 'generated_image_insert', status: 'SKIP', error: 'No countries found' })
    }
  } catch (err) {
    console.log(`❌ Generated image insert: ${err.message}`)
    testResults.insertOperations.push({ operation: 'generated_image_insert', status: 'FAIL', error: err.message })
  }

  // Test 3: Storage bucket access
  console.log('\n🗃️  Testing storage bucket access...')
  
  const buckets = ['images', 'faces', 'galleries']
  
  for (const bucket of buckets) {
    try {
      const { data, error } = await supabaseAnon.storage
        .from(bucket)
        .list('', {
          limit: 1
        })

      if (error) {
        console.log(`❌ ${bucket} bucket: ${error.message}`)
        testResults.storageAccess.push({ bucket, status: 'FAIL', error: error.message })
      } else {
        console.log(`✅ ${bucket} bucket: Access OK`)
        testResults.storageAccess.push({ bucket, status: 'PASS' })
      }
    } catch (err) {
      console.log(`❌ ${bucket} bucket: ${err.message}`)
      testResults.storageAccess.push({ bucket, status: 'FAIL', error: err.message })
    }
  }

  // Test Results Summary
  console.log('\n📋 TEST RESULTS SUMMARY')
  console.log('======================')
  
  const tablePassCount = testResults.tableAccess.filter(r => r.status === 'PASS').length
  const insertPassCount = testResults.insertOperations.filter(r => r.status === 'PASS').length
  const storagePassCount = testResults.storageAccess.filter(r => r.status === 'PASS').length
  
  console.log(`📊 Table Access: ${tablePassCount}/${tables.length} passed`)
  console.log(`📝 Insert Operations: ${insertPassCount}/${testResults.insertOperations.length} passed`)
  console.log(`🗃️  Storage Access: ${storagePassCount}/${buckets.length} passed`)

  const totalTests = testResults.tableAccess.length + testResults.insertOperations.length + testResults.storageAccess.length
  const totalPassed = tablePassCount + insertPassCount + storagePassCount
  
  console.log(`\n🎯 OVERALL: ${totalPassed}/${totalTests} tests passed`)
  
  if (totalPassed === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! RLS fix is working correctly.')
    console.log('✅ Your application should now work without RLS policy errors')
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Check the errors above.')
    console.log('💡 You may need to run the SQL migration manually in Supabase dashboard')
  }

  // Specific recommendations
  if (tablePassCount < tables.length) {
    console.log('\n🔧 Table access issues detected:')
    console.log('   Run the RLS policy migration: supabase/migrations/003_fix_rls_policies.sql')
  }
  
  if (storagePassCount < buckets.length) {
    console.log('\n🗃️  Storage bucket issues detected:') 
    console.log('   Run the storage setup: setup-storage-buckets.sql')
  }

  return totalPassed === totalTests
}

// Run the tests
testDatabaseOperations()
  .then(allPassed => {
    process.exit(allPassed ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  })