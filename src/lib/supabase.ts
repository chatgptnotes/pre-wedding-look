import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a null client if no valid credentials
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

// Service role client for admin operations (bypasses RLS)
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || '';
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Helper to get the appropriate client based on operation type
export const getSupabaseClient = (requireAdmin: boolean = false) => {
  if (requireAdmin && supabaseAdmin) {
    console.log('🔑 Using service role client for admin operation');
    return supabaseAdmin;
  }
  console.log('👤 Using anonymous client for regular operation');
  return supabase;
};

// Google OAuth configuration
export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Database types
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PreWeddingProject {
  id: string;
  user_id: string;
  project_name: string;
  bride_name: string | null;
  groom_name: string | null;
  bride_image_url: string | null;
  groom_image_url: string | null;
  generated_bride_image_url: string | null;
  generated_groom_image_url: string | null;
  final_image_url: string | null;
  config: any; // JSON object storing GenerationConfig
  created_at: string;
  updated_at: string;
}

export interface GeneratedImage {
  id: string;
  project_id: string;
  image_url: string;
  storage_path?: string;
  image_type: 'bride' | 'groom' | 'couple';
  config_used: any; // JSON object
  is_downloaded?: boolean;
  created_at: string;
}

export interface FavoriteItem {
  id: string;
  user_id: string;
  image_id: string;
  image_url: string;
  image_type: 'bride' | 'groom' | 'couple';
  config_used: any; // JSON object
  title: string | null;
  notes: string | null;
  created_at: string;
}