/**
 * Advanced NLP Processor Service
 * Handles natural language processing for voice commands, document analysis, and text understanding
 */

// import { toast } from 'react-hot-toast';

export interface NLPIntent {
  intent: string;
  confidence: number;
  entities: NLPEntity[];
  parameters: Record<string, any>;
}

export interface NLPEntity {
  type: 'person' | 'organization' | 'date' | 'money' | 'matter_reference' | 'court' | 'legal_concept';
  value: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export interface LegalDocumentAnalysis {
  documentType: 'brief' | 'contract' | 'judgment' | 'pleading' | 'correspondence' | 'other';
  confidence: number;
  keyEntities: {
    parties: Array<{ name: string; role: string; confidence: number }>;
    dates: Array<{ date: string; context: string; confidence: number }>;
    amounts: Array<{ amount: number; currency: string; context: string; confidence: number }>;
    legalConcepts: Array<{ concept: string; relevance: number; context: string }>;
    courtReferences: Array<{ court: string; caseNumber?: string; confidence: number }>;
  };
  riskFactors: Array<{
    type: 'deadline' | 'conflict' | 'complexity' | 'financial';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
  }>;
  summary: string;
  actionItems: Array<{
    task: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
    category: 'filing' | 'research' | 'communication' | 'review';
  }>;
}

export interface VoiceCommandResult {
  intent: NLPIntent;
  response: string;
  actions?: Array<{
    type: 'navigate' | 'create' | 'update' | 'search' | 'reminder';
    target: string;
    parameters: Record<string, any>;
  }>;
}

export class AdvancedNLPService {
  private static legalTermsDatabase = new Map([
    // Common legal terms and their contexts
    ['plaintiff', { type: 'legal_concept', category: 'party_type' }],
    ['defendant', { type: 'legal_concept', category: 'party_type' }],
    ['appellant', { type: 'legal_concept', category: 'party_type' }],
    ['respondent', { type: 'legal_concept', category: 'party_type' }],
    ['interdict', { type: 'legal_concept', category: 'remedy' }],
    ['damages', { type: 'legal_concept', category: 'remedy' }],
    ['settlement', { type: 'legal_concept', category: 'resolution' }],
    ['motion', { type: 'legal_concept', category: 'procedure' }],
    ['pleading', { type: 'legal_concept', category: 'document' }],
    ['discovery', { type: 'legal_concept', category: 'procedure' }],
    ['trial', { type: 'legal_concept', category: 'procedure' }],
    ['judgment', { type: 'legal_concept', category: 'outcome' }],
  ]);

  private static voiceIntents = new Map([
    // Voice command patterns and their intents
    ['show.*matters?.*today', { intent: 'view_matters', context: 'today' }],
    ['what.*matters?.*active', { intent: 'view_matters', context: 'active' }],
    ['create.*new.*matter', { intent: 'create_matter' }],
    ['generate.*invoice', { intent: 'create_invoice' }],
    ['show.*invoices?.*overdue', { intent: 'view_invoices', context: 'overdue' }],
    ['my.*court.*diary', { intent: 'view_court_diary' }],
    ['add.*time.*entry', { intent: 'create_time_entry' }],
    ['what.*is.*my.*wip', { intent: 'view_wip_summary' }],
    ['settlement.*probability.*for', { intent: 'analyze_settlement_probability' }],
    ['conflict.*check.*for', { intent: 'run_conflict_check' }],
  ]);

  /**
   * Process voice command with advanced NLP
   */
  static async processVoiceCommand(transcript: string, languageCode: string = 'en'): Promise<VoiceCommandResult> {
    try {
      // Clean and normalize the transcript
      const normalizedText = this.normalizeText(transcript);
      
      // Extract intent and entities
      const intent = this.extractIntent(normalizedText);
      const entities = this.extractEntities(normalizedText);
      
      // Enhanced intent with entities
      const enhancedIntent: NLPIntent = {
        ...intent,
        entities,
        parameters: this.extractParameters(normalizedText, intent.intent)
      };

      // Generate contextual response
      const response = this.generateResponse(enhancedIntent);
      
      // Generate actions based on intent
      const actions = this.generateActions(enhancedIntent);

      return {
        intent: enhancedIntent,
        response,
        actions
      };
    } catch (error) {
      console.error('Error processing voice command:', error);
      throw new Error('Failed to process voice command');
    }
  }

  /**
   * Analyze legal document with advanced NLP
   */
  static async analyzeLegalDocument(text: string, documentType?: string): Promise<LegalDocumentAnalysis> {
    try {
      // Classify document type if not provided
      const classifiedType = documentType || this.classifyDocumentType(text);
      
      // Extract key entities
      const keyEntities = this.extractLegalEntities(text);
      
      // Identify risk factors
      const riskFactors = this.identifyRiskFactors(text, keyEntities);
      
      // Generate summary
      const summary = this.generateDocumentSummary(text, keyEntities);
      
      // Extract action items
      const actionItems = this.extractActionItems(text, keyEntities);

      return {
        documentType: classifiedType as any,
        confidence: 0.85, // Would be calculated by ML model in production
        keyEntities,
        riskFactors,
        summary,
        actionItems
      };
    } catch (error) {
      console.error('Error analyzing legal document:', error);
      throw new Error('Failed to analyze legal document');
    }
  }

  /**
   * Extract legal entities from text
   */
  static extractLegalEntities(text: string) {
    const entities = {
      parties: [] as Array<{ name: string; role: string; confidence: number }>,
      dates: [] as Array<{ date: string; context: string; confidence: number }>,
      amounts: [] as Array<{ amount: number; currency: string; context: string; confidence: number }>,
      legalConcepts: [] as Array<{ concept: string; relevance: number; context: string }>,
      courtReferences: [] as Array<{ court: string; caseNumber?: string; confidence: number }>
    };

    // Extract parties (simplified pattern matching - would use ML models in production)
    const partyPatterns = [
      /([A-Z][a-zA-Z\s]+)\s*(?:v\.?|vs\.?|versus)\s*([A-Z][a-zA-Z\s]+)/g,
      /(?:plaintiff|applicant|appellant)[\s:]*([A-Z][a-zA-Z\s]+)/gi,
      /(?:defendant|respondent)[\s:]*([A-Z][a-zA-Z\s]+)/gi
    ];

    partyPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1] && match[2]) {
          entities.parties.push(
            { name: match[1].trim(), role: 'plaintiff', confidence: 0.8 },
            { name: match[2].trim(), role: 'defendant', confidence: 0.8 }
          );
        } else if (match[1]) {
          entities.parties.push({ name: match[1].trim(), role: 'party', confidence: 0.7 });
        }
      }
    });

    // Extract dates
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/g,
      /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
      /(?:by|before|on|until)\s+(\d{1,2}\s+\w+\s+\d{4})/gi
    ];

    datePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.dates.push({
          date: match[1],
          context: this.extractContext(text, match.index, 50),
          confidence: 0.85
        });
      }
    });

    // Extract amounts
    const amountPattern = /(?:R|ZAR|\$|USD|€|EUR)\s*?([\d,]+(?:\.\d{2})?)/gi;
    let amountMatch;
    while ((amountMatch = amountPattern.exec(text)) !== null) {
      const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      entities.amounts.push({
        amount,
        currency: amountMatch[0].charAt(0) === 'R' ? 'ZAR' : 'USD',
        context: this.extractContext(text, amountMatch.index, 30),
        confidence: 0.9
      });
    }

    // Extract legal concepts
    this.legalTermsDatabase.forEach((data, term) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        entities.legalConcepts.push({
          concept: term,
          relevance: 0.8,
          context: this.extractContext(text, match.index, 40)
        });
      }
    });

    // Extract court references
    const courtPattern = /(high court|magistrate'?s? court|supreme court|constitutional court|labour court)/gi;
    let courtMatch;
    while ((courtMatch = courtPattern.exec(text)) !== null) {
      entities.courtReferences.push({
        court: courtMatch[1],
        confidence: 0.85
      });
    }

    return entities;
  }

  /**
   * Identify risk factors in legal documents
   */
  private static identifyRiskFactors(text: string, entities: any) {
    const riskFactors = [];

    // Check for urgent deadlines
    const urgentKeywords = ['urgent', 'immediate', 'forthwith', 'within 24 hours', 'by close of business'];
    if (urgentKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
      riskFactors.push({
        type: 'deadline' as const,
        severity: 'high' as const,
        description: 'Document contains urgent deadline requirements',
        recommendation: 'Prioritize immediate action and calendar all deadlines'
      });
    }

    // Check for high-value amounts
    const highValueAmounts = entities.amounts.filter((a: any) => a.amount > 1000000);
    if (highValueAmounts.length > 0) {
      riskFactors.push({
        type: 'financial' as const,
        severity: 'high' as const,
        description: 'High-value financial amounts detected',
        recommendation: 'Consider additional review and risk assessment procedures'
      });
    }

    // Check for complex legal concepts
    const complexConcepts = ['constitutional', 'criminal', 'class action', 'liquidation'];
    if (complexConcepts.some(concept => text.toLowerCase().includes(concept))) {
      riskFactors.push({
        type: 'complexity' as const,
        severity: 'medium' as const,
        description: 'Complex legal concepts identified',
        recommendation: 'Consider specialist consultation or additional research'
      });
    }

    return riskFactors;
  }

  /**
   * Extract context around a text position
   */
  private static extractContext(text: string, position: number, radius: number): string {
    const start = Math.max(0, position - radius);
    const end = Math.min(text.length, position + radius);
    return text.substring(start, end).trim();
  }

  /**
   * Normalize text for processing
   */
  private static normalizeText(text: string): string {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract intent from normalized text
   */
  private static extractIntent(text: string): Omit<NLPIntent, 'entities' | 'parameters'> {
    for (const [pattern, intentData] of this.voiceIntents) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(text)) {
        return {
          intent: intentData.intent,
          confidence: 0.85
        };
      }
    }

    // Default intent for unrecognized commands
    return {
      intent: 'general_query',
      confidence: 0.3
    };
  }

  /**
   * Extract entities from text
   */
  private static extractEntities(text: string): NLPEntity[] {
    const entities: NLPEntity[] = [];

    // Extract dates
    const datePattern = /(?:today|tomorrow|yesterday|\d{1,2}\/\d{1,2}\/\d{4})/gi;
    let match;
    while ((match = datePattern.exec(text)) !== null) {
      entities.push({
        type: 'date',
        value: match[0],
        confidence: 0.9,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }

    // Extract money amounts
    const moneyPattern = /(?:R|ZAR)\s*?([\d,]+(?:\.\d{2})?)/gi;
    while ((match = moneyPattern.exec(text)) !== null) {
      entities.push({
        type: 'money',
        value: match[0],
        confidence: 0.95,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }

    return entities;
  }

  /**
   * Extract parameters based on intent
   */
  private static extractParameters(text: string, intent: string): Record<string, any> {
    const parameters: Record<string, any> = {};

    switch (intent) {
      case 'view_matters':
        if (text.includes('today')) parameters.timeframe = 'today';
        if (text.includes('active')) parameters.status = 'active';
        if (text.includes('overdue')) parameters.status = 'overdue';
        break;
      
      case 'create_matter':
        // Extract matter details from voice command
        const clientMatch = text.match(/for\s+([a-zA-Z\s]+)/);
        if (clientMatch) parameters.clientName = clientMatch[1].trim();
        break;
      
      case 'analyze_settlement_probability':
        const matterMatch = text.match(/for\s+(.+?)(?:\s|$)/);
        if (matterMatch) parameters.matterReference = matterMatch[1].trim();
        break;
    }

    return parameters;
  }

  /**
   * Generate contextual response
   */
  private static generateResponse(intent: NLPIntent): string {
    switch (intent.intent) {
      case 'view_matters':
        return intent.parameters.timeframe === 'today' 
          ? "Here are your matters for today..."
          : "Showing your active matters...";
      
      case 'create_matter':
        return intent.parameters.clientName 
          ? `Creating a new matter for ${intent.parameters.clientName}...`
          : "Opening the new matter creation form...";
      
      case 'create_invoice':
        return "Opening invoice generation...";
      
      case 'view_wip_summary':
        return "Here's your current work-in-progress summary...";
      
      case 'analyze_settlement_probability':
        return intent.parameters.matterReference
          ? `Analyzing settlement probability for ${intent.parameters.matterReference}...`
          : "Please specify which matter you'd like me to analyze.";
      
      default:
        return "I understand you want to " + intent.intent.replace(/_/g, ' ') + ". Let me help you with that.";
    }
  }

  /**
   * Generate actions based on intent
   */
  private static generateActions(intent: NLPIntent) {
    const actions = [];

    switch (intent.intent) {
      case 'view_matters':
        actions.push({
          type: 'navigate' as const,
          target: 'matters',
          parameters: intent.parameters
        });
        break;
      
      case 'create_matter':
        actions.push({
          type: 'create' as const,
          target: 'matter',
          parameters: intent.parameters
        });
        break;
      
      case 'create_invoice':
        actions.push({
          type: 'create' as const,
          target: 'invoice',
          parameters: {}
        });
        break;
    }

    return actions;
  }

  /**
   * Classify document type
   */
  private static classifyDocumentType(text: string): string {
    const text_lower = text.toLowerCase();
    
    if (text_lower.includes('notice of motion') || text_lower.includes('application')) {
      return 'brief';
    }
    if (text_lower.includes('contract') || text_lower.includes('agreement')) {
      return 'contract';
    }
    if (text_lower.includes('judgment') || text_lower.includes('order')) {
      return 'judgment';
    }
    if (text_lower.includes('pleading') || text_lower.includes('plea')) {
      return 'pleading';
    }
    
    return 'other';
  }

  /**
   * Generate document summary
   */
  private static generateDocumentSummary(text: string, entities: any): string {
    const parties = entities.parties.map((p: any) => p.name).join(' vs ');
    const hasAmounts = entities.amounts.length > 0;
    const hasDeadlines = entities.dates.length > 0;
    
    let summary = "This document ";
    
    if (parties) {
      summary += `involves ${parties} `;
    }
    
    if (hasAmounts) {
      summary += `and contains financial amounts totaling approximately R${entities.amounts.reduce((sum: number, a: any) => sum + a.amount, 0).toLocaleString()} `;
    }
    
    if (hasDeadlines) {
      summary += `with ${entities.dates.length} key date(s) identified `;
    }
    
    summary += "requiring legal attention.";
    
    return summary;
  }

  /**
   * Extract action items from document
   */
  private static extractActionItems(text: string, entities: any) {
    const actionItems = [];
    
    // Look for filing deadlines
    entities.dates.forEach((date: any) => {
      if (date.context.toLowerCase().includes('file') || date.context.toLowerCase().includes('serve')) {
        actionItems.push({
          task: `File or serve documents by ${date.date}`,
          priority: 'high' as const,
          dueDate: date.date,
          category: 'filing' as const
        });
      }
    });
    
    // Look for response requirements
    if (text.toLowerCase().includes('respond') || text.toLowerCase().includes('reply')) {
      actionItems.push({
        task: 'Prepare response to document',
        priority: 'medium' as const,
        category: 'communication' as const
      });
    }
    
    return actionItems;
  }
}
