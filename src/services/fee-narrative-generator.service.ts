/**
 * Enhanced Fee Narrative Generator Service
 * AI-powered generation of detailed, justifiable fee descriptions
 */

import type { TimeEntry, Matter } from '../types';

export interface FeeNarrativeOptions {
  includeTimeBreakdown?: boolean;
  includeWorkTypeDetails?: boolean;
  formalTone?: boolean;
  includeOutcomes?: boolean;
  groupByWorkType?: boolean;
}

export interface GeneratedNarrative {
  narrative: string;
  wordCount: number;
  confidence: number;
  suggestions: string[];
  alternativeVersions: string[];
}

export class FeeNarrativeGenerator {
  private workTypeTemplates = {
    'Research': {
      verbs: ['researched', 'investigated', 'analyzed', 'reviewed', 'examined'],
      objects: ['case law', 'legislation', 'precedents', 'legal authorities', 'statutory provisions'],
      outcomes: ['identified relevant authorities', 'prepared legal analysis', 'compiled research summary']
    },
    'Drafting': {
      verbs: ['drafted', 'prepared', 'composed', 'formulated', 'created'],
      objects: ['pleadings', 'correspondence', 'agreements', 'motions', 'submissions'],
      outcomes: ['completed first draft', 'finalized document', 'prepared for review']
    },
    'Client Meeting': {
      verbs: ['consulted with', 'advised', 'met with', 'discussed with', 'briefed'],
      objects: ['client', 'stakeholders', 'management', 'board members'],
      outcomes: ['provided legal advice', 'clarified instructions', 'obtained further information']
    },
    'Court Appearance': {
      verbs: ['appeared in', 'attended', 'represented client at', 'argued before'],
      objects: ['High Court', 'Magistrates Court', 'Labour Court', 'hearing', 'trial'],
      outcomes: ['obtained favorable ruling', 'presented arguments', 'secured adjournment']
    },
    'Document Review': {
      verbs: ['reviewed', 'analyzed', 'examined', 'scrutinized', 'assessed'],
      objects: ['contracts', 'agreements', 'correspondence', 'evidence', 'documentation'],
      outcomes: ['identified key issues', 'provided comments', 'recommended amendments']
    },
    'Correspondence': {
      verbs: ['corresponded with', 'communicated with', 'liaised with', 'negotiated with'],
      objects: ['opposing counsel', 'third parties', 'regulatory bodies', 'stakeholders'],
      outcomes: ['reached agreement', 'clarified position', 'advanced matter']
    }
  };

  private legalPhrases = [
    'in accordance with',
    'pursuant to',
    'with regard to',
    'in connection with',
    'for the purposes of',
    'in relation to',
    'with respect to',
    'in furtherance of'
  ];

  private outcomeIndicators = [
    'resulting in',
    'leading to',
    'culminating in',
    'achieving',
    'securing',
    'obtaining',
    'facilitating'
  ];

  /**
   * Generate enhanced fee narrative from time entries
   */
  async generateNarrative(
    timeEntries: TimeEntry[],
    matter: Matter,
    options: FeeNarrativeOptions = {}
  ): Promise<GeneratedNarrative> {
    const {
      includeTimeBreakdown = true,
      includeWorkTypeDetails = true,
      formalTone = true,
      includeOutcomes = false,
      groupByWorkType = true
    } = options;

    try {
      // Group and analyze time entries
      const groupedEntries = groupByWorkType 
        ? this.groupEntriesByWorkType(timeEntries)
        : this.groupEntriesByDate(timeEntries);

      // Generate narrative sections
      const sections = await this.generateNarrativeSections(
        groupedEntries,
        matter,
        options
      );

      // Combine sections into cohesive narrative
      const narrative = this.combineNarrativeSections(sections, options);

      // Generate alternatives and suggestions
      const alternatives = await this.generateAlternativeVersions(narrative, options);
      const suggestions = this.generateImprovementSuggestions(narrative, timeEntries);

      return {
        narrative: this.formatNarrative(narrative, formalTone),
        wordCount: narrative.split(' ').length,
        confidence: this.calculateNarrativeConfidence(timeEntries, narrative),
        suggestions,
        alternativeVersions: alternatives
      };

    } catch (error) {
      console.error('Fee narrative generation failed:', error);
      throw new Error('Failed to generate fee narrative');
    }
  }

  /**
   * Generate quick narrative for single time entry
   */
  generateQuickNarrative(timeEntry: TimeEntry, matter: Matter): string {
    const workType = timeEntry.description.toLowerCase();
    const duration = this.formatDuration(timeEntry.duration);
    
    // Detect work type from description
    const detectedType = this.detectWorkType(timeEntry.description);
    const template = this.workTypeTemplates[detectedType] || this.workTypeTemplates['Research'];
    
    // Generate basic narrative
    const verb = this.selectRandomItem(template.verbs);
    const matterRef = this.generateMatterReference(matter);
    
    return `${duration} ${verb} ${matterRef} - ${timeEntry.description}`;
  }

  /**
   * Group time entries by work type
   */
  private groupEntriesByWorkType(timeEntries: TimeEntry[]): Map<string, TimeEntry[]> {
    const grouped = new Map<string, TimeEntry[]>();
    
    for (const entry of timeEntries) {
      const workType = this.detectWorkType(entry.description);
      if (!grouped.has(workType)) {
        grouped.set(workType, []);
      }
      grouped.get(workType)!.push(entry);
    }
    
    return grouped;
  }

  /**
   * Group time entries by date
   */
  private groupEntriesByDate(timeEntries: TimeEntry[]): Map<string, TimeEntry[]> {
    const grouped = new Map<string, TimeEntry[]>();
    
    for (const entry of timeEntries) {
      const date = entry.date;
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(entry);
    }
    
    return grouped;
  }

  /**
   * Generate narrative sections
   */
  private async generateNarrativeSections(
    groupedEntries: Map<string, TimeEntry[]>,
    matter: Matter,
    options: FeeNarrativeOptions
  ): Promise<string[]> {
    const sections: string[] = [];
    
    for (const [groupKey, entries] of groupedEntries) {
      const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0);
      const section = await this.generateSectionNarrative(
        groupKey,
        entries,
        totalDuration,
        matter,
        options
      );
      sections.push(section);
    }
    
    return sections;
  }

  /**
   * Generate narrative for a section
   */
  private async generateSectionNarrative(
    sectionKey: string,
    entries: TimeEntry[],
    totalDuration: number,
    matter: Matter,
    options: FeeNarrativeOptions
  ): Promise<string> {
    const isWorkTypeGroup = this.workTypeTemplates.hasOwnProperty(sectionKey);
    const template = isWorkTypeGroup ? this.workTypeTemplates[sectionKey] : null;
    
    if (template && options.includeWorkTypeDetails) {
      return this.generateWorkTypeNarrative(sectionKey, entries, totalDuration, matter, template);
    } else {
      return this.generateDateNarrative(sectionKey, entries, totalDuration, matter);
    }
  }

  /**
   * Generate work type specific narrative
   */
  private generateWorkTypeNarrative(
    workType: string,
    entries: TimeEntry[],
    totalDuration: number,
    matter: Matter,
    template: any
  ): string {
    const duration = this.formatDuration(totalDuration);
    const verb = this.selectRandomItem(template.verbs);
    const matterRef = this.generateMatterReference(matter);
    
    // Combine descriptions intelligently
    const combinedDescription = this.combineDescriptions(entries.map(e => e.description));
    
    let narrative = `${duration} ${verb} ${matterRef}`;
    
    if (combinedDescription) {
      narrative += ` including ${combinedDescription}`;
    }
    
    // Add outcome if available
    if (template.outcomes && Math.random() > 0.5) {
      const outcome = this.selectRandomItem(template.outcomes);
      const outcomeIndicator = this.selectRandomItem(this.outcomeIndicators);
      narrative += `, ${outcomeIndicator} ${outcome}`;
    }
    
    return narrative + '.';
  }

  /**
   * Generate date-based narrative
   */
  private generateDateNarrative(
    date: string,
    entries: TimeEntry[],
    totalDuration: number,
    matter: Matter
  ): string {
    const duration = this.formatDuration(totalDuration);
    const formattedDate = this.formatDate(date);
    const matterRef = this.generateMatterReference(matter);
    
    const activities = entries.map(entry => {
      const workType = this.detectWorkType(entry.description);
      return `${this.formatDuration(entry.duration)} ${workType.toLowerCase()}`;
    }).join(', ');
    
    return `${formattedDate}: ${duration} on ${matterRef} (${activities}).`;
  }

  /**
   * Detect work type from description
   */
  private detectWorkType(description: string): string {
    const lowerDesc = description.toLowerCase();
    
    for (const [workType, template] of Object.entries(this.workTypeTemplates)) {
      const keywords = [...template.verbs, ...template.objects];
      if (keywords.some(keyword => lowerDesc.includes(keyword.toLowerCase()))) {
        return workType;
      }
    }
    
    // Fallback detection based on common words
    if (lowerDesc.includes('research') || lowerDesc.includes('review')) return 'Research';
    if (lowerDesc.includes('draft') || lowerDesc.includes('write')) return 'Drafting';
    if (lowerDesc.includes('client') || lowerDesc.includes('meeting')) return 'Client Meeting';
    if (lowerDesc.includes('court') || lowerDesc.includes('hearing')) return 'Court Appearance';
    if (lowerDesc.includes('email') || lowerDesc.includes('letter')) return 'Correspondence';
    
    return 'Research'; // Default fallback
  }

  /**
   * Combine multiple descriptions intelligently
   */
  private combineDescriptions(descriptions: string[]): string {
    if (descriptions.length === 0) return '';
    if (descriptions.length === 1) return descriptions[0];
    
    // Remove duplicates and common words
    const uniqueDescriptions = [...new Set(descriptions)];
    
    // Extract key activities
    const activities = uniqueDescriptions.map(desc => {
      // Remove common prefixes and clean up
      return desc
        .replace(/^\d+\s*(hours?|hrs?|minutes?|mins?)\s*/i, '')
        .replace(/^(worked on|time spent on|regarding)\s*/i, '')
        .trim();
    }).filter(desc => desc.length > 0);
    
    if (activities.length <= 2) {
      return activities.join(' and ');
    } else {
      const last = activities.pop();
      return activities.join(', ') + ', and ' + last;
    }
  }

  /**
   * Generate matter reference
   */
  private generateMatterReference(matter: Matter): string {
    const phrases = this.legalPhrases;
    const phrase = this.selectRandomItem(phrases);
    
    if (matter.clientName && matter.title) {
      return `${phrase} the ${matter.clientName} matter (${matter.title})`;
    } else if (matter.clientName) {
      return `${phrase} the ${matter.clientName} matter`;
    } else {
      return `${phrase} this matter`;
    }
  }

  /**
   * Format duration for narrative
   */
  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} minute${mins !== 1 ? 's' : ''}`;
    } else if (mins === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} and ${mins} minute${mins !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Format date for narrative
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Select random item from array
   */
  private selectRandomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  /**
   * Combine narrative sections
   */
  private combineNarrativeSections(sections: string[], options: FeeNarrativeOptions): string {
    if (sections.length === 0) return '';
    if (sections.length === 1) return sections[0];
    
    // Add connecting phrases between sections
    const connectors = [
      'Additionally,',
      'Furthermore,',
      'In addition,',
      'Moreover,',
      'Subsequently,'
    ];
    
    let combined = sections[0];
    
    for (let i = 1; i < sections.length; i++) {
      const connector = this.selectRandomItem(connectors);
      combined += ` ${connector} ${sections[i]}`;
    }
    
    return combined;
  }

  /**
   * Format final narrative
   */
  private formatNarrative(narrative: string, formalTone: boolean): string {
    let formatted = narrative.trim();
    
    if (formalTone) {
      // Ensure proper capitalization and punctuation
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
      if (!formatted.endsWith('.')) {
        formatted += '.';
      }
    }
    
    // Clean up extra spaces
    formatted = formatted.replace(/\s+/g, ' ');
    
    return formatted;
  }

  /**
   * Calculate narrative confidence
   */
  private calculateNarrativeConfidence(timeEntries: TimeEntry[], narrative: string): number {
    let confidence = 0.7; // Base confidence
    
    // Increase confidence based on entry count
    if (timeEntries.length > 1) confidence += 0.1;
    if (timeEntries.length > 5) confidence += 0.1;
    
    // Increase confidence based on narrative length
    const wordCount = narrative.split(' ').length;
    if (wordCount > 20) confidence += 0.05;
    if (wordCount > 50) confidence += 0.05;
    
    // Decrease confidence for very short descriptions
    const avgDescLength = timeEntries.reduce((sum, e) => sum + e.description.length, 0) / timeEntries.length;
    if (avgDescLength < 20) confidence -= 0.1;
    
    return Math.min(0.95, Math.max(0.3, confidence));
  }

  /**
   * Generate alternative versions
   */
  private async generateAlternativeVersions(
    narrative: string,
    options: FeeNarrativeOptions
  ): Promise<string[]> {
    const alternatives: string[] = [];
    
    // Generate concise version
    const concise = this.generateConciseVersion(narrative);
    if (concise !== narrative) alternatives.push(concise);
    
    // Generate detailed version
    const detailed = this.generateDetailedVersion(narrative);
    if (detailed !== narrative) alternatives.push(detailed);
    
    return alternatives;
  }

  /**
   * Generate concise version
   */
  private generateConciseVersion(narrative: string): string {
    return narrative
      .replace(/Additionally,|Furthermore,|In addition,|Moreover,|Subsequently,/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generate detailed version
   */
  private generateDetailedVersion(narrative: string): string {
    // Add more specific legal language
    return narrative
      .replace(/reviewed/g, 'conducted a comprehensive review of')
      .replace(/drafted/g, 'prepared and drafted')
      .replace(/met with/g, 'conducted consultation with');
  }

  /**
   * Generate improvement suggestions
   */
  private generateImprovementSuggestions(narrative: string, timeEntries: TimeEntry[]): string[] {
    const suggestions: string[] = [];
    
    // Check for common issues
    if (narrative.length < 50) {
      suggestions.push('Consider adding more detail about the specific work performed');
    }
    
    if (!narrative.includes('resulting in') && !narrative.includes('achieving')) {
      suggestions.push('Consider adding outcomes or results achieved');
    }
    
    const uniqueWorkTypes = new Set(timeEntries.map(e => this.detectWorkType(e.description)));
    if (uniqueWorkTypes.size > 3) {
      suggestions.push('Consider grouping similar activities for better readability');
    }
    
    if (timeEntries.some(e => e.description.length < 10)) {
      suggestions.push('Some time entries have very brief descriptions - consider adding more detail');
    }
    
    return suggestions;
  }

  /**
   * Validate narrative quality
   */
  validateNarrative(narrative: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (narrative.length < 20) {
      issues.push('Narrative is too short');
    }
    
    if (narrative.length > 1000) {
      issues.push('Narrative is very long - consider condensing');
    }
    
    if (!narrative.includes('.')) {
      issues.push('Narrative should end with proper punctuation');
    }
    
    const wordCount = narrative.split(' ').length;
    if (wordCount < 10) {
      issues.push('Narrative should contain more descriptive content');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

// Export singleton instance
export const feeNarrativeGenerator = new FeeNarrativeGenerator();