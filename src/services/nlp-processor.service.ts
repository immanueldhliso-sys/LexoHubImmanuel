/**
 * Enhanced Natural Language Processing Service
 * Integrates AWS Claude with comprehensive fallback to traditional NLP
 * Includes robust error handling and retry mechanisms
 */

import { awsBedrockService, ExtractedTimeEntry } from './aws-bedrock.service';

export interface ExtractedTimeEntryData {
  duration?: {
    hours?: number;
    minutes?: number;
    total_minutes?: number;
    confidence: number;
    raw_text?: string;
  };
  date?: {
    date?: string;
    confidence: number;
    raw_text?: string;
  };
  work_type?: {
    category?: string;
    confidence: number;
    raw_text?: string;
  };
  matter_reference?: {
    reference?: string;
    confidence: number;
    raw_text?: string;
  };
  description?: {
    cleaned_text?: string;
    confidence: number;
  };
  overall_confidence: number;
  extraction_method: 'claude' | 'traditional' | 'hybrid';
  errors?: string[];
  warnings?: string[];
}

export interface Matter {
  id: string;
  title: string;
  client_name: string;
  attorney: string;
  brief_type?: string;
}

export interface ProcessingOptions {
  forceTraditionalNLP?: boolean;
  enableFallback?: boolean;
  confidenceThreshold?: number;
  maxRetries?: number;
}

class NLPProcessor {
  private readonly workTypes = [
    'research', 'drafting', 'meeting', 'consultation', 'review', 'court', 'filing',
    'correspondence', 'preparation', 'analysis', 'negotiation', 'administration'
  ];

  private readonly workTypeKeywords = {
    research: ['research', 'investigate', 'study', 'analyze', 'examine', 'look into', 'find out'],
    drafting: ['draft', 'write', 'prepare', 'compose', 'create', 'document'],
    meeting: ['meeting', 'meet', 'discuss', 'conference', 'call', 'zoom', 'teams'],
    consultation: ['consult', 'advise', 'counsel', 'guidance', 'opinion'],
    review: ['review', 'check', 'examine', 'assess', 'evaluate', 'go through'],
    court: ['court', 'hearing', 'trial', 'appearance', 'proceeding'],
    filing: ['file', 'submit', 'lodge', 'register'],
    correspondence: ['email', 'letter', 'correspond', 'communicate', 'reply'],
    preparation: ['prepare', 'ready', 'organize', 'arrange', 'set up'],
    analysis: ['analyze', 'breakdown', 'interpret', 'evaluate'],
    negotiation: ['negotiate', 'bargain', 'discuss terms', 'settlement'],
    administration: ['admin', 'administrative', 'organize', 'manage', 'coordinate']
  };

  /**
   * Extract time entry data with Claude as primary method and traditional NLP as fallback
   */
  async extractTimeEntryData(
    transcription: string, 
    availableMatters: Matter[] = [],
    options: ProcessingOptions = {}
  ): Promise<ExtractedTimeEntryData> {
    const {
      forceTraditionalNLP = false,
      enableFallback = true,
      confidenceThreshold = 0.6,
      maxRetries = 2
    } = options;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Force traditional NLP if requested
    if (forceTraditionalNLP) {
      console.log('Using traditional NLP processing (forced)');
      return this.extractWithTraditionalNLP(transcription, availableMatters);
    }

    // Try Claude extraction first
    try {
      const claudeResult = await this.extractWithClaude(transcription, availableMatters, maxRetries);
      
      if (claudeResult.success && claudeResult.data) {
        const convertedData = this.convertClaudeToExtractedData(claudeResult.data, transcription);
        
        // Check if Claude result meets confidence threshold
        if (convertedData.overall_confidence >= confidenceThreshold) {
          console.log(`Claude extraction successful with confidence: ${convertedData.overall_confidence}`);
          return {
            ...convertedData,
            extraction_method: 'claude'
          };
        } else {
          warnings.push(`Claude confidence (${convertedData.overall_confidence}) below threshold (${confidenceThreshold})`);
        }
      } else {
        errors.push(claudeResult.error || 'Claude extraction failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Claude error';
      errors.push(`Claude extraction error: ${errorMessage}`);
      console.error('Claude extraction failed:', errorMessage);
    }

    // Fallback to traditional NLP if enabled
    if (enableFallback) {
      console.log('Falling back to traditional NLP processing');
      try {
        const traditionalResult = this.extractWithTraditionalNLP(transcription, availableMatters);
        
        return {
          ...traditionalResult,
          extraction_method: errors.length > 0 ? 'traditional' : 'hybrid',
          errors: errors.length > 0 ? errors : undefined,
          warnings: warnings.length > 0 ? warnings : undefined
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown traditional NLP error';
        errors.push(`Traditional NLP error: ${errorMessage}`);
        console.error('Traditional NLP fallback failed:', errorMessage);
      }
    }

    // If all methods fail, return minimal data
    return {
      description: {
        cleaned_text: transcription,
        confidence: 0.1
      },
      overall_confidence: 0.1,
      extraction_method: 'traditional',
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Extract using AWS Claude with retry logic
   */
  private async extractWithClaude(
    transcription: string, 
    availableMatters: Matter[],
    maxRetries: number = 2
  ): Promise<{ success: boolean; data?: ExtractedTimeEntry; error?: string }> {
    let lastError: string = '';
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retrying Claude extraction (attempt ${attempt + 1}/${maxRetries + 1})`);
          // Add a small delay between retries
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }

        const result = await awsBedrockService.extractTimeEntryData(transcription, availableMatters);
        
        if (result.success) {
          return result;
        }
        
        lastError = result.error || 'Unknown error';
        
        // Don't retry on certain types of errors
        if (lastError.includes('temporarily unavailable') || 
            lastError.includes('Transcription text is required') ||
            lastError.includes('too long')) {
          break;
        }
        
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Network error';
        console.error(`Claude extraction attempt ${attempt + 1} failed:`, lastError);
      }
    }

    return {
      success: false,
      error: lastError
    };
  }

  /**
   * Convert Claude's ExtractedTimeEntry to our ExtractedTimeEntryData format
   */
  private convertClaudeToExtractedData(claudeData: ExtractedTimeEntry, originalText: string): ExtractedTimeEntryData {
    const baseConfidence = claudeData.confidence_score || 0.5;
    
    return {
      duration: claudeData.duration_minutes ? {
        total_minutes: claudeData.duration_minutes,
        hours: Math.floor(claudeData.duration_minutes / 60),
        minutes: claudeData.duration_minutes % 60,
        confidence: baseConfidence,
        raw_text: claudeData.extracted_entities?.durations?.[0]
      } : undefined,
      
      date: claudeData.date ? {
        date: claudeData.date,
        confidence: baseConfidence,
        raw_text: claudeData.extracted_entities?.dates?.[0]
      } : undefined,
      
      work_type: claudeData.activity_type ? {
        category: claudeData.activity_type.toLowerCase(),
        confidence: baseConfidence,
        raw_text: claudeData.extracted_entities?.activities?.[0]
      } : undefined,
      
      matter_reference: claudeData.matter_reference || claudeData.client_name ? {
        reference: claudeData.matter_reference || claudeData.client_name,
        confidence: baseConfidence,
        raw_text: claudeData.extracted_entities?.matters?.[0] || claudeData.extracted_entities?.clients?.[0]
      } : undefined,
      
      description: {
        cleaned_text: claudeData.description || originalText,
        confidence: claudeData.description ? baseConfidence : 0.3
      },
      
      overall_confidence: baseConfidence,
      extraction_method: 'claude'
    };
  }

  /**
   * Traditional NLP extraction as fallback
   */
  private extractWithTraditionalNLP(transcription: string, availableMatters: Matter[] = []): ExtractedTimeEntryData {
    const preprocessedText = this.preprocessText(transcription);
    
    const duration = this.extractDuration(preprocessedText);
    const date = this.extractDate(preprocessedText);
    const workType = this.categorizeWorkType(preprocessedText);
    const matterRef = this.identifyMatterReference(preprocessedText, availableMatters);
    const description = this.generateCleanDescription(preprocessedText);
    
    const overallConfidence = this.calculateOverallConfidence({
      duration,
      date,
      workType,
      matterRef,
      description,
      textLength: preprocessedText.length
    });

    return {
      duration,
      date,
      work_type: workType,
      matter_reference: matterRef,
      description,
      overall_confidence: overallConfidence,
      extraction_method: 'traditional'
    };
  }

  /**
   * Extract duration information from text
   */
  private extractDuration(text: string): ExtractedTimeEntryData['duration'] {
    const patterns = [
      // Hours and minutes: "2 hours 30 minutes", "1 hour 15 mins"
      /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\s*(?:and\s*)?(\d+)?\s*(?:minutes?|mins?|m)?/gi,
      // Decimal hours: "1.5 hours", "2.25 hrs"
      /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)(?!\w)/gi,
      // Minutes only: "45 minutes", "30 mins"
      /(\d+)\s*(?:minutes?|mins?|m)(?!\w)/gi,
      // Time format: "2:30", "1:15"
      /(\d{1,2}):(\d{2})/g
    ];

    let bestMatch = null;
    let highestConfidence = 0;

    for (const pattern of patterns) {
      const matches = Array.from(text.matchAll(pattern));
      
      for (const match of matches) {
        let totalMinutes = 0;
        let confidence = 0.7;

        if (pattern === patterns[0]) { // Hours and minutes
          const hours = parseFloat(match[1]) || 0;
          const minutes = parseInt(match[2]) || 0;
          totalMinutes = hours * 60 + minutes;
          confidence = 0.9;
        } else if (pattern === patterns[1]) { // Decimal hours
          const hours = parseFloat(match[1]) || 0;
          totalMinutes = hours * 60;
          confidence = 0.8;
        } else if (pattern === patterns[2]) { // Minutes only
          totalMinutes = parseInt(match[1]) || 0;
          confidence = 0.7;
        } else if (pattern === patterns[3]) { // Time format
          const hours = parseInt(match[1]) || 0;
          const minutes = parseInt(match[2]) || 0;
          totalMinutes = hours * 60 + minutes;
          confidence = 0.6;
        }

        if (totalMinutes > 0 && totalMinutes <= 1440 && confidence > highestConfidence) { // Max 24 hours
          bestMatch = {
            total_minutes: totalMinutes,
            hours: Math.floor(totalMinutes / 60),
            minutes: totalMinutes % 60,
            confidence,
            raw_text: match[0]
          };
          highestConfidence = confidence;
        }
      }
    }

    return bestMatch || undefined;
  }

  /**
   * Extract date information from text
   */
  private extractDate(text: string): ExtractedTimeEntryData['date'] {
    const today = new Date();
    const patterns = [
      // Relative dates
      { pattern: /\btoday\b/gi, offset: 0, confidence: 0.9 },
      { pattern: /\byesterday\b/gi, offset: -1, confidence: 0.9 },
      { pattern: /\btomorrow\b/gi, offset: 1, confidence: 0.8 },
      // Day names
      { pattern: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, offset: null, confidence: 0.7 },
      // Date formats
      { pattern: /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/g, offset: null, confidence: 0.8 }
    ];

    for (const { pattern, offset, confidence } of patterns) {
      const match = text.match(pattern);
      if (match) {
        const targetDate = new Date(today);
        
        if (offset !== null) {
          targetDate.setDate(today.getDate() + offset);
        } else if (pattern.source.includes('monday|tuesday')) {
          // Handle day names (simplified - assumes current week)
          const dayName = match[0].toLowerCase();
          const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(dayName);
          const currentDay = today.getDay();
          const daysUntil = (dayIndex - currentDay + 7) % 7;
          targetDate.setDate(today.getDate() + (daysUntil === 0 ? 0 : daysUntil));
        }
        
        return {
          date: targetDate.toISOString().split('T')[0],
          confidence,
          raw_text: match[0]
        };
      }
    }

    // Default to today with low confidence
    return {
      date: today.toISOString().split('T')[0],
      confidence: 0.3,
      raw_text: 'today (inferred)'
    };
  }

  /**
   * Categorize work type based on keywords
   */
  private categorizeWorkType(text: string): ExtractedTimeEntryData['work_type'] {
    const lowerText = text.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;

    for (const [category, keywords] of Object.entries(this.workTypeKeywords)) {
      let score = 0;
      const matchedKeywords: string[] = [];

      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          score += 1;
          matchedKeywords.push(keyword);
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = {
          category,
          confidence: Math.min(0.9, 0.4 + (score * 0.1)),
          raw_text: matchedKeywords.join(', ')
        };
      }
    }

    return bestMatch || {
      category: 'general',
      confidence: 0.2,
      raw_text: 'no specific keywords found'
    };
  }

  /**
   * Identify matter reference from available matters
   */
  private identifyMatterReference(text: string, availableMatters: Matter[]): ExtractedTimeEntryData['matter_reference'] {
    if (availableMatters.length === 0) {
      return undefined;
    }

    const lowerText = text.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;

    for (const matter of availableMatters) {
      let score = 0;
      const searchTerms = [
        matter.title.toLowerCase(),
        matter.client_name.toLowerCase(),
        matter.attorney.toLowerCase(),
        matter.id.toLowerCase()
      ];

      if (matter.brief_type) {
        searchTerms.push(matter.brief_type.toLowerCase());
      }

      for (const term of searchTerms) {
        if (term.length > 2 && lowerText.includes(term)) {
          score += term.length; // Longer matches get higher scores
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = {
          reference: matter.id,
          confidence: Math.min(0.9, 0.3 + (score * 0.02)),
          raw_text: matter.title
        };
      }
    }

    return bestMatch;
  }

  /**
   * Generate clean description by removing extracted elements
   */
  private generateCleanDescription(text: string): ExtractedTimeEntryData['description'] {
    let cleanText = text;
    
    // Remove duration mentions
    cleanText = cleanText.replace(/\d+(?:\.\d+)?\s*(?:hours?|hrs?|h|minutes?|mins?|m)\b/gi, '');
    cleanText = cleanText.replace(/\d{1,2}:\d{2}/g, '');
    
    // Remove date mentions
    cleanText = cleanText.replace(/\b(?:today|yesterday|tomorrow)\b/gi, '');
    cleanText = cleanText.replace(/\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '');
    cleanText = cleanText.replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, '');
    
    // Clean up extra whitespace and punctuation
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    cleanText = cleanText.replace(/^[,.-\s]+|[,.-\s]+$/g, '');
    
    // Ensure first letter is capitalized
    if (cleanText.length > 0) {
      cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
    }

    return {
      cleaned_text: cleanText || text,
      confidence: cleanText.length > 10 ? 0.7 : 0.4
    };
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(data: {
    duration?: ExtractedTimeEntryData['duration'];
    date?: ExtractedTimeEntryData['date'];
    workType?: ExtractedTimeEntryData['work_type'];
    matterRef?: ExtractedTimeEntryData['matter_reference'];
    description?: ExtractedTimeEntryData['description'];
    textLength: number;
  }): number {
    let totalScore = 0;
    let maxScore = 0;

    // Duration confidence (weight: 25%)
    if (data.duration) {
      totalScore += data.duration.confidence * 0.25;
    }
    maxScore += 0.25;

    // Date confidence (weight: 15%)
    if (data.date) {
      totalScore += data.date.confidence * 0.15;
    }
    maxScore += 0.15;

    // Work type confidence (weight: 20%)
    if (data.workType) {
      totalScore += data.workType.confidence * 0.20;
    }
    maxScore += 0.20;

    // Matter reference confidence (weight: 25%)
    if (data.matterRef) {
      totalScore += data.matterRef.confidence * 0.25;
    }
    maxScore += 0.25;

    // Description confidence (weight: 15%)
    if (data.description) {
      totalScore += data.description.confidence * 0.15;
    }
    maxScore += 0.15;

    // Text length bonus/penalty
    const lengthFactor = Math.min(1, Math.max(0.5, data.textLength / 100));
    totalScore *= lengthFactor;

    return maxScore > 0 ? Math.min(1, totalScore / maxScore) : 0.1;
  }

  /**
   * Preprocess text for better extraction
   */
  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s\-:/]/g, ' ') // Remove special chars except hyphens, colons, slashes
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Validate extracted data quality
   */
  private validateExtractedData(data: ExtractedTimeEntryData): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check duration validity
    if (data.duration) {
      if (data.duration.total_minutes && (data.duration.total_minutes <= 0 || data.duration.total_minutes > 1440)) {
        issues.push('Duration is outside valid range (0-1440 minutes)');
      }
    }

    // Check description length
    if (data.description && data.description.cleaned_text.length < 5) {
      issues.push('Description is too short');
    }

    // Check overall confidence
    if (data.overall_confidence < 0.2) {
      issues.push('Overall confidence is very low');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Test Claude integration
   */
  async testClaudeIntegration(): Promise<{ success: boolean; error?: string; status?: unknown }> {
    try {
      const status = awsBedrockService.getServiceStatus();
      
      if (!status.isAvailable) {
        return {
          success: false,
          error: status.lastError || 'Service not available',
          status
        };
      }

      const testResult = await awsBedrockService.extractTimeEntryData(
        'I spent 2 hours researching case law for the Smith matter today',
        []
      );

      return {
        success: testResult.success,
        error: testResult.error,
        status
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get service status including Claude availability
   */
  getServiceStatus(): {
    claudeAvailable: boolean;
    traditionalNLPAvailable: boolean;
    lastClaudeError?: string;
    claudeStatus?: unknown;
  } {
    const claudeStatus = awsBedrockService.getServiceStatus();
    
    return {
      claudeAvailable: claudeStatus.isAvailable,
      traditionalNLPAvailable: true,
      lastClaudeError: claudeStatus.lastError,
      claudeStatus
    };
  }

  /**
   * Force traditional NLP processing only
   */
  async extractWithTraditionalNLPOnly(transcription: string, availableMatters: Matter[] = []): Promise<ExtractedTimeEntryData> {
    return this.extractWithTraditionalNLP(transcription, availableMatters);
  }
}

// Export singleton instance
export const nlpProcessor = new NLPProcessor();
export default nlpProcessor;