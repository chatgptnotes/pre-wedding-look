import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // This endpoint will be called by Vercel cron jobs
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Call the Supabase Edge Function for cleanup
    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const response = await fetch(`${supabaseUrl}/functions/v1/blinddate-cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ action: 'cleanup' })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Cleanup failed: ${result.error}`);
    }

    res.status(200).json({
      success: true,
      message: 'Cleanup completed successfully',
      results: result.results || {}
    });

  } catch (error: any) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}