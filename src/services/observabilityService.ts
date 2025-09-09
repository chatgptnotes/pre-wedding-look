import { supabase } from '../lib/supabase';

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export class ObservabilityService {
  private static requestIdMap = new Map<string, string>();

  static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static setRequestId(context: string, requestId: string): void {
    this.requestIdMap.set(context, requestId);
  }

  static getRequestId(context: string): string | undefined {
    return this.requestIdMap.get(context);
  }

  static log(entry: Omit<LogEntry, 'timestamp'>): void {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console[entry.level](logEntry);
    }

    // Send to database in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToDatabase(logEntry).catch(console.error);
    }
  }

  private static async sendToDatabase(entry: LogEntry): Promise<void> {
    await supabase.from('application_logs').insert(entry);
  }

  static trackPerformance(operation: string, duration: number): void {
    this.log({
      level: 'info',
      message: `Performance: ${operation}`,
      metadata: { duration, operation }
    });
  }

  static trackError(error: Error, context?: Record<string, any>): void {
    this.log({
      level: 'error',
      message: error.message,
      metadata: {
        stack: error.stack,
        ...context
      }
    });
  }
}