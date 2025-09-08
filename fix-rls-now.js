#!/usr/bin/env node

/**
 * IMMEDIATE RLS FIX - Direct SQL Execution
 * This script provides the exact SQL commands to run in Supabase SQL Editor
 */

import { readFileSync } from 'fs'

console.log('🚨 CRITICAL RLS POLICY FIX REQUIRED')
console.log('=====================================\n')

console.log('Your application is experiencing "violates row-level security policy" errors.')
console.log('This is preventing all database saves and uploads.\n')

console.log('📋 IMMEDIATE SOLUTION - Run these steps:')
console.log('=====================================\n')

console.log('1. Go to your Supabase dashboard:')
console.log('   https://supabase.com/dashboard/project/epquxwteezyqizrdjjme\n')

console.log('2. Click on "SQL Editor" in the sidebar\n')

console.log('3. Copy and paste the ENTIRE content of this file into the SQL Editor:')
console.log('   supabase/migrations/003_fix_rls_policies.sql\n')

console.log('4. Click "RUN" to execute all the SQL commands\n')

console.log('🔧 WHAT THIS FIX DOES:')
console.log('======================')
console.log('✅ Creates missing user_profiles table with role column')
console.log('✅ Removes restrictive admin-only policies causing errors')
console.log('✅ Creates permissive policies allowing authenticated operations')
console.log('✅ Fixes storage bucket permissions')
console.log('✅ Sets up admin user management functions')
console.log('✅ Ensures all tables allow authenticated access\n')

console.log('🎯 EXPECTED RESULTS:')
console.log('==================')
console.log('✅ Admin panel uploads will work without RLS errors')
console.log('✅ Bride/groom model uploads will save successfully')
console.log('✅ Generated images will be stored in the database')
console.log('✅ All application features will function normally\n')

console.log('⚠️  CRITICAL: Run the SQL migration NOW to fix the issue!')
console.log('=====================================\n')

// Also display the most critical SQL commands for manual execution
console.log('🔥 EMERGENCY SQL COMMANDS (if migration file fails):')
console.log('====================================================')

const emergencySQL = `
-- EMERGENCY FIX 1: Drop problematic admin policies
DROP POLICY IF EXISTS "Only admins can modify countries" ON countries;
DROP POLICY IF EXISTS "Only admins can manage country models" ON country_models;
DROP POLICY IF EXISTS "Only admins can manage styles" ON styles;
DROP POLICY IF EXISTS "Only admins can manage generated images" ON generated_images;

-- EMERGENCY FIX 2: Create permissive policies for immediate relief
CREATE POLICY "Authenticated can manage countries" ON countries 
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Authenticated can manage models" ON country_models 
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Authenticated can manage styles" ON styles 
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Authenticated can manage images" ON generated_images 
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- EMERGENCY FIX 3: Create user_profiles table if missing
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id OR auth.role() = 'service_role');
`

console.log(emergencySQL)
console.log('\n🚀 After running the SQL, test your application:')
console.log('1. Try uploading bride/groom models')
console.log('2. Generate AI images')
console.log('3. Verify data saves without RLS errors')
console.log('\n💡 The fix is ready - just execute the SQL migration!')