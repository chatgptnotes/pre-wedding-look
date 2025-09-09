import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface QueueJob {
  id: string;
  user_id: string;
  session_id: string;
  design_id: string;
  prompt: string;
  status: string;
  priority: number;
  attempts: number;
  max_attempts: number;
  metadata: any;
}

// Exponential backoff for retries
function getRetryDelay(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
}

// Process a single job
async function processJob(job: QueueJob): Promise<void> {
  console.log(`Processing job ${job.id}`);
  
  try {
    // Update job status to processing
    await supabase
      .from('generation_queue')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', job.id);

    // Call Gemini API for image generation
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: job.prompt
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    
    // Extract image URL from response
    const imageUrl = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Store the result in the database
    await supabase
      .from('generation_queue')
      .update({
        status: 'completed',
        result_url: imageUrl,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    // Update the design with the generated image
    if (job.design_id) {
      await supabase
        .from('blinddate_round_designs')
        .update({
          generated_image_url: imageUrl,
          generated_at: new Date().toISOString()
        })
        .eq('id', job.design_id);
    }

    console.log(`Job ${job.id} completed successfully`);

  } catch (error) {
    console.error(`Error processing job ${job.id}:`, error);
    
    const nextAttempt = job.attempts + 1;
    
    if (nextAttempt >= job.max_attempts) {
      // Mark as failed after max attempts
      await supabase
        .from('generation_queue')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);
    } else {
      // Schedule retry with exponential backoff
      const retryDelay = getRetryDelay(nextAttempt);
      const nextRetryAt = new Date(Date.now() + retryDelay).toISOString();
      
      await supabase
        .from('generation_queue')
        .update({
          status: 'retry',
          attempts: nextAttempt,
          error_message: error.message,
          next_retry_at: nextRetryAt
        })
        .eq('id', job.id);
    }
  }
}

// Fetch and process pending jobs
async function processQueue(): Promise<void> {
  // Get pending jobs ordered by priority and creation time
  const { data: jobs, error } = await supabase
    .from('generation_queue')
    .select('*')
    .in('status', ['pending', 'retry'])
    .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(5); // Process 5 jobs at a time

  if (error) {
    console.error('Error fetching jobs:', error);
    return;
  }

  if (!jobs || jobs.length === 0) {
    console.log('No pending jobs');
    return;
  }

  // Process jobs in parallel
  const promises = jobs.map(job => processJob(job));
  await Promise.allSettled(promises);
}

// Dead letter queue handler
async function handleDeadLetterQueue(): Promise<void> {
  // Find jobs that have been stuck in processing for too long
  const stuckThreshold = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes
  
  const { data: stuckJobs, error } = await supabase
    .from('generation_queue')
    .select('*')
    .eq('status', 'processing')
    .lt('started_at', stuckThreshold);

  if (error) {
    console.error('Error finding stuck jobs:', error);
    return;
  }

  if (stuckJobs && stuckJobs.length > 0) {
    console.log(`Found ${stuckJobs.length} stuck jobs`);
    
    for (const job of stuckJobs) {
      await supabase
        .from('generation_queue')
        .update({
          status: 'retry',
          attempts: job.attempts,
          error_message: 'Job stuck in processing',
          next_retry_at: new Date().toISOString()
        })
        .eq('id', job.id);
    }
  }
}

// Main handler
serve(async (req: Request) => {
  // Add CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { action } = await req.json();
    
    switch (action) {
      case 'process':
        await processQueue();
        break;
        
      case 'cleanup':
        await handleDeadLetterQueue();
        break;
        
      default:
        // Default action is to process queue
        await processQueue();
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Queue processed' }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );

  } catch (error) {
    console.error('Worker error:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
});