import { awsBedrockService } from './aws-bedrock.service';
import type { Page } from '../types';

export interface VoiceNavigationCommand {
  id: string;
  command: string;
  action: 'navigate' | 'search' | 'quick_action' | 'time_entry';
  target?: string;
  parameters?: Record<string, unknown>;
  confidence: number;
}

// Interface for raw command data from Claude response
interface RawVoiceNavigationCommand {
  id: string;
  command: string;
  action: string;
  target?: string;
  parameters?: Record<string, unknown>;
  confidence: number;
}

export interface VoiceNavigationResult {
  recognized: boolean;
  commands: VoiceNavigationCommand[];
  fallbackToTimeEntry: boolean;
  originalText: string;
  processingTime: number;
}

export interface NavigationMapping {
  keywords: string[];
  page: Page;
  aliases: string[];
}

class VoiceNavigationService {
  private navigationMappings: NavigationMapping[] = [
    {
      keywords: ['dashboard', 'home', 'overview', 'main'],
      page: 'dashboard',
      aliases: ['dash', 'main page', 'home page']
    },
    {
      keywords: ['matters', 'cases', 'files', 'clients'],
      page: 'matters',
      aliases: ['case files', 'client matters', 'legal matters']
    },
    {
      keywords: ['finance', 'invoices', 'billing', 'payments', 'money'],
      page: 'finance',
      aliases: ['financial', 'bills', 'invoice', 'payment']
    },
    {
      keywords: ['growth', 'referrals', 'marketing', 'business development'],
      page: 'practice-growth',
      aliases: ['practice growth', 'business growth', 'referral']
    },
    {
      keywords: ['intelligence', 'ai', 'analytics', 'insights'],
      page: 'ai-analytics',
      aliases: ['artificial intelligence', 'ai dashboard', 'analytics']
    },
    {
      keywords: ['academy', 'learning', 'education', 'training'],
      page: 'academy',
      aliases: ['learn', 'education', 'courses']
    },
    {
      keywords: ['settings', 'preferences', 'configuration', 'profile'],
      page: 'settings',
      aliases: ['config', 'setup', 'account']
    },
    {
      keywords: ['reports', 'reporting', 'analysis'],
      page: 'reports',
      aliases: ['report', 'analytics report']
    },
    {
      keywords: ['compliance', 'ethics', 'rules'],
      page: 'compliance',
      aliases: ['ethical compliance', 'legal compliance']
    }
  ];

  private quickActionMappings = [
    {
      keywords: ['create invoice', 'new invoice', 'invoice', 'bill'],
      action: 'create_invoice',
      shortcut: 'Ctrl+Shift+I'
    },
    {
      keywords: ['new matter', 'create matter', 'add matter'],
      action: 'create_matter',
      shortcut: 'Ctrl+Shift+M'
    },
    {
      keywords: ['time entry', 'log time', 'record time'],
      action: 'voice_time_entry',
      shortcut: 'Ctrl+Shift+V'
    },
    {
      keywords: ['pro forma', 'proforma', 'estimate'],
      action: 'create_proforma',
      shortcut: 'Ctrl+Shift+P'
    },
    {
      keywords: ['analyze brief', 'brief analysis', 'analyze document'],
      action: 'analyze_brief',
      shortcut: 'Ctrl+Shift+A'
    }
  ];

  /**
   * Process voice input for navigation commands
   */
  async processVoiceNavigation(transcription: string): Promise<VoiceNavigationResult> {
    const startTime = Date.now();
    
    try {
      // First, try to extract navigation commands using Claude
      const claudeResult = await this.extractNavigationWithClaude(transcription);
      
      if (claudeResult.commands.length > 0) {
        return {
          ...claudeResult,
          processingTime: Date.now() - startTime
        };
      }

      // Fallback to pattern matching
      const patternResult = await this.extractNavigationWithPatterns(transcription);
      
      return {
        ...patternResult,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Voice navigation processing failed:', error);
      
      // Final fallback - assume it's a time entry
      return {
        recognized: false,
        commands: [],
        fallbackToTimeEntry: true,
        originalText: transcription,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Extract navigation commands using AWS Claude
   */
  private async extractNavigationWithClaude(transcription: string): Promise<Omit<VoiceNavigationResult, 'processingTime'>> {
    try {
      const prompt = this.buildClaudeNavigationPrompt(transcription);
      const response = await awsBedrockService.processText(prompt);
      
      return this.parseClaudeNavigationResponse(response, transcription);
    } catch (error) {
      console.error('Claude navigation extraction failed:', error);
      throw error;
    }
  }

  /**
   * Build Claude prompt for navigation command extraction
   */
  private buildClaudeNavigationPrompt(transcription: string): string {
    const availablePages = this.navigationMappings.map(m => m.page).join(', ');
    const availableActions = this.quickActionMappings.map(a => a.action).join(', ');

    return `You are a voice command processor for a South African legal practice management system called LexoHub.

Analyze this voice input and determine if it contains navigation commands or quick actions:

"${transcription}"

Available navigation pages: ${availablePages}
Available quick actions: ${availableActions}

Respond with a JSON object in this exact format:
{
  "recognized": boolean,
  "commands": [
    {
      "id": "unique_id",
      "command": "original_phrase",
      "action": "navigate|search|quick_action|time_entry",
      "target": "page_name_or_action",
      "parameters": {},
      "confidence": 0.0-1.0
    }
  ],
  "fallbackToTimeEntry": boolean
}

Rules:
1. If the input clearly contains navigation intent (e.g., "open dashboard", "go to matters", "show finance"), set action to "navigate"
2. If it contains search intent (e.g., "find client Smith", "search for invoice"), set action to "search"
3. If it contains quick action intent (e.g., "create invoice", "new matter"), set action to "quick_action"
4. If it's about time/billing (e.g., "I spent 2 hours", "worked on case"), set action to "time_entry"
5. Set confidence based on clarity of intent (0.8+ for clear commands, 0.5-0.8 for probable, <0.5 for uncertain)
6. If no clear navigation/action intent, set fallbackToTimeEntry to true
7. Multiple commands can be extracted from one input

Examples:
- "Open the dashboard" → navigate to dashboard
- "Go to matters page" → navigate to matters
- "Create a new invoice" → quick_action create_invoice
- "Find client Smith" → search with parameters
- "I worked 2 hours on the case" → time_entry (fallback)`;
  }

  /**
   * Parse Claude's navigation response
   */
  private parseClaudeNavigationResponse(response: string, originalText: string): Omit<VoiceNavigationResult, 'processingTime'> {
    try {
      const parsed = JSON.parse(response);
      
      if (typeof parsed.recognized !== 'boolean' || !Array.isArray(parsed.commands)) {
        throw new Error('Invalid Claude response structure');
      }

      // Validate and enhance commands
      const validatedCommands = parsed.commands
        .filter((cmd: RawVoiceNavigationCommand) => this.validateCommand(cmd))
        .map((cmd: RawVoiceNavigationCommand) => this.enhanceCommand(cmd));

      return {
        recognized: parsed.recognized && validatedCommands.length > 0,
        commands: validatedCommands,
        fallbackToTimeEntry: parsed.fallbackToTimeEntry || false,
        originalText
      };
    } catch (error) {
      console.error('Failed to parse Claude navigation response:', error);
      throw error;
    }
  }

  /**
   * Validate command structure
   */
  private validateCommand(cmd: RawVoiceNavigationCommand): boolean {
    return (
      typeof cmd.id === 'string' &&
      typeof cmd.command === 'string' &&
      typeof cmd.action === 'string' &&
      ['navigate', 'search', 'quick_action', 'time_entry'].includes(cmd.action) &&
      typeof cmd.confidence === 'number' &&
      cmd.confidence >= 0 && cmd.confidence <= 1
    );
  }

  /**
   * Enhance command with additional metadata
   */
  private enhanceCommand(cmd: RawVoiceNavigationCommand): VoiceNavigationCommand {
    const enhanced: VoiceNavigationCommand = {
      id: cmd.id,
      command: cmd.command,
      action: cmd.action as 'navigate' | 'search' | 'quick_action' | 'time_entry',
      target: cmd.target,
      parameters: cmd.parameters || {},
      confidence: cmd.confidence
    };

    // Add navigation validation
    if (enhanced.action === 'navigate' && enhanced.target) {
      const validPages = this.navigationMappings.map(m => m.page);
      if (!validPages.includes(enhanced.target as Page)) {
        // Try to find a close match
        const match = this.findClosestPageMatch(enhanced.target);
        if (match) {
          enhanced.target = match;
          enhanced.confidence *= 0.8; // Reduce confidence for fuzzy match
        }
      }
    }

    // Add quick action validation
    if (enhanced.action === 'quick_action' && enhanced.target) {
      const validActions = this.quickActionMappings.map(a => a.action);
      if (!validActions.includes(enhanced.target)) {
        const match = this.findClosestActionMatch(enhanced.target);
        if (match) {
          enhanced.target = match.action;
          enhanced.parameters.shortcut = match.shortcut;
          enhanced.confidence *= 0.8;
        }
      }
    }

    return enhanced;
  }

  /**
   * Fallback pattern matching for navigation commands
   */
  private async extractNavigationWithPatterns(transcription: string): Promise<Omit<VoiceNavigationResult, 'processingTime'>> {
    const text = transcription.toLowerCase();
    const commands: VoiceNavigationCommand[] = [];

    // Check for navigation patterns
    for (const mapping of this.navigationMappings) {
      const allKeywords = [...mapping.keywords, ...mapping.aliases];
      
      for (const keyword of allKeywords) {
        if (text.includes(keyword.toLowerCase())) {
          // Check for navigation verbs
          const navigationVerbs = ['open', 'go to', 'show', 'display', 'navigate to', 'switch to'];
          const hasNavigationVerb = navigationVerbs.some(verb => text.includes(verb));
          
          if (hasNavigationVerb || text.startsWith(keyword.toLowerCase())) {
            commands.push({
              id: `nav_${mapping.page}_${Date.now()}`,
              command: transcription,
              action: 'navigate',
              target: mapping.page,
              parameters: {},
              confidence: hasNavigationVerb ? 0.8 : 0.6
            });
            break;
          }
        }
      }
    }

    // Check for quick action patterns
    for (const actionMapping of this.quickActionMappings) {
      for (const keyword of actionMapping.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          commands.push({
            id: `action_${actionMapping.action}_${Date.now()}`,
            command: transcription,
            action: 'quick_action',
            target: actionMapping.action,
            parameters: { shortcut: actionMapping.shortcut },
            confidence: 0.7
          });
          break;
        }
      }
    }

    // Check for search patterns
    const searchVerbs = ['find', 'search', 'look for', 'locate'];
    const hasSearchVerb = searchVerbs.some(verb => text.includes(verb));
    
    if (hasSearchVerb) {
      commands.push({
        id: `search_${Date.now()}`,
        command: transcription,
        action: 'search',
        target: 'global_search',
        parameters: { query: transcription },
        confidence: 0.6
      });
    }

    return {
      recognized: commands.length > 0,
      commands,
      fallbackToTimeEntry: commands.length === 0,
      originalText: transcription
    };
  }

  /**
   * Find closest page match using fuzzy matching
   */
  private findClosestPageMatch(target: string): Page | null {
    const targetLower = target.toLowerCase();
    
    for (const mapping of this.navigationMappings) {
      const allTerms = [mapping.page, ...mapping.keywords, ...mapping.aliases];
      
      for (const term of allTerms) {
        if (this.calculateSimilarity(targetLower, term.toLowerCase()) > 0.7) {
          return mapping.page;
        }
      }
    }
    
    return null;
  }

  /**
   * Find closest action match
   */
  private findClosestActionMatch(target: string): { action: string; shortcut: string } | null {
    const targetLower = target.toLowerCase();
    
    for (const actionMapping of this.quickActionMappings) {
      for (const keyword of actionMapping.keywords) {
        if (this.calculateSimilarity(targetLower, keyword.toLowerCase()) > 0.7) {
          return {
            action: actionMapping.action,
            shortcut: actionMapping.shortcut
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Calculate string similarity (simple Levenshtein-based)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Get available navigation options for voice commands
   */
  getAvailableCommands(): { pages: string[]; actions: string[] } {
    return {
      pages: this.navigationMappings.map(m => m.page),
      actions: this.quickActionMappings.map(a => a.action)
    };
  }
}

// Export singleton instance
export const voiceNavigationService = new VoiceNavigationService();
export default voiceNavigationService;