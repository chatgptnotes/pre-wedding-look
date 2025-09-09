export interface ClaudeCodeConfig {
  confirmationBypass: boolean;
  autoAcceptAll: boolean;
  commandPrefix: string;
  sessionTimeout: number;
  debugMode: boolean;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  allowedOperations: string[];
  blockedOperations: string[];
}

export interface SlashCommand {
  name: string;
  description: string;
  aliases?: string[];
  category: 'config' | 'bypass' | 'utility' | 'debug';
  requiredPermissions?: string[];
  execute: (args: string[], context: CommandContext) => Promise<CommandResult>;
}

export interface CommandContext {
  userId?: string;
  sessionId: string;
  timestamp: Date;
  config: ClaudeCodeConfig;
  permissions: string[];
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  changedSettings?: Partial<ClaudeCodeConfig>;
}

export interface ConfirmationContext {
  operation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  data: Record<string, unknown>;
  userIntent: string;
  riskFactors: string[];
  canRollback: boolean;
}

export interface BypassDecision {
  shouldBypass: boolean;
  reason: string;
  riskLevel: number;
  requiresAudit: boolean;
  fallbackToManual?: boolean;
}

export interface AuditLog {
  id: string;
  userId?: string;
  operation: string;
  bypassed: boolean;
  reason: string;
  context: ConfirmationContext;
  timestamp: Date;
  result?: 'success' | 'failure' | 'rollback';
}

export interface UserSettings {
  user_id: string;
  settings: ClaudeCodeConfig;
  created_at: Date;
  updated_at: Date;
}

export const DEFAULT_CLAUDE_CODE_CONFIG: ClaudeCodeConfig = {
  confirmationBypass: false,
  autoAcceptAll: false,
  commandPrefix: '/',
  sessionTimeout: 1800000, // 30 minutes
  debugMode: false,
  riskLevel: 'moderate',
  allowedOperations: [
    'file-read',
    'file-write',
    'directory-list',
    'git-status',
    'npm-install',
    'build-project'
  ],
  blockedOperations: [
    'system-shutdown',
    'format-drive',
    'delete-database',
    'expose-secrets'
  ]
};

export enum CommandCategory {
  CONFIG = 'config',
  BYPASS = 'bypass',
  UTILITY = 'utility',
  DEBUG = 'debug'
}

export enum RiskLevel {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive'
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}