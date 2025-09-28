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
  data?: any;
  timestamp: Date;
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
        in