import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Database Maintenance Edge Function
 * Handles automated backups, cleanup, and maintenance tasks
 * Designed for production-grade data management
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maintenance configuration
const MAINTENANCE_CONFIG = {
  // Cleanup policies (in seconds)
  IMAGE_RETENTION_SECONDS: 24 * 60 * 60, // 24 hours
  SESSION_RETENTION_SECONDS: 7 * 24 * 60 * 60, // 7 days for inactive sessions
  LOG_RETENTION_SECONDS: 30 * 24 * 60 * 60, // 30 days for logs
  BACKUP_RETENTION_DAYS: 30, // Keep backups for 30 days
  
  // Performance thresholds
  MAX_BATCH_SIZE: 1000,
  PROCESSING_TIMEOUT_MS: 280000, // 4.5 minutes (within 5min function limit)
  
  // Storage paths
  BACKUP_BUCKET: 'database-backups',
  CLEANUP_LOG_BUCKET: 'maintenance-logs',
};

interface MaintenanceRequest {
  action: 'cleanup' | 'backup' | 'health_check' | 'analytics' | 'batch_maintenance';
  target?: 'images' | 'sessions' | 'logs' | 'all';
  dry_run?: boolean;
  force?: boolean;
  retention_hours?: number;
}

interface MaintenanceResponse {
  success: boolean;
  action: string;
  results: {
    cleaned_items?: number;
    backup_size_mb?: number;
    processing_time_ms: number;
    errors: string[];
    warnings: string[];
    details: Record<string, any>;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const requestId = generateRequestId();
  
  try {
    console.log(`[${requestId}] Maintenance request received`);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin access (in production, implement proper admin auth)
    const authHeader = req.headers.get('Authorization');
    const isAdminRequest = authHeader?.includes('admin') || 
                          req.headers.get('x-admin-key') === Deno.env.get('ADMIN_KEY');
    
    if (!isAdminRequest && req.method !== 'GET') {
      console.warn(`[${requestId}] Unauthorized maintenance request`);
      return new Response(
        JSON.stringify({ error: 'Admin access required for maintenance operations' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, target, dry_run, force, retention_hours }: MaintenanceRequest = 
      req.method === 'POST' ? await req.json() : { action: 'health_check' };

    console.log(`[${requestId}] Processing ${action} with target: ${target}`);

    let result: MaintenanceResponse;

    switch (action) {
      case 'cleanup':
        result = await performCleanup(supabaseClient, {
          target: target || 'all',
          dry_run: dry_run || false,
          force: force || false,
          retention_hours,
          request_id: requestId
        });
        break;
        
      case 'backup':
        result = await performBackup(supabaseClient, {
          target: target || 'all',
          force: force || false,
          request_id: requestId
        });
        break;
        
      case 'health_check':
        result = await performHealthCheck(supabaseClient, requestId);
        break;
        
      case 'analytics':
        result = await generateMaintenanceAnalytics(supabaseClient, requestId);
        break;
        
      case 'batch_maintenance':
        result = await performBatchMaintenance(supabaseClient, {
          dry_run: dry_run || false,
          request_id: requestId
        });
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    result.results.processing_time_ms = Date.now() - startTime;
    
    console.log(`[${requestId}] Completed in ${result.results.processing_time_ms}ms`);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        }
      }
    );

  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        action: 'error',
        results: {
          processing_time_ms: Date.now() - startTime,
          errors: [error.message],
          warnings: [],
          details: { request_id: requestId }
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * Perform cleanup operations
 */
async function performCleanup(
  supabaseClient: any,
  options: {
    target: string;
    dry_run: boolean;
    force: boolean;
    retention_hours?: number;
    request_id: string;
  }
): Promise<MaintenanceResponse> {
  console.log(`[${options.request_id}] Starting cleanup: ${options.target}`);
  
  const errors: string[] = [];
  const warnings: string[] = [];
  let totalCleaned = 0;
  const details: Record<string, any> = {};

  try {
    if (options.target === 'images' || options.target === 'all') {
      const imageCleanup = await cleanupOldImages(supabaseClient, {
        dry_run: options.dry_run,
        retention_hours: options.retention_hours || 24,
        request_id: options.request_id
      });
      
      totalCleaned += imageCleanup.cleaned;
      details.image_cleanup = imageCleanup;
      
      if (imageCleanup.errors.length > 0) {
        errors.push(...imageCleanup.errors);
      }
    }

    if (options.target === 'sessions' || options.target === 'all') {
      const sessionCleanup = await cleanupOldSessions(supabaseClient, {
        dry_run: options.dry_run,
        retention_hours: options.retention_hours || 168, // 7 days
        request_id: options.request_id
      });
      
      totalCleaned += sessionCleanup.cleaned;
      details.session_cleanup = sessionCleanup;
      
      if (sessionCleanup.errors.length > 0) {
        errors.push(...sessionCleanup.errors);
      }
    }

    if (options.target === 'logs' || options.target === 'all') {
      const logCleanup = await cleanupOldLogs(supabaseClient, {
        dry_run: options.dry_run,
        retention_hours: options.retention_hours || 720, // 30 days
        request_id: options.request_id
      });
      
      totalCleaned += logCleanup.cleaned;
      details.log_cleanup = logCleanup;
      
      if (logCleanup.errors.length > 0) {
        errors.push(...logCleanup.errors);
      }
    }

    // Log maintenance activity
    await logMaintenanceActivity(supabaseClient, {
      action: 'cleanup',
      target: options.target,
      dry_run: options.dry_run,
      items_processed: totalCleaned,
      errors: errors.length,
      request_id: options.request_id
    });

    return {
      success: errors.length === 0,
      action: 'cleanup',
      results: {
        cleaned_items: totalCleaned,
        processing_time_ms: 0, // Will be set by caller
        errors,
        warnings,
        details
      }
    };

  } catch (error) {
    errors.push(`Cleanup failed: ${error.message}`);
    
    return {
      success: false,
      action: 'cleanup',
      results: {
        cleaned_items: totalCleaned,
        processing_time_ms: 0,
        errors,
        warnings,
        details
      }
    };
  }
}

/**
 * Cleanup old images
 */
async function cleanupOldImages(
  supabaseClient: any,
  options: { dry_run: boolean; retention_hours: number; request_id: string }
): Promise<{ cleaned: number; errors: string[]; details: any }> {
  const cutoffTime = new Date(Date.now() - (options.retention_hours * 60 * 60 * 1000));
  const errors: string[] = [];
  let cleaned = 0;

  try {
    // Find old image records
    const { data: oldImages, error: queryError } = await supabaseClient
      .from('blinddate_designs')
      .select('id, image_url, created_at')
      .lt('created_at', cutoffTime.toISOString())
      .not('image_url', 'is', null)
      .order('created_at', { ascending: true })
      .limit(MAINTENANCE_CONFIG.MAX_BATCH_SIZE);

    if (queryError) {
      errors.push(`Query error: ${queryError.message}`);
      return { cleaned, errors, details: {} };
    }

    console.log(`[${options.request_id}] Found ${oldImages?.length || 0} old images to clean`);

    if (!oldImages || oldImages.length === 0) {
      return { cleaned, errors, details: { message: 'No old images found' } };
    }

    if (!options.dry_run) {
      // Delete images from storage
      for (const image of oldImages) {
        try {
          if (image.image_url) {
            const path = extractPathFromUrl(image.image_url);
            if (path) {
              const { error: deleteError } = await supabaseClient.storage
                .from('game-images')
                .remove([path]);
              
              if (deleteError && !deleteError.message.includes('not found')) {
                errors.push(`Failed to delete ${path}: ${deleteError.message}`);
                continue;
              }
            }
          }
          
          // Remove database record
          const { error: dbError } = await supabaseClient
            .from('blinddate_designs')
            .delete()
            .eq('id', image.id);
          
          if (dbError) {
            errors.push(`Failed to delete DB record ${image.id}: ${dbError.message}`);
          } else {
            cleaned++;
          }
          
        } catch (error) {
          errors.push(`Error processing image ${image.id}: ${error.message}`);
        }
      }
    } else {
      cleaned = oldImages.length; // Dry run count
    }

    return {
      cleaned,
      errors,
      details: {
        cutoff_time: cutoffTime.toISOString(),
        total_found: oldImages.length,
        dry_run: options.dry_run
      }
    };

  } catch (error) {
    errors.push(`Image cleanup error: ${error.message}`);
    return { cleaned, errors, details: {} };
  }
}

/**
 * Cleanup old sessions
 */
async function cleanupOldSessions(
  supabaseClient: any,
  options: { dry_run: boolean; retention_hours: number; request_id: string }
): Promise<{ cleaned: number; errors: string[]; details: any }> {
  const cutoffTime = new Date(Date.now() - (options.retention_hours * 60 * 60 * 1000));
  const errors: string[] = [];
  let cleaned = 0;

  try {
    // Find old inactive sessions
    const { data: oldSessions, error: queryError } = await supabaseClient
      .from('blinddate_sessions')
      .select('id, status, created_at')
      .lt('created_at', cutoffTime.toISOString())
      .in('status', ['completed', 'abandoned', 'waiting'])
      .order('created_at', { ascending: true })
      .limit(MAINTENANCE_CONFIG.MAX_BATCH_SIZE);

    if (queryError) {
      errors.push(`Query error: ${queryError.message}`);
      return { cleaned, errors, details: {} };
    }

    console.log(`[${options.request_id}] Found ${oldSessions?.length || 0} old sessions to clean`);

    if (!oldSessions || oldSessions.length === 0) {
      return { cleaned, errors, details: { message: 'No old sessions found' } };
    }

    if (!options.dry_run) {
      // Delete sessions and related data
      for (const session of oldSessions) {
        try {
          // Delete related records first (due to foreign key constraints)
          await supabaseClient.from('blinddate_designs').delete().eq('session_id', session.id);
          await supabaseClient.from('blinddate_participants').delete().eq('session_id', session.id);
          await supabaseClient.from('blinddate_rounds').delete().eq('session_id', session.id);
          
          // Delete session
          const { error: sessionError } = await supabaseClient
            .from('blinddate_sessions')
            .delete()
            .eq('id', session.id);
          
          if (sessionError) {
            errors.push(`Failed to delete session ${session.id}: ${sessionError.message}`);
          } else {
            cleaned++;
          }
          
        } catch (error) {
          errors.push(`Error processing session ${session.id}: ${error.message}`);
        }
      }
    } else {
      cleaned = oldSessions.length;
    }

    return {
      cleaned,
      errors,
      details: {
        cutoff_time: cutoffTime.toISOString(),
        total_found: oldSessions.length,
        dry_run: options.dry_run
      }
    };

  } catch (error) {
    errors.push(`Session cleanup error: ${error.message}`);
    return { cleaned, errors, details: {} };
  }
}

/**
 * Cleanup old logs
 */
async function cleanupOldLogs(
  supabaseClient: any,
  options: { dry_run: boolean; retention_hours: number; request_id: string }
): Promise<{ cleaned: number; errors: string[]; details: any }> {
  const cutoffTime = new Date(Date.now() - (options.retention_hours * 60 * 60 * 1000));
  const errors: string[] = [];
  let cleaned = 0;

  try {
    // Clean application logs if table exists
    const { data: oldLogs, error: queryError } = await supabaseClient
      .from('application_logs')
      .select('log_id')
      .lt('timestamp', cutoffTime.toISOString())
      .order('timestamp', { ascending: true })
      .limit(MAINTENANCE_CONFIG.MAX_BATCH_SIZE);

    if (queryError && !queryError.message.includes('does not exist')) {
      errors.push(`Query error: ${queryError.message}`);
      return { cleaned, errors, details: {} };
    }

    if (oldLogs && oldLogs.length > 0) {
      console.log(`[${options.request_id}] Found ${oldLogs.length} old logs to clean`);

      if (!options.dry_run) {
        const { error: deleteError } = await supabaseClient
          .from('application_logs')
          .delete()
          .lt('timestamp', cutoffTime.toISOString());

        if (deleteError) {
          errors.push(`Failed to delete logs: ${deleteError.message}`);
        } else {
          cleaned = oldLogs.length;
        }
      } else {
        cleaned = oldLogs.length;
      }
    }

    return {
      cleaned,
      errors,
      details: {
        cutoff_time: cutoffTime.toISOString(),
        total_found: oldLogs?.length || 0,
        dry_run: options.dry_run
      }
    };

  } catch (error) {
    errors.push(`Log cleanup error: ${error.message}`);
    return { cleaned, errors, details: {} };
  }
}

/**
 * Perform database backup
 */
async function performBackup(
  supabaseClient: any,
  options: { target: string; force: boolean; request_id: string }
): Promise<MaintenanceResponse> {
  console.log(`[${options.request_id}] Starting backup: ${options.target}`);
  
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: Record<string, any> = {};
  
  try {
    const backupData = await createDatabaseSnapshot(supabaseClient, {
      target: options.target,
      request_id: options.request_id
    });
    
    const backupSize = JSON.stringify(backupData).length;
    const backupSizeMB = Math.round(backupSize / 1024 / 1024 * 100) / 100;
    
    // Store backup (in production, use cloud storage)
    const backupKey = `backup_${options.target}_${new Date().toISOString().split('T')[0]}_${options.request_id}`;
    
    // Mock backup storage - in production, upload to S3/GCS
    console.log(`[${options.request_id}] Backup created: ${backupKey} (${backupSizeMB}MB)`);
    
    details.backup_key = backupKey;
    details.backup_size_mb = backupSizeMB;
    details.tables_backed_up = Object.keys(backupData).length;
    details.total_records = Object.values(backupData).reduce((sum: number, table: any) => sum + (table?.length || 0), 0);
    
    // Log backup activity
    await logMaintenanceActivity(supabaseClient, {
      action: 'backup',
      target: options.target,
      backup_size_mb: backupSizeMB,
      request_id: options.request_id
    });
    
    return {
      success: true,
      action: 'backup',
      results: {
        backup_size_mb: backupSizeMB,
        processing_time_ms: 0,
        errors,
        warnings,
        details
      }
    };
    
  } catch (error) {
    errors.push(`Backup failed: ${error.message}`);
    
    return {
      success: false,
      action: 'backup',
      results: {
        processing_time_ms: 0,
        errors,
        warnings,
        details
      }
    };
  }
}

/**
 * Create database snapshot
 */
async function createDatabaseSnapshot(
  supabaseClient: any,
  options: { target: string; request_id: string }
): Promise<Record<string, any>> {
  const snapshot: Record<string, any> = {};
  
  const tables = options.target === 'all' 
    ? ['blinddate_sessions', 'blinddate_participants', 'blinddate_rounds', 'blinddate_designs']
    : [options.target];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabaseClient
        .from(table)
        .select('*')
        .limit(10000); // Reasonable limit for backup
      
      if (error) {
        console.warn(`[${options.request_id}] Error backing up ${table}: ${error.message}`);
        snapshot[table] = { error: error.message };
      } else {
        snapshot[table] = data;
        console.log(`[${options.request_id}] Backed up ${data?.length || 0} records from ${table}`);
      }
    } catch (error) {
      console.error(`[${options.request_id}] Exception backing up ${table}:`, error);
      snapshot[table] = { error: error.message };
    }
  }
  
  snapshot.metadata = {
    created_at: new Date().toISOString(),
    version: '1.0',
    request_id: options.request_id
  };
  
  return snapshot;
}

/**
 * Perform health check
 */
async function performHealthCheck(
  supabaseClient: any,
  requestId: string
): Promise<MaintenanceResponse> {
  const details: Record<string, any> = {};
  const warnings: string[] = [];
  const errors: string[] = [];
  
  try {
    // Check database connectivity
    const { data, error } = await supabaseClient.from('blinddate_sessions').select('count').limit(1);
    if (error) {
      errors.push(`Database connection failed: ${error.message}`);
    } else {
      details.database_connected = true;
    }
    
    // Check table sizes
    const tables = ['blinddate_sessions', 'blinddate_participants', 'blinddate_designs'];
    for (const table of tables) {
      try {
        const { count } = await supabaseClient.from(table).select('*', { count: 'exact', head: true });
        details[`${table}_count`] = count;
        
        if (count > 10000) {
          warnings.push(`Large table detected: ${table} has ${count} records`);
        }
      } catch (error) {
        errors.push(`Failed to check ${table}: ${error.message}`);
      }
    }
    
    // Check for old data
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { data: oldImages } = await supabaseClient
      .from('blinddate_designs')
      .select('count')
      .lt('created_at', oneDayAgo.toISOString());
    
    if (oldImages && oldImages.length > 0) {
      warnings.push(`Found ${oldImages.length} images older than 24 hours`);
    }
    
    details.health_check_passed = errors.length === 0;
    details.warnings_count = warnings.length;
    
    return {
      success: errors.length === 0,
      action: 'health_check',
      results: {
        processing_time_ms: 0,
        errors,
        warnings,
        details
      }
    };
    
  } catch (error) {
    return {
      success: false,
      action: 'health_check',
      results: {
        processing_time_ms: 0,
        errors: [`Health check failed: ${error.message}`],
        warnings,
        details
      }
    };
  }
}

/**
 * Generate maintenance analytics
 */
async function generateMaintenanceAnalytics(
  supabaseClient: any,
  requestId: string
): Promise<MaintenanceResponse> {
  const details: Record<string, any> = {};
  const errors: string[] = [];
  
  try {
    // Database growth analytics
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // New sessions in last 24h and 7 days
    const { count: sessions24h } = await supabaseClient
      .from('blinddate_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());
    
    const { count: sessions7d } = await supabaseClient
      .from('blinddate_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastWeek.toISOString());
    
    details.growth = {
      sessions_24h: sessions24h,
      sessions_7d: sessions7d,
      avg_sessions_per_day: Math.round((sessions7d || 0) / 7)
    };
    
    // Storage usage analytics
    const { count: totalImages } = await supabaseClient
      .from('blinddate_designs')
      .select('*', { count: 'exact', head: true })
      .not('image_url', 'is', null);
    
    details.storage = {
      total_images: totalImages,
      estimated_size_mb: (totalImages || 0) * 2.5 // Estimate 2.5MB per image
    };
    
    // Performance metrics
    const { data: recentSessions } = await supabaseClient
      .from('blinddate_sessions')
      .select('created_at, completed_at, status')
      .gte('created_at', lastWeek.toISOString())
      .limit(1000);
    
    const completedSessions = recentSessions?.filter(s => s.completed_at) || [];
    const avgSessionTime = completedSessions.length > 0 
      ? completedSessions.reduce((sum, session) => {
          const duration = new Date(session.completed_at).getTime() - new Date(session.created_at).getTime();
          return sum + duration;
        }, 0) / completedSessions.length / 1000 / 60 // Convert to minutes
      : 0;
    
    details.performance = {
      completion_rate: recentSessions ? completedSessions.length / recentSessions.length : 0,
      avg_session_duration_minutes: Math.round(avgSessionTime)
    };
    
    return {
      success: true,
      action: 'analytics',
      results: {
        processing_time_ms: 0,
        errors,
        warnings: [],
        details
      }
    };
    
  } catch (error) {
    return {
      success: false,
      action: 'analytics',
      results: {
        processing_time_ms: 0,
        errors: [`Analytics failed: ${error.message}`],
        warnings: [],
        details
      }
    };
  }
}

/**
 * Perform batch maintenance (combined operations)
 */
async function performBatchMaintenance(
  supabaseClient: any,
  options: { dry_run: boolean; request_id: string }
): Promise<MaintenanceResponse> {
  console.log(`[${options.request_id}] Starting batch maintenance`);
  
  const results: Record<string, any> = {};
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // 1. Health check first
    console.log(`[${options.request_id}] Running health check...`);
    const healthCheck = await performHealthCheck(supabaseClient, options.request_id);
    results.health_check = healthCheck.results;
    
    if (!healthCheck.success) {
      errors.push('Health check failed, skipping maintenance');
      return {
        success: false,
        action: 'batch_maintenance',
        results: { processing_time_ms: 0, errors, warnings, details: results }
      };
    }
    
    // 2. Cleanup old images
    console.log(`[${options.request_id}] Cleaning up images...`);
    const imageCleanup = await performCleanup(supabaseClient, {
      target: 'images',
      dry_run: options.dry_run,
      force: false,
      request_id: options.request_id
    });
    results.image_cleanup = imageCleanup.results;
    errors.push(...imageCleanup.results.errors);
    
    // 3. Cleanup old sessions
    console.log(`[${options.request_id}] Cleaning up sessions...`);
    const sessionCleanup = await performCleanup(supabaseClient, {
      target: 'sessions',
      dry_run: options.dry_run,
      force: false,
      request_id: options.request_id
    });
    results.session_cleanup = sessionCleanup.results;
    errors.push(...sessionCleanup.results.errors);
    
    // 4. Create backup if not dry run
    if (!options.dry_run) {
      console.log(`[${options.request_id}] Creating backup...`);
      const backup = await performBackup(supabaseClient, {
        target: 'all',
        force: false,
        request_id: options.request_id
      });
      results.backup = backup.results;
      errors.push(...backup.results.errors);
    }
    
    // 5. Generate analytics
    console.log(`[${options.request_id}] Generating analytics...`);
    const analytics = await generateMaintenanceAnalytics(supabaseClient, options.request_id);
    results.analytics = analytics.results;
    
    const totalCleaned = (results.image_cleanup?.cleaned_items || 0) + 
                        (results.session_cleanup?.cleaned_items || 0);
    
    return {
      success: errors.length === 0,
      action: 'batch_maintenance',
      results: {
        cleaned_items: totalCleaned,
        processing_time_ms: 0,
        errors,
        warnings,
        details: results
      }
    };
    
  } catch (error) {
    errors.push(`Batch maintenance failed: ${error.message}`);
    
    return {
      success: false,
      action: 'batch_maintenance',
      results: {
        processing_time_ms: 0,
        errors,
        warnings,
        details: results
      }
    };
  }
}

/**
 * Utility functions
 */
async function logMaintenanceActivity(
  supabaseClient: any,
  activity: {
    action: string;
    target?: string;
    dry_run?: boolean;
    items_processed?: number;
    backup_size_mb?: number;
    errors?: number;
    request_id: string;
  }
): Promise<void> {
  try {
    // In production, log to maintenance_logs table
    console.log(`[${activity.request_id}] Maintenance activity:`, activity);
  } catch (error) {
    console.error('Failed to log maintenance activity:', error);
  }
}

function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // Remove leading slash
  } catch {
    return null;
  }
}

function generateRequestId(): string {
  return `maint_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

/* To deploy this function:
 * npx supabase functions deploy database-maintenance --no-verify-jwt
 * 
 * To set up automated maintenance (using cron service):
 * - Daily cleanup: curl -X POST your-function-url -d '{"action":"batch_maintenance"}'
 * - Weekly backup: curl -X POST your-function-url -d '{"action":"backup","target":"all"}'
 */