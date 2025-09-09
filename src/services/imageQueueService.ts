import { supabase } from '../lib/supabase';

export interface QueueJob {
  id: string;
  user_id: string;
  session_id?: string;
  design_id?: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retry';
  priority: number;
  result_url?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

export class ImageQueueService {
  /**
   * Add a new image generation job to the queue
   */
  static async enqueueJob(params: {
    userId: string;
    prompt: string;
    sessionId?: string;
    designId?: string;
    priority?: number;
    metadata?: Record<string, any>;
  }): Promise<QueueJob> {
    const { data, error } = await supabase
      .from('generation_queue')
      .insert({
        user_id: params.userId,
        prompt: params.prompt,
        session_id: params.sessionId,
        design_id: params.designId,
        priority: params.priority || 0,
        metadata: params.metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    
    // Trigger the worker function asynchronously
    this.triggerWorker().catch(console.error);
    
    return data;
  }

  /**
   * Get the status of a job
   */
  static async getJobStatus(jobId: string): Promise<QueueJob | null> {
    const { data, error } = await supabase
      .from('generation_queue')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      console.error('Error fetching job status:', error);
      return null;
    }

    return data;
  }

  /**
   * Poll for job completion
   */
  static async waitForJob(
    jobId: string, 
    options: { 
      maxWaitMs?: number; 
      pollIntervalMs?: number;
      onProgress?: (job: QueueJob) => void;
    } = {}
  ): Promise<QueueJob | null> {
    const maxWait = options.maxWaitMs || 60000; // 1 minute default
    const pollInterval = options.pollIntervalMs || 2000; // 2 seconds default
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const job = await this.getJobStatus(jobId);
      
      if (!job) return null;
      
      if (options.onProgress) {
        options.onProgress(job);
      }

      if (job.status === 'completed' || job.status === 'failed') {
        return job;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return null; // Timeout
  }

  /**
   * Get user's queue position
   */
  static async getQueuePosition(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('generation_queue')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'processing'])
      .lt('created_at', new Date().toISOString());

    if (error) {
      console.error('Error getting queue position:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Cancel a pending job
   */
  static async cancelJob(jobId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('generation_queue')
      .update({ status: 'failed', error_message: 'Cancelled by user' })
      .eq('id', jobId)
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error cancelling job:', error);
      return false;
    }

    return true;
  }

  /**
   * Get user's recent jobs
   */
  static async getUserJobs(userId: string, limit = 10): Promise<QueueJob[]> {
    const { data, error } = await supabase
      .from('generation_queue')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user jobs:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Trigger the worker function to process queue
   */
  private static async triggerWorker(): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('image-queue-worker', {
        body: { action: 'process' }
      });

      if (error) {
        console.error('Error triggering worker:', error);
      }
    } catch (error) {
      console.error('Failed to trigger worker:', error);
    }
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    avgWaitTime: number;
  }> {
    const { data, error } = await supabase
      .from('generation_queue')
      .select('status, created_at, started_at, completed_at');

    if (error || !data) {
      console.error('Error fetching queue stats:', error);
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        avgWaitTime: 0
      };
    }

    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      avgWaitTime: 0
    };

    let totalWaitTime = 0;
    let completedCount = 0;

    data.forEach(job => {
      stats[job.status]++;
      
      if (job.status === 'completed' && job.started_at && job.created_at) {
        const waitTime = new Date(job.started_at).getTime() - new Date(job.created_at).getTime();
        totalWaitTime += waitTime;
        completedCount++;
      }
    });

    if (completedCount > 0) {
      stats.avgWaitTime = Math.round(totalWaitTime / completedCount / 1000); // Convert to seconds
    }

    return stats;
  }

  /**
   * Retry failed jobs for a user
   */
  static async retryFailedJobs(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('generation_queue')
      .update({ 
        status: 'pending',
        attempts: 0,
        error_message: null 
      })
      .eq('user_id', userId)
      .eq('status', 'failed')
      .select();

    if (error) {
      console.error('Error retrying failed jobs:', error);
      return 0;
    }

    // Trigger worker to process retried jobs
    if (data && data.length > 0) {
      this.triggerWorker().catch(console.error);
    }

    return data?.length || 0;
  }
}