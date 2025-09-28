/**
 * Natural Language Processing Service
 * Extracts structured time entry data from transcribed voice notes
 */

import type { ExtractedTimeEntryData, Matter } from '../types';

export interface MatterReference {
  type: 'client_name' | 'matter_number' | 'case_name' | 'attorney_name';
  value: string;
  confidence: number;
  position: { start: number; end: number };
}

export interface WorkTypeCategory {
  category: string;
  subcategory?: string;
  confidence: number;
  billableRate?: number;
}

export class NLPProcessor {
  private durationPatterns = [
    // Hours patterns
    /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/gi,
    /(\d+)\s*(?:and\s*)?(\d+)\s*(?:minutes?|mins?|m)\s*(?:hours?|hrs?|h)/gi,
    // Minutes patterns
    /(\d+)\s*(?:minutes?|mins?|m)\b/gi,
    // Combined patterns
    /(\d+)\s*(?:hours?|hrs?|h)\s*(?:and\s*)?(\d+)\s*(?:minutes?|mins?|m)/gi,
    // Decimal hours
    /(\d+\.\d+)\s*(?:hours?|hrs?|h)/gi
  ];

  private datePatterns = [
    // Today, yesterday, etc.
    /\b(?:today|yesterday|this\s+morning|this\s+afternoon|earlier)\b/gi,
    // Specific dates
    /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/g,
    /\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{2,4})\b/gi,
    // Days of week
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
    // Relative dates
    /\b(\d+)\s+days?\s+ago\b/gi,
    /\blast\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi
  ];

  private workTypeKeywords = {
    'Research': ['research', 'researching', 'looked up', 'investigating', 'studying', 'reviewing case law'],
    'Drafting': ['draft', 'drafting', 'writing', 'preparing', 'document preparation'],
    'Client Meeting': ['client meeting', 'consultation', 'client call', 'meeting with client'],
    'Court Appearance': ['court', 'hearing', 'appearance', 'trial', 'motion hearing'],
    'Document Review': ['review', 'reviewing', 'analyzed', 'examining documents'],
    'Correspondence': ['email', 'letter', 'correspondence', 'communication'],
    'Negotiation': ['negotiation', 'negotiating', 'settlement discussions'],
    'Travel': ['travel', 'traveling', 'driving to court', 'commute'],
    'Administrative': ['admin', 'administrative', 'filing', 'organizing']
  };

  private clientPatterns = [
    /(?:for|with|regarding)\s+([A-Z][a-zA-Z\s&]+(?:Ltd|Pty|Inc|Corporation|Company|Corp)?)/g,
    /([A-Z][a-zA-Z\s&]+(?:Ltd|Pty|Inc|Corporation|Company|Corp))\s+(?:matter|case)/gi,
    /client\s+([A-Z][a-zA-Z\s&]+)/gi
  ];

  /**
   * Extract structured time entry data from transcribed text
   */
  async extractTimeEntryData(text: string, availableMatters?: Matter[]): Promise<ExtractedTimeEntryData> {
    const cleanText = this.preprocessText(text);
    
    const duration = this.extractDuration(cleanText);
    const date = this.extractDate(cleanText);
    const workType = this.categorizeWorkType(cleanText);
    const matterReferences = this.identifyMatterReferences(cleanText, availableMatters);
    
    // Calculate overall confidence based on extracted fields
    const confidence = this.calculateConfidence({
      duration,
      date,
      workType,
      matterReferences,
      textLength: cleanText.length
    });

    return {
      duration: duration?.value,
      description: this.generateDescription(cleanText, workType),
      workType: workType?.category,
      date: date?.value,
      confidence,
      matterId: matterReferences.length > 0 ? matterReferences[0].matterId : undefined,
      clientName: matterReferences.length > 0 ? matterReferences[0].clientName : undefined,
      extractedFields: {
        duration: duration ? { value: duration.value, confidence: duration.confidence } : undefined,
        description: { value: cleanText, confidence: 0.9 },
        date: date ? { value: date.value, confidence: date.confidence } : undefined,
        matter: matterReferences.length > 0 ? {
          value: matterReferences[0].clientName || matterReferences[0].matterId || '',
          confidence: matterReferences[0].confidence
        } : undefined
      }
    };
  }

  /**
   * Extract duration from text
   */
  private extractDuration(text: string): { value: number; confidence: number } | null {
    let bestMatch: { value: number; confidence: number } | null = null;
    let highestConfidence = 0;

    for (const pattern of this.durationPatterns) {
      const matches = Array.from(text.matchAll(pattern));
      
      for (const match of matches) {
        let minutes = 0;
        let confidence = 0.8;

        if (match[0].toLowerCase().includes('hour')) {
          // Hours pattern
          const hours = parseFloat(match[1]);
          minutes = hours * 60;
          
          // Check for additional minutes
          if (match[2]) {
            minutes += parseInt(match[2]);
          }
          
          confidence = 0.9;
        } else if (match[0].toLowerCase().includes('minute')) {
          // Minutes pattern
          minutes = parseInt(match[1]);
          confidence = 0.85;
        }

        // Validate reasonable duration (5 minutes to 12 hours)
        if (minutes >= 5 && minutes <= 720) {
          if (confidence > highestConfidence) {
            highestConfidence = confidence;
            bestMatch = { value: minutes, confidence };
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Extract date from text
   */
  private extractDate(text: string): { value: string; confidence: number } | null {
    const today = new Date();
    
    // Check for relative dates first
    if (/\btoday\b/i.test(text)) {
      return { value: today.toISOString().split('T')[0], confidence: 0.95 };
    }
    
    if (/\byesterday\b/i.test(text)) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { value: yesterday.toISOString().split('T')[0], confidence: 0.95 };
    }

    // Check for specific dates
    const dateMatch = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
    if (dateMatch) {
      try {
        const [, day, month, year] = dateMatch;
        const fullYear = year.length === 2 ? `20${year}` : year;
        const date = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        
        if (!isNaN(date.getTime())) {
          return { value: date.toISOString().split('T')[0], confidence: 0.9 };
        }
      } catch (error) {
        // Invalid date format
      }
    }

    // Default to today with lower confidence
    return { value: today.toISOString().split('T')[0], confidence: 0.6 };
  }

  /**
   * Categorize work type based on keywords
   */
  private categorizeWorkType(text: string): WorkTypeCategory | null {
    const lowerText = text.toLowerCase();
    let bestMatch: WorkTypeCategory | null = null;
    let highestScore = 0;

    for (const [category, keywords] of Object.entries(this.workTypeKeywords)) {
      let score = 0;
      let matchCount = 0;

      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          score += keyword.length; // Longer keywords get higher scores
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const confidence = Math.min(0.9, (score / text.length) * 10 + (matchCount * 0.1));
        
        if (confidence > highestScore) {
          highestScore = confidence;
          bestMatch = {
            category,
            confidence
          };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Identify matter references in text
   */
  private identifyMatterReferences(text: string, availableMatters?: Matter[]): Array<{
    matterId?: string;
    clientName?: string;
    confidence: number;
  }> {
    const references: Array<{ matterId?: string; clientName?: string; confidence: number }> = [];

    if (!availableMatters || availableMatters.length === 0) {
      // Extract potential client names from text patterns
      for (const pattern of this.clientPatterns) {
        const matches = Array.from(text.matchAll(pattern));
        for (const match of matches) {
          const clientName = match[1]?.trim();
          if (clientName && clientName.length > 2) {
            references.push({
              clientName,
              confidence: 0.7
            });
          }
        }
      }
      return references;
    }

    // Match against available matters
    const lowerText = text.toLowerCase();
    
    for (const matter of availableMatters) {
      let confidence = 0;
      let matchReasons: string[] = [];

      // Check client name match
      if (matter.clientName) {
        const clientNameLower = matter.clientName.toLowerCase();
        if (lowerText.includes(clientNameLower)) {
          confidence += 0.4;
          matchReasons.push('client name');
        }
        
        // Check partial client name match
        const clientWords = clientNameLower.split(' ');
        const matchingWords = clientWords.filter(word => 
          word.length > 2 && lowerText.includes(word)
        );
        if (matchingWords.length > 0) {
          confidence += (matchingWords.length / clientWords.length) * 0.3;
          matchReasons.push('partial client name');
        }
      }

      // Check matter title match
      if (matter.title) {
        const titleWords = matter.title.toLowerCase().split(' ');
        const matchingTitleWords = titleWords.filter(word => 
          word.length > 3 && lowerText.includes(word)
        );
        if (matchingTitleWords.length > 0) {
          confidence += (matchingTitleWords.length / titleWords.length) * 0.2;
          matchReasons.push('matter title');
        }
      }

      // Check instructing attorney match
      if (matter.instructingAttorney) {
        const attorneyLower = matter.instructingAttorney.toLowerCase();
        if (lowerText.includes(attorneyLower)) {
          confidence += 0.2;
          matchReasons.push('attorney name');
        }
      }

      // Check brief type match
      if (matter.briefType) {
        const briefTypeLower = matter.briefType.toLowerCase();
        if (lowerText.includes(briefTypeLower)) {
          confidence += 0.1;
          matchReasons.push('brief type');
        }
      }

      if (confidence > 0.3) { // Minimum threshold for consideration
        references.push({
          matterId: matter.id,
          clientName: matter.clientName,
          confidence: Math.min(0.95, confidence)
        });
      }
    }

    // Sort by confidence and return top matches
    return references
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3); // Return top 3 matches
  }

  /**
   * Generate clean description from text
   */
  private generateDescription(text: string, workType?: WorkTypeCategory): string {
    let description = text.trim();
    
    // Remove duration mentions from description
    for (const pattern of this.durationPatterns) {
      description = description.replace(pattern, '').trim();
    }
    
    // Remove date mentions
    description = description.replace(/\b(?:today|yesterday|this\s+morning|this\s+afternoon)\b/gi, '').trim();
    
    // Clean up extra spaces
    description = description.replace(/\s+/g, ' ').trim();
    
    // Ensure proper capitalization
    if (description.length > 0) {
      description = description.charAt(0).toUpperCase() + description.slice(1);
    }
    
    // If description is too short, enhance with work type
    if (description.length < 10 && workType) {
      description = `${workType.category} work: ${description}`;
    }
    
    return description || 'Voice-recorded time entry';
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(data: {
    duration: { value: number; confidence: number } | null;
    date: { value: string; confidence: number } | null;
    workType: WorkTypeCategory | null;
    matterReferences: Array<{ matterId?: string; clientName?: string; confidence: number }>;
    textLength: number;
  }): number {
    let totalConfidence = 0;
    let factorCount = 0;

    // Duration confidence
    if (data.duration) {
      totalConfidence += data.duration.confidence * 0.3;
      factorCount += 0.3;
    }

    // Date confidence
    if (data.date) {
      totalConfidence += data.date.confidence * 0.2;
      factorCount += 0.2;
    }

    // Work type confidence
    if (data.workType) {
      totalConfidence += data.workType.confidence * 0.2;
      factorCount += 0.2;
    }

    // Matter reference confidence
    if (data.matterReferences.length > 0) {
      const avgMatterConfidence = data.matterReferences.reduce((sum, ref) => sum + ref.confidence, 0) / data.matterReferences.length;
      totalConfidence += avgMatterConfidence * 0.2;
      factorCount += 0.2;
    }

    // Text quality confidence
    const textQuality = Math.min(1, data.textLength / 50); // Longer text generally better
    totalConfidence += textQuality * 0.1;
    factorCount += 0.1;

    // Normalize confidence
    const normalizedConfidence = factorCount > 0 ? totalConfidence / factorCount : 0.5;
    
    return Math.max(0.1, Math.min(0.95, normalizedConfidence));
  }

  /**
   * Preprocess text for better extraction
   */
  private preprocessText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?;:()\-&]/g, '') // Remove special characters except common punctuation
      .toLowerCase();
  }

  /**
   * Validate extracted data
   */
  validateExtractedData(data: ExtractedTimeEntryData): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let isValid = true;

    // Check duration
    if (data.duration) {
      if (data.duration < 5) {
        warnings.push('Duration seems very short (less than 5 minutes)');
      } else if (data.duration > 720) {
        warnings.push('Duration seems very long (more than 12 hours)');
        isValid = false;
      }
    } else {
      warnings.push('No duration found in the recording');
    }

    // Check description
    if (!data.description || data.description.length < 10) {
      warnings.push('Description is very short or missing');
    }

    // Check confidence
    if (data.confidence < 0.5) {
      warnings.push('Low confidence in extracted data - please review carefully');
    }

    return { isValid, warnings };
  }
}

// Export singleton instance
export const nlpProcessor = new NLPProcessor();