/**
 * Voice-Activated Query Service
 * Natural language voice commands for practice data queries
 */

import { speechToTextService } from './speech-to-text.service';
import type { Matter, Invoice, TimeEntry, PracticeMetrics } from '../types';

export interface VoiceQuery {
  id: string;
  query: string;
  intent: QueryIntent;
  entities: QueryEntity[];
  confidence: number;
  response: string;
  data?: unknown;
  timestamp: string;
}

export interface QueryIntent {
  type: QueryType;
  action: string;
  confidence: number;
}

export interface QueryEntity {
  type: EntityType;
  value: string;
  confidence: number;
}

export interface QueryPattern {
  pattern: RegExp;
  intent: QueryType;
  entities: EntityType[];
}

export enum QueryType {
  FINANCIAL = 'financial',
  MATTER = 'matter',
  TIME = 'time',
  INVOICE = 'invoice',
  ANALYTICS = 'analytics',
  GENERAL = 'general'
}

export enum EntityType {
  DATE = 'date',
  AMOUNT = 'amount',
  CLIENT = 'client',
  MATTER_ID = 'matter_id',
  TIME_PERIOD = 'time_period',
  METRIC = 'metric'
}

export class VoiceQueryService {
  private queryPatterns = new Map<string, QueryPattern>();
  private queryHistory: VoiceQuery[] = [];

  constructor() {
    this.initializeQueryPatterns();
  }

  /**
   * Initialize query patterns for intent recognition
   */
  private initializeQueryPatterns(): void {
    // Add some basic patterns
    this.queryPatterns.set('financial', {
      pattern: /\b(revenue|income|billing|invoice|payment|total|outstanding)\b/i,
      intent: QueryType.FINANCIAL,
      entities: [EntityType.AMOUNT, EntityType.TIME_PERIOD]
    });

    this.queryPatterns.set('matter', {
      pattern: /\b(matter|case|client|brief)\b/i,
      intent: QueryType.MATTER,
      entities: [EntityType.CLIENT, EntityType.MATTER_ID]
    });
  }

  /**
   * Parse query to extract intent and entities
   */
  private parseQuery(text: string): { intent: QueryIntent; entities: QueryEntity[] } {
    // Simple pattern matching - in production would use ML models
    let bestMatch: QueryPattern | null = null;
    let highestScore = 0;

    for (const pattern of this.queryPatterns.values()) {
      if (pattern.pattern.test(text)) {
        const score = 0.8; // Simplified scoring
        if (score > highestScore) {
          highestScore = score;
          bestMatch = pattern;
        }
      }
    }

    const intent: QueryIntent = bestMatch ? {
      type: bestMatch.intent,
      action: 'query',
      confidence: highestScore
    } : {
      type: QueryType.GENERAL,
      action: 'unknown',
      confidence: 0.3
    };

    // Extract basic entities
    const entities: QueryEntity[] = [];
    
    return { intent, entities };
  }

  /**
   * Process voice query and return response
   */
  async processVoiceQuery(
    audioBlob: Blob,
    context: {
      matters: Matter[];
      invoices: Invoice[];
      timeEntries: TimeEntry[];
      metrics: PracticeMetrics;
    }
  ): Promise<VoiceQuery> {
    try {
      // Transcribe audio to text
      const transcription = await speechToTextService.transcribe(audioBlob);
      
      // Parse query intent and entities
      const { intent, entities } = this.parseQuery(transcription.text);
      
      // Execute query and generate response
      const { response, data } = await this.executeQuery(intent, entities, context);
      
      // Create query record
      const voiceQuery: VoiceQuery = {
        id: crypto.randomUUID(),
        query: transcription.text,
        intent: intent,
        entities: entities,
        confidence: intent.confidence,
        response: response,
        data: data,
        timestamp: new Date().toISOString()
      };

      // Store query for history
      this.queryHistory.push(voiceQuery);

      return voiceQuery;
    } catch (error) {
      console.error('Voice query processing failed:', error);
      
      // Return error query object
      return {
        id: crypto.randomUUID(),
        query: 'Error processing query',
        intent: { type: QueryType.GENERAL, action: 'error', confidence: 0 },
        entities: [],
        confidence: 0,
        response: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async executeQuery(
    intent: QueryIntent, 
    _entities: QueryEntity[], 
    context?: {
      matters: Matter[];
      invoices: Invoice[];
      timeEntries: TimeEntry[];
      metrics: PracticeMetrics;
    }
  ): Promise<{ response: string; data?: unknown }> {
    // Basic query execution logic
    switch (intent.type) {
      case QueryType.MATTER:
        return { response: 'Here are your matters...', data: context?.matters || [] };
      case QueryType.FINANCIAL:
        return { response: 'Here is your financial information...', data: context?.invoices || [] };
      case QueryType.TIME:
        return { response: 'Here are your time entries...', data: context?.timeEntries || [] };
      default:
        return { response: 'Query processed successfully.', data: null };
    }
  }

  getQueryHistory(): VoiceQuery[] {
    return this.queryHistory;
  }

  clearHistory(): void {
    this.queryHistory = [];
  }
}

export const voiceQueryService = new VoiceQueryService();