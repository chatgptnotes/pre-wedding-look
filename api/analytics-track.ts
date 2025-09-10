import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AnalyticsEventData {
  eventName: string;
  properties?: Record<string, any>;
  userProperties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { eventName, properties = {}, userProperties = {}, userId, sessionId, timestamp } = req.body as AnalyticsEventData;

    if (!eventName) {
      return res.status(400).json({ error: 'Event name is required' });
    }

    // Get client IP and user agent for additional context
    const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Extract additional context from headers
    const referer = req.headers.referer;
    const acceptLanguage = req.headers['accept-language'];

    // Detect device type from user agent
    const detectDeviceType = (ua: string) => {
      if (/mobile|android|iphone/i.test(ua)) return 'mobile';
      if (/ipad|tablet/i.test(ua)) return 'tablet';
      return 'desktop';
    };

    // Get geographic info from IP (simplified - in production use a proper IP geolocation service)
    const getCountryFromIP = async (ip: string): Promise<{ country?: string; city?: string }> => {
      try {
        // This is a placeholder - integrate with a real IP geolocation service
        // like ipapi.co, ipgeolocation.io, or MaxMind
        return {};
      } catch {
        return {};
      }
    };

    const geoInfo = await getCountryFromIP(String(clientIP));

    // Prepare event data for insertion
    const eventData = {
      user_id: userId || null,
      session_id: sessionId || null,
      event_name: eventName,
      event_properties: {
        ...properties,
        referer,
        accept_language: acceptLanguage,
        client_timestamp: timestamp,
        server_timestamp: new Date().toISOString(),
      },
      user_properties: userProperties,
      timestamp: timestamp || new Date().toISOString(),
      device_type: userAgent ? detectDeviceType(userAgent) : null,
      user_agent: userAgent,
      ip_address: clientIP,
      country_code: geoInfo.country,
      city: geoInfo.city,
      page_url: properties.page_url,
      referrer: properties.referrer || referer,
      utm_source: properties.utm_source,
      utm_medium: properties.utm_medium,
      utm_campaign: properties.utm_campaign,
    };

    // Insert event into database
    const { error } = await supabase
      .from('analytics_events')
      .insert(eventData);

    if (error) {
      console.error('Analytics insert error:', error);
      return res.status(500).json({ error: 'Failed to track event' });
    }

    // Update session if provided
    if (sessionId) {
      await updateSession(sessionId, userId, eventData);
    }

    // Track experiment events if applicable
    if (eventName.startsWith('experiment_') || eventName.includes('conversion')) {
      await trackExperimentEvent(eventData);
    }

    // Update user cohorts for key events
    if (['user_registered', 'first_purchase', 'game_joined'].includes(eventName)) {
      await updateUserCohorts(userId, eventName, eventData);
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to update user session
async function updateSession(sessionId: string, userId: string | null, eventData: any) {
  try {
    const { data: existingSession } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (existingSession) {
      // Update existing session
      await supabase
        .from('user_sessions')
        .update({
          events_count: (existingSession.events_count || 0) + 1,
          updated_at: new Date().toISOString(),
          // Update bounce status (false if more than 1 event)
          bounce: existingSession.events_count === 0,
        })
        .eq('session_id', sessionId);
    } else if (userId) {
      // Create new session
      await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          session_id: sessionId,
          started_at: eventData.timestamp,
          device_type: eventData.device_type,
          user_agent: eventData.user_agent,
          country_code: eventData.country_code,
          city: eventData.city,
          landing_page: eventData.page_url,
          referrer: eventData.referrer,
          utm_source: eventData.utm_source,
          utm_medium: eventData.utm_medium,
          utm_campaign: eventData.utm_campaign,
          events_count: 1,
          bounce: true, // Will be updated when more events come
        });
    }
  } catch (error) {
    console.error('Session update error:', error);
  }
}

// Helper function to track experiment events
async function trackExperimentEvent(eventData: any) {
  try {
    if (!eventData.user_id) return;

    const { event_name, event_properties } = eventData;
    
    // Extract experiment info from event properties
    const experimentName = event_properties.experiment_name;
    const variantId = event_properties.variant_id;
    
    if (!experimentName || !variantId) return;

    // Get experiment ID
    const { data: experiment } = await supabase
      .from('experiments')
      .select('id')
      .eq('name', experimentName)
      .single();

    if (!experiment) return;

    // Insert experiment event
    await supabase
      .from('experiment_events')
      .insert({
        user_id: eventData.user_id,
        experiment_id: experiment.id,
        variant_id: variantId,
        event_name: event_name,
        event_properties: event_properties,
        value: event_properties.value || null,
        timestamp: eventData.timestamp,
      });
  } catch (error) {
    console.error('Experiment event tracking error:', error);
  }
}

// Helper function to update user cohorts
async function updateUserCohorts(userId: string | null, eventName: string, eventData: any) {
  if (!userId) return;

  try {
    const now = new Date();
    const cohortPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Check if user already has a cohort record
    const { data: existingCohort } = await supabase
      .from('user_cohorts')
      .select('*')
      .eq('user_id', userId)
      .eq('cohort_type', 'registration_date')
      .single();

    if (!existingCohort && eventName === 'user_registered') {
      // Create new cohort record for new user
      await supabase
        .from('user_cohorts')
        .insert({
          user_id: userId,
          cohort_type: 'registration_date',
          cohort_period: cohortPeriod,
          cohort_size: 1, // Will be updated by batch job
          registration_date: now.toISOString().split('T')[0],
          day_1_active: true,
        });
    } else if (existingCohort) {
      // Update existing cohort with activity
      const registrationDate = new Date(existingCohort.registration_date);
      const daysSinceRegistration = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));

      const updates: any = {
        last_active_date: now.toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      };

      // Update retention flags based on days since registration
      if (daysSinceRegistration >= 1 && !existingCohort.day_1_active) {
        updates.day_1_active = true;
      }
      if (daysSinceRegistration >= 7 && !existingCohort.day_7_active) {
        updates.day_7_active = true;
      }
      if (daysSinceRegistration >= 30 && !existingCohort.day_30_active) {
        updates.day_30_active = true;
      }
      if (daysSinceRegistration >= 90 && !existingCohort.day_90_active) {
        updates.day_90_active = true;
      }

      // Track revenue for purchase events
      if (eventName === 'first_purchase' && !existingCohort.first_purchase_date) {
        updates.first_purchase_date = now.toISOString().split('T')[0];
      }

      await supabase
        .from('user_cohorts')
        .update(updates)
        .eq('user_id', userId)
        .eq('cohort_type', 'registration_date');
    }
  } catch (error) {
    console.error('Cohort update error:', error);
  }
}

// Rate limiting helper (optional)
const rateLimitMap = new Map();

function checkRateLimit(ip: string, limit = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const requests = rateLimitMap.get(ip);
  
  // Remove old requests
  const recentRequests = requests.filter((time: number) => time > windowStart);
  
  if (recentRequests.length >= limit) {
    return false; // Rate limit exceeded
  }

  // Add current request
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  
  return true;
}