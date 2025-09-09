import { SlashCommand, CommandContext, CommandResult, ClaudeCodeConfig, CommandCategory } from '../types/claudeCode';
import { ClaudeCodeConfigService } from './claudeCodeConfigService';

export class SlashCommandService {
  private static commands: Map<string, SlashCommand> = new Map();
  private static aliases: Map<string, string> = new Map();
  private static initialized = false;

  public static initialize(): void {
    if (this.initialized) return;

    this.registerBuiltinCommands();
    this.initialized = true;
  }

  private static registerBuiltinCommands(): void {
    // Bypass commands
    this.registerCommand({
      name: 'bypass',
      description: 'Manage confirmation bypass settings',
      aliases: ['bp'],
      category: CommandCategory.BYPASS,
      execute: this.handleBypassCommand.bind(this)
    });

    // Config commands
    this.registerCommand({
      name: 'config',
      description: 'Manage Claude Code configuration',
      aliases: ['cfg'],
      category: CommandCategory.CONFIG,
      execute: this.handleConfigCommand.bind(this)
    });

    // Status command
    this.registerCommand({
      name: 'status',
      description: 'Show current Claude Code status',
      aliases: ['st'],
      category: CommandCategory.UTILITY,
      execute: this.handleStatusCommand.bind(this)
    });

    // Help command
    this.registerCommand({
      name: 'help',
      description: 'Show available commands',
      aliases: ['h', '?'],
      category: CommandCategory.UTILITY,
      execute: this.handleHelpCommand.bind(this)
    });

    // Reset command
    this.registerCommand({
      name: 'reset',
      description: 'Reset configuration to defaults',
      category: CommandCategory.CONFIG,
      execute: this.handleResetCommand.bind(this)
    });

    // Debug command
    this.registerCommand({
      name: 'debug',
      description: 'Toggle debug mode',
      category: CommandCategory.DEBUG,
      execute: this.handleDebugCommand.bind(this)
    });
  }

  public static registerCommand(command: SlashCommand): void {
    this.commands.set(command.name, command);
    
    if (command.aliases) {
      command.aliases.forEach(alias => {
        this.aliases.set(alias, command.name);
      });
    }
  }

  public static async executeCommand(input: string, context: CommandContext): Promise<CommandResult> {
    const { command, args } = this.parseCommand(input);
    
    if (!command) {
      return {
        success: false,
        message: 'Invalid command format. Use /help for available commands.',
        error: 'INVALID_FORMAT'
      };
    }

    const commandName = this.aliases.get(command) || command;
    const commandHandler = this.commands.get(commandName);

    if (!commandHandler) {
      return {
        success: false,
        message: `Unknown command: ${command}. Use /help for available commands.`,
        error: 'COMMAND_NOT_FOUND'
      };
    }

    try {
      return await commandHandler.execute(args, context);
    } catch (error) {
      console.error(`Error executing command ${command}:`, error);
      return {
        success: false,
        message: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: 'EXECUTION_ERROR'
      };
    }
  }

  private static parseCommand(input: string): { command: string | null; args: string[] } {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) {
      return { command: null, args: [] };
    }

    const parts = trimmed.slice(1).split(/\s+/);
    const command = parts[0] || null;
    const args = parts.slice(1);

    return { command, args };
  }

  private static async handleBypassCommand(args: string[], context: CommandContext): Promise<CommandResult> {
    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case 'enable':
      case 'on':
        return this.setBypassState(true, context);
      
      case 'disable':
      case 'off':
        return this.setBypassState(false, context);
      
      case 'toggle':
        const currentConfig = ClaudeCodeConfigService.getConfig();
        return this.setBypassState(!currentConfig.confirmationBypass, context);
      
      case 'status':
        return this.getBypassStatus();
      
      case 'auto':
        return this.handleAutoBypass(args.slice(1), context);
      
      default:
        return {
          success: false,
          message: 'Usage: /bypass [enable|disable|toggle|status|auto] [on|off]',
          error: 'INVALID_SUBCOMMAND'
        };
    }
  }

  private static async setBypassState(enabled: boolean, context: CommandContext): Promise<CommandResult> {
    try {
      const updatedConfig = await ClaudeCodeConfigService.updateConfig(context.userId, {
        confirmationBypass: enabled
      });

      return {
        success: true,
        message: `Confirmation bypass ${enabled ? 'enabled' : 'disabled'}`,
        data: { bypassEnabled: enabled },
        changedSettings: { confirmationBypass: enabled }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update bypass setting',
        error: 'CONFIG_UPDATE_FAILED'
      };
    }
  }

  private static async handleAutoBypass(args: string[], context: CommandContext): Promise<CommandResult> {
    const state = args[0]?.toLowerCase();
    
    if (!['on', 'off'].includes(state)) {
      return {
        success: false,
        message: 'Usage: /bypass auto [on|off]',
        error: 'INVALID_ARGUMENT'
      };
    }

    try {
      const updatedConfig = await ClaudeCodeConfigService.updateConfig(context.userId, {
        autoAcceptAll: state === 'on'
      });

      return {
        success: true,
        message: `Auto-accept all confirmations ${state === 'on' ? 'enabled' : 'disabled'}`,
        data: { autoAcceptAll: state === 'on' },
        changedSettings: { autoAcceptAll: state === 'on' }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update auto-accept setting',
        error: 'CONFIG_UPDATE_FAILED'
      };
    }
  }

  private static getBypassStatus(): CommandResult {
    const config = ClaudeCodeConfigService.getConfig();
    return {
      success: true,
      message: `Bypass: ${config.confirmationBypass ? 'ON' : 'OFF'}, Auto-accept: ${config.autoAcceptAll ? 'ON' : 'OFF'}, Risk level: ${config.riskLevel.toUpperCase()}`,
      data: {
        bypassEnabled: config.confirmationBypass,
        autoAcceptAll: config.autoAcceptAll,
        riskLevel: config.riskLevel
      }
    };
  }

  private static async handleConfigCommand(args: string[], context: CommandContext): Promise<CommandResult> {
    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case 'show':
      case 'list':
        return this.showConfig();
      
      case 'set':
        return this.setConfigValue(args.slice(1), context);
      
      case 'risk':
        return this.setRiskLevel(args.slice(1), context);
      
      default:
        return {
          success: false,
          message: 'Usage: /config [show|set|risk] [key] [value]',
          error: 'INVALID_SUBCOMMAND'
        };
    }
  }

  private static showConfig(): CommandResult {
    const config = ClaudeCodeConfigService.getConfig();
    const status = ClaudeCodeConfigService.getConfigStatus();

    return {
      success: true,
      message: `Current Configuration:
• Bypass: ${status.bypassEnabled ? 'ON' : 'OFF'}
• Auto-accept: ${status.autoAcceptAll ? 'ON' : 'OFF'}
• Risk Level: ${status.riskLevel.toUpperCase()}
• Allowed Operations: ${status.operationsCount}
• Debug Mode: ${config.debugMode ? 'ON' : 'OFF'}
• Session Timeout: ${config.sessionTimeout / 60000}min`,
      data: { config, status }
    };
  }

  private static async setConfigValue(args: string[], context: CommandContext): Promise<CommandResult> {
    if (args.length < 2) {
      return {
        success: false,
        message: 'Usage: /config set <key> <value>',
        error: 'INSUFFICIENT_ARGS'
      };
    }

    const key = args[0];
    const value = args.slice(1).join(' ');

    try {
      const updates: Partial<ClaudeCodeConfig> = {};
      
      switch (key) {
        case 'timeout':
          updates.sessionTimeout = parseInt(value) * 60000; // Convert minutes to ms
          break;
        case 'debug':
          updates.debugMode = ['true', '1', 'on', 'yes'].includes(value.toLowerCase());
          break;
        case 'prefix':
          updates.commandPrefix = value;
          break;
        default:
          return {
            success: false,
            message: `Unknown config key: ${key}. Available keys: timeout, debug, prefix`,
            error: 'UNKNOWN_CONFIG_KEY'
          };
      }

      await ClaudeCodeConfigService.updateConfig(context.userId, updates);
      
      return {
        success: true,
        message: `Updated ${key} to ${value}`,
        changedSettings: updates
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update ${key}`,
        error: 'CONFIG_UPDATE_FAILED'
      };
    }
  }

  private static async setRiskLevel(args: string[], context: CommandContext): Promise<CommandResult> {
    const level = args[0]?.toLowerCase();
    
    if (!['conservative', 'moderate', 'aggressive'].includes(level)) {
      return {
        success: false,
        message: 'Usage: /config risk [conservative|moderate|aggressive]',
        error: 'INVALID_RISK_LEVEL'
      };
    }

    try {
      await ClaudeCodeConfigService.updateConfig(context.userId, {
        riskLevel: level as any
      });

      return {
        success: true,
        message: `Risk level set to ${level}`,
        changedSettings: { riskLevel: level as any }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update risk level',
        error: 'CONFIG_UPDATE_FAILED'
      };
    }
  }

  private static async handleStatusCommand(args: string[], context: CommandContext): Promise<CommandResult> {
    const config = ClaudeCodeConfigService.getConfig();
    const status = ClaudeCodeConfigService.getConfigStatus();

    return {
      success: true,
      message: `🤖 Claude Code Status:
⚡ Bypass: ${status.bypassEnabled ? '🟢 ENABLED' : '🔴 DISABLED'}
🚀 Auto-accept: ${status.autoAcceptAll ? '🟢 ON' : '⚪ OFF'}
⚠️  Risk Level: ${this.getRiskEmoji(status.riskLevel)} ${status.riskLevel.toUpperCase()}
🔧 Operations: ${status.operationsCount} allowed
🐛 Debug: ${config.debugMode ? '🟢 ON' : '⚪ OFF'}`,
      data: { config, status }
    };
  }

  private static getRiskEmoji(riskLevel: string): string {
    switch (riskLevel) {
      case 'conservative': return '🟢';
      case 'moderate': return '🟡';
      case 'aggressive': return '🔴';
      default: return '⚪';
    }
  }

  private static async handleHelpCommand(args: string[], context: CommandContext): Promise<CommandResult> {
    const categories = this.groupCommandsByCategory();
    
    let helpText = '📚 Available Claude Code Commands:\n\n';
    
    for (const [category, commands] of categories) {
      helpText += `${this.getCategoryEmoji(category)} ${category.toUpperCase()}:\n`;
      
      commands.forEach(cmd => {
        const aliases = cmd.aliases ? ` (${cmd.aliases.join(', ')})` : '';
        helpText += `  /${cmd.name}${aliases} - ${cmd.description}\n`;
      });
      
      helpText += '\n';
    }

    helpText += '💡 Examples:\n';
    helpText += '  /bypass toggle - Toggle confirmation bypass\n';
    helpText += '  /config show - Show current settings\n';
    helpText += '  /status - Check system status\n';

    return {
      success: true,
      message: helpText,
      data: { categories: Object.fromEntries(categories) }
    };
  }

  private static getCategoryEmoji(category: string): string {
    switch (category) {
      case 'bypass': return '⚡';
      case 'config': return '🔧';
      case 'utility': return '🛠️';
      case 'debug': return '🐛';
      default: return '📝';
    }
  }

  private static groupCommandsByCategory(): Map<string, SlashCommand[]> {
    const categories = new Map<string, SlashCommand[]>();
    
    for (const command of this.commands.values()) {
      const category = command.category;
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(command);
    }

    return categories;
  }

  private static async handleResetCommand(args: string[], context: CommandContext): Promise<CommandResult> {
    try {
      const defaultConfig = await ClaudeCodeConfigService.resetToDefaults(context.userId);
      
      return {
        success: true,
        message: 'Configuration reset to defaults',
        data: { config: defaultConfig },
        changedSettings: defaultConfig
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to reset configuration',
        error: 'RESET_FAILED'
      };
    }
  }

  private static async handleDebugCommand(args: string[], context: CommandContext): Promise<CommandResult> {
    try {
      const currentConfig = ClaudeCodeConfigService.getConfig();
      const newDebugState = !currentConfig.debugMode;
      
      await ClaudeCodeConfigService.updateConfig(context.userId, {
        debugMode: newDebugState
      });

      return {
        success: true,
        message: `Debug mode ${newDebugState ? 'enabled' : 'disabled'}`,
        data: { debugMode: newDebugState },
        changedSettings: { debugMode: newDebugState }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to toggle debug mode',
        error: 'DEBUG_TOGGLE_FAILED'
      };
    }
  }

  public static isCommand(input: string): boolean {
    return input.trim().startsWith('/');
  }

  public static getAvailableCommands(): SlashCommand[] {
    return Array.from(this.commands.values());
  }

  public static getCommand(name: string): SlashCommand | undefined {
    const commandName = this.aliases.get(name) || name;
    return this.commands.get(commandName);
  }
}