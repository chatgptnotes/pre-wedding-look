import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check database connectivity
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    const dbCheck = await fetch(`${supabaseUrl}/rest/v1/profiles?limit=1`, {
      headers: {
        'apikey': supabaseKey!,
        'Authorization': `Bearer ${supabaseKey}`,
      }
    }).catch(() => null);

    // Check Gemini API
    const geminiKey = process.env.VITE_GEMINI_API_KEY;
    const aiCheck = geminiKey ? true : false;

    // Check Google OAuth
    const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID;
    const oauthCheck = googleClientId ? true : false;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.VITE_APP_ENV || 'development',
      checks: {
        database: dbCheck?.ok ? 'healthy' : 'unhealthy',
        ai_service: aiCheck ? 'configured' : 'missing',
        oauth: oauthCheck ? 'configured' : 'missing',
        multiplayer: 'enabled'
      },
      features: {
        blind_date_game: true,
        video_generation: true,
        google_auth: oauthCheck,
        mobile_responsive: true,
        auto_cleanup: true
      }
    };

    res.status(200).json(health);
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}