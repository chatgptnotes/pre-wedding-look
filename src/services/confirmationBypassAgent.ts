import { ConfirmationContext, BypassDecision, AuditLog, ClaudeCodeConfig, Severity, RiskLevel } from '../types/claudeCode';
import { ClaudeCodeConfigService } from './claudeCodeConfigService';
import { supabase } from '../lib/supabase';

export class ConfirmationBypassAgent {
  private static instance: ConfirmationBypassAgent;
  private auditLogs: AuditLog[] = [];

  public static getInstance(): ConfirmationBypassAgent {
    if (!this.instance) {
      this.instance = new ConfirmationBypassAgent();
    }
    return this.instance;
  }

  public async shouldBypass(context: ConfirmationContext, userId?: string): Promise<BypassDecision> {
    const config = ClaudeCodeConfigService.getConfig();
    
    // Check if bypass is globally disabled
    if (!config.confirmationBypass) {
      return {
        shouldBypass: false,
        reason: 'Confirmation bypass is disabled',
        riskLevel: 0,
        requiresAudit: false
      };
    }

    // Auto-accept all mode
    if (config.autoAcceptAll && context.severity !== Severity.CRITICAL) {
      return {
        shouldBypass: true,
        reason: 'Auto-accept all mode enabled',
        riskLevel: this.calculateRiskLevel(context, config),
        requiresAudit: true
      };
    }

    // Evaluate based on risk criteria
    const decision = this.evaluateBypassCriteria(context, config);
    
    // Log the decision for audit
    if (decision.requiresAudit) {
      await this.logBypassDecision(context, decision, userId);
    }

    return decision;
  }

  private evaluateBypassCriteria(context: ConfirmationContext, config: ClaudeCodeConfig): BypassDecision {
    const riskScore = this.calculateRiskLevel(context, config);
    
    // Critical operations never bypass automatically
    if (context.severity === Severity.CRITICAL) {
      return {
        shouldBypass: false,
        reason: 'Critical operation requires manual confirmation',
        riskLevel: riskScore,
        requiresAudit: true,
        fallbackToManual: true
      };
    }

    // Check if operation is explicitly blocked
    if (config.blockedOperations.includes(context.operation)) {
      return {
        shouldBypass: false,
        reason: `Operation '${context.operation}' is in blocked list`,
        riskLevel: riskScore,
        requiresAudit: true
      };
    }

    // Check if operation is explicitly allowed
    if (config.allowedOperations.includes(context.operation)) {
      return this.evaluateAllowedOperation(context, config, riskScore);
    }

    // Default evaluation based on risk level and severity
    return this.evaluateByRiskLevel(context, config, riskScore);
  }

  private evaluateAllowedOperation(context: ConfirmationContext, config: ClaudeCodeConfig, riskScore: number): BypassDecision {
    // Even allowed operations need risk assessment
    const maxRiskThreshold = this.getMaxRiskThreshold(config.riskLevel);
    
    if (riskScore <= maxRiskThreshold) {
      return {
        shouldBypass: true,
        reason: `Low risk allowed operation (score: ${riskScore}/${maxRiskThreshold})`,
        riskLevel: riskScore,
        requiresAudit: riskScore > 3
      };
    }

    return {
      shouldBypass: false,
      reason: `Risk score too high for automatic bypass (${riskScore}/${maxRiskThreshold})`,
      riskLevel: riskScore,
      requiresAudit: true,
      fallbackToManual: true
    };
  }

  private evaluateByRiskLevel(context: ConfirmationContext, config: ClaudeCodeConfig, riskScore: number): BypassDecision {
    const maxRiskThreshold = this.getMaxRiskThreshold(config.riskLevel);
    
    // Apply severity multiplier
    const severityMultiplier = this.getSeverityMultiplier(context.severity);
    const adjustedRiskScore = riskScore * severityMultiplier;

    if (adjustedRiskScore <= maxRiskThreshold) {
      return {
        shouldBypass: true,
        reason: `Risk within acceptable threshold (${adjustedRiskScore}/${maxRiskThreshold})`,
        riskLevel: adjustedRiskScore,
        requiresAudit: adjustedRiskScore > 2
      };
    }

    return {
      shouldBypass: false,
      reason: `Risk exceeds threshold (${adjustedRiskScore}/${maxRiskThreshold})`,
      riskLevel: adjustedRiskScore,
      requiresAudit: true,
      fallbackToManual: context.canRollback
    };
  }

  private calculateRiskLevel(context: ConfirmationContext, config: ClaudeCodeConfig): number {
    let riskScore = 0;

    // Base risk from severity
    switch (context.severity) {
      case Severity.LOW:
        riskScore += 1;
        break;
      case Severity.MEDIUM:
        riskScore += 3;
        break;
      case Severity.HIGH:
        riskScore += 6;
        break;
      case Severity.CRITICAL:
        riskScore += 10;
        break;
    }

    // Risk factors
    riskScore += context.riskFactors.length * 0.5;

    // Data sensitivity
    if (context.data) {
      if (this.containsSensitiveData(context.data)) {
        riskScore += 2;
      }
      if (this.containsSystemData(context.data)) {
        riskScore += 3;
      }
    }

    // Rollback capability reduces risk
    if (context.canRollback) {
      riskScore *= 0.7;
    }

    // Operation type risk assessment
    riskScore += this.getOperationRisk(context.operation);

    return Math.round(riskScore * 10) / 10; // Round to 1 decimal
  }

  private getMaxRiskThreshold(riskLevel: RiskLevel): number {
    switch (riskLevel) {
      case RiskLevel.CONSERVATIVE:
        return 3;
      case RiskLevel.MODERATE:
        return 6;
      case RiskLevel.AGGRESSIVE:
        return 9;
      default:
        return 6;
    }
  }

  private getSeverityMultiplier(severity: Severity): number {
    switch (severity) {
      case Severity.LOW:
        return 0.8;
      case Severity.MEDIUM:
        return 1.0;
      case Severity.HIGH:
        return 1.5;
      case Severity.CRITICAL:
        return 2.0;
      default:
        return 1.0;
    }
  }

  private getOperationRisk(operation: string): number {
    const riskMap: Record<string, number> = {
      'file-read': 0.5,
      'file-write': 1.5,
      'file-delete': 3.0,
      'directory-create': 1.0,
      'directory-delete': 4.0,
      'git-commit': 2.0,
      'git-push': 2.5,
      'git-reset': 3.5,
      'npm-install': 2.0,
      'build-project': 1.0,
      'run-tests': 0.5,
      'deploy-production': 4.0,
      'database-query': 1.5,
      'database-modify': 3.0,
      'system-command': 3.0,
      'network-request': 1.0,
      'expose-secrets': 10.0,
      'format-drive': 10.0,
      'system-shutdown': 10.0
    };

    return riskMap[operation] || 2.0; // Default moderate risk
  }

  private containsSensitiveData(data: Record<string, unknown>): boolean {
    const sensitiveKeys = [
      'password', 'secret', 'key', 'token', 'credential',
      'api_key', 'private_key', 'auth', 'session'
    ];

    const dataStr = JSON.stringify(data).toLowerCase();
    return sensitiveKeys.some(key => dataStr.includes(key));
  }

  private containsSystemData(data: Record<string, unknown>): boolean {
    const systemKeys = [
      'system', 'root', 'admin', 'sudo', 'config',
      'environment', 'env', 'path', 'home'
    ];

    const dataStr = JSON.stringify(data).toLowerCase();
    return systemKeys.some(key => dataStr.includes(key));
  }

  private async logBypassDecision(context: ConfirmationContext, decision: BypassDecision, userId?: string): Promise<void> {
    try {
      if (userId && supabase) {
        // Log to database
        await supabase.rpc('log_claude_code_bypass', {
          p_user_id: userId,
          p_operation: context.operation,
          p_bypassed: decision.shouldBypass,
          p_reason: decision.reason,
          p_context: {
            severity: context.severity,
            riskLevel: decision.riskLevel,
            riskFactors: context.riskFactors,
            userIntent: context.userIntent,
            canRollback: context.canRollback
          }
        });
      }

      // Local audit log
      const auditEntry: AuditLog = {
        id: crypto.randomUUID(),
        userId,
        operation: context.operation,
        bypassed: decision.shouldBypass,
        reason: decision.reason,
        context,
        timestamp: new Date()
      };

      this.auditLogs.push(auditEntry);

      // Keep only last 100 entries in memory
      if (this.auditLogs.length > 100) {
        this.auditLogs.shift();
      }

    } catch (error) {
      console.error('Failed to log bypass decision:', error);
    }
  }

  public async logOperationResult(operationId: string, result: 'success' | 'failure' | 'rollback', userId?: string): Promise<void> {
    try {
      if (userId && supabase) {
        // Update the audit log with the result
        const { error } = await supabase
          .from('claude_code_audit_log')
          .update({ result })
          .eq('id', operationId)
          .eq('user_id', userId);

        if (error) {
          console.error('Failed to update audit log result:', error);
        }
      }

      // Update local audit log
      const entry = this.auditLogs.find(log => log.id === operationId);
      if (entry) {
        entry.result = result;
      }

    } catch (error) {
      console.error('Failed to log operation result:', error);
    }
  }

  public getAuditLogs(limit: number = 50): AuditLog[] {
    return this.auditLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public async getUserStats(userId: string): Promise<any> {
    try {
      if (!supabase) return null;

      const { data, error } = await supabase.rpc('get_claude_code_bypass_stats', {
        p_user_id: userId
      });

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Failed to get user stats:', error);
      return null;
    }
  }

  public clearAuditLogs(): void {
    this.auditLogs = [];
  }

  public isEnabled(): boolean {
    const config = ClaudeCodeConfigService.getConfig();
    return config.confirmationBypass;
  }

  public getRiskThresholds(): { conservative: number; moderate: number; aggressive: number } {
    return {
      conservative: this.getMaxRiskThreshold(RiskLevel.CONSERVATIVE),
      moderate: this.getMaxRiskThreshold(RiskLevel.MODERATE),
      aggressive: this.getMaxRiskThreshold(RiskLevel.AGGRESSIVE)
    };
  }
}