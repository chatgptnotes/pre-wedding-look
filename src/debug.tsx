// Debug component to test environment variables
import React from 'react';

export const Debug: React.FC = () => {
  console.log('Environment variables:');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
  
  return (
    <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
      <h3 className="font-bold">Debug Info:</h3>
      <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL || 'MISSING!'}</p>
      <p>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'MISSING!'}</p>
    </div>
  );
};