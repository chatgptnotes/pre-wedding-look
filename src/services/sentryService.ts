/**
 * Sentry Integration Service for Error Tracking & Performance Monitoring
 * Provides comprehensive error reporting with context and performance insights
 */

import React from 'react';

// Mock Sentry implementation for development
// Replace with actual @sentry/react and @sentry/tracing in production

interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  beforeSend?: (event: any) => any | null;
  integrations?: any[];
}

interface SentryUser {
  id: string;
  email?: string;
  username?: string;
  segment?: string;
}

interface SentryContext {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  fingerprint?: string[];
}

// Mock Sentry API for development
class MockSentry {
  private isInitialized = false;
  private config: SentryConfig | null = null;
  private user: SentryUser | null = null;
  private globalTags: Record<string, string> = {};
  private globalContext: Record<string, any> = {};

  init(config: SentryConfig): void {
    this.config = config;
    this.isInitialized = true;
    console.log('Mock Sentry initialized with config:', config);
  }

  captureException(error: Error, context?: SentryContext): string {
    const eventId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    console.error('Sentry: Exception captured', {
      eventId,
      error: error.message,
      stack: error.stack,
      user: this.user,
      tags: { ...this.globalTags, ...context?.tags },
      extra: { ...this.globalContext, ...context?.extra },
      level: context?.level || 'error'
    });
    
    return eventId;
  }

  captureMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' = 'info', context?: SentryContext): string {
    const eventId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    console.log('Sentry: Message captured', {
      eventId,
      message,
      level,
      user: this.user,
      tags: { ...this.globalTags, ...context?.tags },
      extra: { ...this.globalContext, ...context?.extra }
    });
    
    return eventId;
  }

  setUser(user: SentryUser): void {
    this.user = user;
    console.log('Sentry: User set', user);
  }

  setTag(key: string, value: string): void {
    this.globalTags[key] = value;
  }

  setTags(tags: Record<string, string>): void {
    Object.assign(this.globalTags, tags);
  }

  setContext(key: string, context: any): void {
    this.globalContext[key] = context;
  }

  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: 'debug' | 'info' | 'warning' | 'error';
    data?: any;
  }): void {
    console.log('Sentry: Breadcrumb added', breadcrumb);
  }

  startTransaction(context: { name: string; op: string }): MockTransaction {
    return new MockTransaction(context.name, context.op);
  }

  withScope(callback: (scope: MockScope) => void): void {
    const scope = new MockScope();
    callback(scope);
  }
}

class MockTransaction {
  private startTime = Date.now();
  private spans: MockSpan[] = [];

  constructor(private name: string, private op: string) {}

  startChild(context: { op: string; description: string }): MockSpan {
    const span = new MockSpan(context.op, context.description);
    this.spans.push(span);
    return span;
  }

  setTag(key: string, value: string): void {
    console.log(`Transaction ${this.name}: Tag set`, { key, value });
  }

  setData(key: string, value: any): void {
    console.log(`Transaction ${this.name}: Data set`, { key, value });
  }

  finish(): void {
    const duration = Date.now() - this.startTime;
    console.log(`Transaction ${this.name} finished`, {
      op: this.op,
      duration: `${duration}ms`,
      spans: this.spans.length
    });
  }
}

class MockSpan {
  private startTime = Date.now();

  constructor(private op: string, private description: string) {}

  setTag(key: string, value: string): void {
    console.log(`Span ${this.description}: Tag set`, { key, value });
  }

  setData(key: string, value: any): void {
    console.log(`Span ${this.description}: Data set`, { key, value });
  }

  finish(): void {
    const duration = Date.now() - this.startTime;
    console.log(`Span ${this.description} finished`, {
      op: this.op,
      duration: `${duration}ms`
    });
  }
}

class MockScope {
  private tags: Record<string, string> = {};
  private context: Record<string, any> = {};
  private level: string = 'info';

  setTag(key: string, value: string): void {
    this.tags[key] = value;
  }

  setTags(tags: Record<string, string>): void {
    Object.assign(this.tags, tags);
  }

  setContext(key: string, context: any): void {
    this.context[key] = context;
  }

  setLevel(level: 'debug' | 'info' | 'warning' | 'error' | 'fatal'): void {
    this.level = level;
  }

  clear(): void {
    this.tags = {};
    this.context = {};
    this.level = 'info';
  }
}

// Mock Sentry instance
const mockSentry = new MockSentry();

// Sentry Service wrapper
export class SentryService {
  private static initialized = false;
  private static performanceTransactions = new Map<string, MockTransaction>();

  /**
   * Initialize Sentry with configuration
   */
  static init(options: {
    dsn?: string;
    environment?: string;
    enablePerformance?: boolean;
    enableSession?: boolean;
  } = {}): void {
    if (this.initialized) {
      console.warn('Sentry already initialized');
      return;
    }

    const config: SentryConfig = {
      dsn: options.dsn || process.env.VITE_SENTRY_DSN || 'mock_dsn',
      environment: options.environment || process.env.NODE_ENV || 'development',
      tracesSampleRate: options.enablePerformance ? 0.1 : 0,
      beforeSend: (event: any) => {
        // Filter out development errors
        if (config.environment === 'development') {
          console.log('Sentry event (development):', event);
          return null; // Don't send in development
        }
        return event;
      }
    };

    mockSentry.init(config);
    
    // Set global tags
    mockSentry.setTags({
      environment: config.environment,
      version: '1.0.0',
      feature: 'blind-date-game'
    });

    this.initialized = true;
    console.log('Sentry service initialized');
  }

  /**
   * Set user context
   */
  static setUser(user: {
    id: string;
    email?: string;
    username?: string;
    tier?: string;
  }): void {
    mockSentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      segment: user.tier || 'free'
    });
  }

  /**
   * Capture application errors with context
   */
  static captureError(
    error: Error,
    context: {
      category?: 'auth' | 'game' | 'ai' | 'api' | 'ui';
      level?: 'warning' | 'error' | 'fatal';
      tags?: Record<string, string>;
      extra?: Record<string, any>;
      user?: any;
    } = {}
  ): string {
    if (!this.initialized) this.init();

    // Add breadcrumb for error context
    mockSentry.addBreadcrumb({
      message: `Error in ${context.category || 'unknown'}: ${error.message}`,
      category: context.category || 'error',
      level: 'error',
      data: context.extra
    });

    return mockSentry.captureException(error, {
      level: context.level || 'error',
      tags: {
        category: context.category || 'unknown',
        ...context.tags
      },
      extra: context.extra
    });
  }

  /**
   * Capture custom messages/events
   */
  static captureMessage(
    message: string,
    level: 'debug' | 'info' | 'warning' | 'error' = 'info',
    context?: {
      tags?: Record<string, string>;
      extra?: Record<string, any>;
    }
  ): string {
    if (!this.initialized) this.init();

    return mockSentry.captureMessage(message, level, context);
  }

  /**
   * Track user actions as breadcrumbs
   */
  static addBreadcrumb(
    action: string,
    category: 'user' | 'navigation' | 'api' | 'game' = 'user',
    data?: Record<string, any>
  ): void {
    if (!this.initialized) this.init();

    mockSentry.addBreadcrumb({
      message: action,
      category,
      level: 'info',
      data: {
        timestamp: new Date().toISOString(),
        ...data
      }
    });
  }

  /**
   * Start performance transaction
   */
  static startTransaction(
    name: string,
    operation: 'navigation' | 'api' | 'game' | 'ai_generation' | 'custom',
    context?: Record<string, any>
  ): string {
    if (!this.initialized) this.init();

    const transactionId = `${operation}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const transaction = mockSentry.startTransaction({
      name,
      op: operation
    });

    // Set transaction context
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        transaction.setData(key, value);
      });
    }

    this.performanceTransactions.set(transactionId, transaction);
    return transactionId;
  }

  /**
   * Finish performance transaction
   */
  static finishTransaction(
    transactionId: string,
    status?: 'ok' | 'cancelled' | 'unknown' | 'invalid_argument' | 'deadline_exceeded' | 'not_found' | 'already_exists' | 'permission_denied' | 'resource_exhausted' | 'failed_precondition' | 'aborted' | 'out_of_range' | 'unimplemented' | 'internal' | 'unavailable' | 'data_loss' | 'unauthenticated',
    result?: any
  ): void {
    const transaction = this.performanceTransactions.get(transactionId);
    if (!transaction) {
      console.warn(`Transaction ${transactionId} not found`);
      return;
    }

    if (status) {
      transaction.setTag('status', status);
    }

    if (result) {
      transaction.setData('result', result);
    }

    transaction.finish();
    this.performanceTransactions.delete(transactionId);
  }

  /**
   * Create span within transaction
   */
  static createSpan(
    transactionId: string,
    operation: string,
    description: string
  ): string {
    const transaction = this.performanceTransactions.get(transactionId);
    if (!transaction) {
      console.warn(`Transaction ${transactionId} not found for span creation`);
      return '';
    }

    const spanId = `${operation}_${Date.now()}_${Math.random().toString(36).substring(2, 4)}`;
    const span = transaction.startChild({ op: operation, description });
    
    // Store span reference (simplified for mock)
    setTimeout(() => span.finish(), 0); // Auto-finish for demo
    
    return spanId;
  }

  /**
   * Enhanced error reporting for React components
   */
  static captureReactError(
    error: Error,
    errorInfo: {
      componentStack?: string;
      errorBoundary?: string;
    }
  ): string {
    return this.captureError(error, {
      category: 'ui',
      level: 'error',
      extra: {
        componentStack: errorInfo.componentStack,
        errorBoundary: errorInfo.errorBoundary,
        timestamp: new Date().toISOString()
      },
      tags: {
        errorType: 'react-error',
        hasComponentStack: Boolean(errorInfo.componentStack).toString()
      }
    });
  }

  /**
   * Track game-specific events
   */
  static trackGameEvent(
    event: 'game_started' | 'game_joined' | 'design_submitted' | 'round_completed' | 'game_finished' | 'error_occurred',
    data: {
      sessionId?: string;
      playerCount?: number;
      round?: number;
      duration?: number;
      error?: string;
    } = {}
  ): void {
    this.addBreadcrumb(`Game event: ${event}`, 'game', data);

    // Track significant events as messages
    if (['game_started', 'game_finished', 'error_occurred'].includes(event)) {
      this.captureMessage(`Game ${event}`, 'info', {
        tags: { gameEvent: event },
        extra: data
      });
    }
  }

  /**
   * Track AI generation performance
   */
  static trackAIGeneration(
    type: 'image' | 'voice' | 'style',
    duration: number,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    const level = success ? 'info' : 'warning';
    
    this.captureMessage(`AI generation: ${type}`, level, {
      tags: {
        aiType: type,
        success: success.toString(),
        performance: duration > 10000 ? 'slow' : 'normal'
      },
      extra: {
        duration,
        ...metadata
      }
    });
  }

  /**
   * Performance monitoring helpers
   */
  static measureAsync = async <T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> => {
    const transactionId = this.startTransaction(operation, 'custom', context);
    
    try {
      const result = await fn();
      this.finishTransaction(transactionId, 'ok', { success: true });
      return result;
    } catch (error) {
      this.finishTransaction(transactionId, 'internal', { success: false });
      this.captureError(error as Error, {
        category: 'api',
        level: 'error',
        extra: { operation, context }
      });
      throw error;
    }
  };

  /**
   * Get initialization status
   */
  static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Flush all pending events (useful before app termination)
   */
  static async flush(timeout = 2000): Promise<void> {
    console.log('Sentry: Flushing events...');
    // Mock flush - in real Sentry, this would send pending events
    return new Promise(resolve => setTimeout(resolve, 100));
  }
}

// React Error Boundary integration
export class SentryErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    SentryService.captureReactError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'SentryErrorBoundary'
    });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Oops! Something went wrong
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          We've been notified about this error and will fix it soon.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Refresh Page
        </button>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs text-gray-600 bg-gray-100 dark:bg-gray-700 p-2 rounded">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  </div>
);

export default SentryService;