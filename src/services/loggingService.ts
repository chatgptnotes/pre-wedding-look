/**
 * Structured Logging Service with Performance Monitoring
 * Provides comprehensive logging with request IDs and performance tracking
 */

import { supabase } from '../lib/supabase';

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

// Log categories
export enum LogCategory {
  AUTH = 'auth',
  GAME = 'game',
  AI_GENERATION = 'ai_generation',
  PERFORMANCE = 'performance',
  USER_ACTION = 'user_action',
  API_CALL = 'api_call',
  ERROR = 'error',
  SECURITY = 'security',
  DATABASE = 'database',
  CACHE = 'cache'
}

// Performance metrics
interface PerformanceMetric {
  operation: string;
  duration: number;
  startTime: number;
  endTime: number;
  metadata?: Record<string, any>;
}

// Log entry structure
interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  stack?: string;
  performance?: PerformanceMetric;
}

class StructuredLogger {
  private requestId: string = '';
  private userId: string = '';
  private sessionId: string = '';
  private performanceTrackers = new Map<string, { startTime: number; metadata?: any }>();
  private logBuffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.generateRequestId();
    this.startBuffering();
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    this.requestId = `req_${timestamp}_${random}`;
    return this.requestId;
  }

  /**
   * Set context information
   */
  setContext(context: {
    requestId?: string;
    userId?: string;
    sessionId?: string;
  }): void {
    if (context.requestId) this.requestId = context.requestId;
    if (context.userId) this.userId = context.userId;
    if (context.sessionId) this.sessionId = context.sessionId;
  }

  /**
   * Create structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      requestId: this.requestId,
      userId: this.userId,
      sessionId: this.sessionId,
      metadata,
      stack: error?.stack
    };
  }

  /**
   * Log methods for different levels
   */
  debug(category: LogCategory, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, category, message, metadata);
  }

  info(category: LogCategory, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, category, message, metadata);
  }

  warn(category: LogCategory, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, category, message, metadata);
  }

  error(category: LogCategory, message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, category, message, metadata, error);
  }

  fatal(category: LogCategory, message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.FATAL, category, message, metadata, error);
    // Immediately flush fatal errors
    this.flush();
  }

  /**
   * Main logging method
   */
  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ): void {
    const entry = this.createLogEntry(level, category, message, metadata, error);
    
    // Console output with color coding
    this.consoleLog(entry);
    
    // Add to buffer for batch processing
    this.logBuffer.push(entry);
    
    // Immediate flush for high severity
    if (level >= LogLevel.ERROR) {
      this.flush();
    }
  }

  /**
   * Console logging with colors
   */
  private consoleLog(entry: LogEntry): void {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.FATAL]: '\x1b[35m'  // Magenta
    };
    
    const reset = '\x1b[0m';
    const color = colors[entry.level] || reset;
    
    const levelName = LogLevel[entry.level];
    const prefix = `${color}[${levelName}] ${entry.category} (${entry.requestId})${reset}`;
    
    console.log(`${prefix} ${entry.message}`, entry.metadata || '');
    
    if (entry.stack) {
      console.error(entry.stack);
    }
  }

  /**
   * Performance tracking
   */
  startPerformanceTracking(operation: string, metadata?: Record<string, any>): string {
    const trackerId = `${operation}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    this.performanceTrackers.set(trackerId, {
      startTime: performance.now(),
      metadata
    });
    
    this.debug(LogCategory.PERFORMANCE, `Started tracking: ${operation}`, { 
      trackerId, 
      operation,
      ...metadata 
    });
    
    return trackerId;
  }

  endPerformanceTracking(trackerId: string): PerformanceMetric | null {
    const tracker = this.performanceTrackers.get(trackerId);
    if (!tracker) {
      this.warn(LogCategory.PERFORMANCE, `Performance tracker not found: ${trackerId}`);
      return null;
    }
    
    const endTime = performance.now();
    const duration = endTime - tracker.startTime;
    
    const metric: PerformanceMetric = {
      operation: trackerId.split('_')[0],
      duration,
      startTime: tracker.startTime,
      endTime,
      metadata: tracker.metadata
    };
    
    this.performanceTrackers.delete(trackerId);
    
    // Log performance metric
    const entry = this.createLogEntry(
      LogLevel.INFO,
      LogCategory.PERFORMANCE,
      `Performance: ${metric.operation} completed in ${duration.toFixed(2)}ms`,
      { ...metric, trackerId }
    );
    entry.performance = metric;
    
    this.consoleLog(entry);
    this.logBuffer.push(entry);
    
    return metric;
  }

  /**
   * Measure function execution time
   */
  async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const trackerId = this.startPerformanceTracking(operation, metadata);
    
    try {
      const result = await fn();
      this.endPerformanceTracking(trackerId);
      return result;
    } catch (error) {
      this.endPerformanceTracking(trackerId);
      this.error(LogCategory.PERFORMANCE, `Performance tracking failed for ${operation}`, error as Error);
      throw error;
    }
  }

  measureSync<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const trackerId = this.startPerformanceTracking(operation, metadata);
    
    try {
      const result = fn();
      this.endPerformanceTracking(trackerId);
      return result;
    } catch (error) {
      this.endPerformanceTracking(trackerId);
      this.error(LogCategory.PERFORMANCE, `Performance tracking failed for ${operation}`, error as Error);
      throw error;
    }
  }

  /**
   * User action tracking
   */
  trackUserAction(
    action: string,
    details?: Record<string, any>
  ): void {
    this.info(LogCategory.USER_ACTION, `User action: ${action}`, {
      action,
      timestamp: Date.now(),
      ...details
    });
  }

  /**
   * API call logging
   */
  logApiCall(
    method: string,
    url: string,
    statusCode?: number,
    duration?: number,
    metadata?: Record<string, any>
  ): void {
    const level = statusCode && statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    
    this.log(level, LogCategory.API_CALL, `${method} ${url}`, {
      method,
      url,
      statusCode,
      duration,
      ...metadata
    });
  }

  /**
   * Security event logging
   */
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details?: Record<string, any>
  ): void {
    const levelMap = {
      low: LogLevel.INFO,
      medium: LogLevel.WARN,
      high: LogLevel.ERROR,
      critical: LogLevel.FATAL
    };
    
    this.log(levelMap[severity], LogCategory.SECURITY, `Security event: ${event}`, {
      event,
      severity,
      ...details
    });
  }

  /**
   * Database operation logging
   */
  logDatabaseOperation(
    operation: string,
    table: string,
    duration?: number,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    const level = error ? LogLevel.ERROR : LogLevel.DEBUG;
    
    this.log(level, LogCategory.DATABASE, `DB ${operation} on ${table}`, {
      operation,
      table,
      duration,
      success: !error,
      ...metadata
    }, error);
  }

  /**
   * Batch flush logs to storage
   */
  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;
    
    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];
    
    try {
      // Store in Supabase for analysis
      await supabase.from('application_logs').insert(
        logsToFlush.map(log => ({
          log_id: log.id,
          timestamp: log.timestamp,
          level: LogLevel[log.level],
          category: log.category,
          message: log.message,
          request_id: log.requestId,
          user_id: log.userId,
          session_id: log.sessionId,
          metadata: log.metadata,
          stack_trace: log.stack,
          performance_data: log.performance
        }))
      );
    } catch (error) {
      console.error('Failed to flush logs to database:', error);
      // Re-add to buffer for retry
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  /**
   * Start automatic buffer flushing
   */
  private startBuffering(): void {
    // Flush every 10 seconds
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 10000);
  }

  /**
   * Stop logging service
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush(); // Final flush
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    activeTrackers: number;
    averageResponseTime: number;
    slowOperations: any[];
  } {
    const recentLogs = this.logBuffer.filter(log => 
      log.performance && 
      Date.now() - new Date(log.timestamp).getTime() < 300000 // Last 5 minutes
    );
    
    const performanceEntries = recentLogs
      .map(log => log.performance)
      .filter(Boolean) as PerformanceMetric[];
    
    const averageResponseTime = performanceEntries.length > 0 
      ? performanceEntries.reduce((sum, metric) => sum + metric.duration, 0) / performanceEntries.length
      : 0;
    
    const slowOperations = performanceEntries
      .filter(metric => metric.duration > 1000) // Operations taking more than 1 second
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10); // Top 10 slowest
    
    return {
      activeTrackers: this.performanceTrackers.size,
      averageResponseTime,
      slowOperations
    };
  }
}

// Singleton logger instance
export const logger = new StructuredLogger();

// Middleware for Express-like frameworks
export function createLoggingMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const requestId = logger['generateRequestId']();
    
    // Set request context
    logger.setContext({
      requestId,
      userId: req.user?.id,
      sessionId: req.sessionID || req.headers['x-session-id']
    });
    
    // Track request
    logger.info(LogCategory.API_CALL, `Incoming request: ${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const duration = Date.now() - startTime;
      
      logger.logApiCall(
        req.method,
        req.path,
        res.statusCode,
        duration,
        {
          requestId,
          responseSize: res.get('Content-Length'),
          userAgent: req.get('User-Agent')
        }
      );
      
      originalEnd.apply(res, args);
    };
    
    next();
  };
}

// React hook for client-side logging
export function useLogging() {
  return {
    log: logger,
    trackUserAction: (action: string, details?: Record<string, any>) => {
      logger.trackUserAction(action, details);
    },
    measureAsync: logger.measureAsync.bind(logger),
    measureSync: logger.measureSync.bind(logger),
    setContext: logger.setContext.bind(logger)
  };
}

export { LogLevel, LogCategory };
export default logger;