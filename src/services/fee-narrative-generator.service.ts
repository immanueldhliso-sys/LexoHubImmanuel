/**
 * Enhanced Fee Narrative Generator Service
 * AI-powered generation of detailed, justifiable fee descriptions
 * Bar Council compliant narratives for South African legal practice
 */

import type { TimeEntry, Matter, NarrativePrompt, NarrativeGenerationRequest, NarrativeGenerationResponse } from '../types';

export interface FeeNarrativeOptions {
  includeTimeBreakdown?: boolean;
  includeWorkTypeDetails?: boolean;
  formalTone?: boolean;
  includeOutcomes?: boolean;
  groupByWorkType?: boolean;
  narrativeType?: 'litigation' | 'advisory' | 'general';
  includeComplexityJustification?: boolean;
  includeValueDelivered?: boolean;
}

export interface GeneratedNarrative {
  narrative: string;
  wordCount: number;
  confidence: number;
  suggestions: string[];
  alternativeVersions: string[];
}

export class FeeNarrativeGenerator {
  // Bar Council compliant narrative prompts
  private readonly NARRATIVE_PROMPTS: Record<string, NarrativePrompt> = {
    litigation: {
      type: 'litigation',
      prompt: `Generate a professional fee narrative for a South African litigation matter.
Include:
- Brief case overview
- Services rendered
- Professional opinion on complexity
- Justification for fees
Matter: {matterTitle}
Services: {services}
Hours: {totalHours}
Tone: Professional, formal, Bar-compliant`,
      template: `Professional services rendered in connection with the {matterType} matter of {clientName} v {opposingParty}.

The matter involved {complexityDescription} requiring extensive {serviceTypes}. Our services included:

{detailedServices}

The complexity of this matter necessitated {justification} which is reflected in the time allocated to ensure proper representation and adherence to professional standards.

Total professional time: {totalHours} hours at the prescribed rates in accordance with the Legal Practice Act and Bar Council guidelines.`,
      keywords: ['litigation', 'court', 'trial', 'hearing', 'pleadings', 'motion', 'application', 'judgment']
    },
    advisory: {
      type: 'advisory',
      prompt: `Generate a professional fee narrative for advisory legal services.
Include:
- Scope of advisory work
- Research and analysis performed
- Value delivered to client
Matter: {matterTitle}
Services: {services}
Hours: {totalHours}
Tone: Professional, consultative`,
      template: `Professional advisory services provided to {clientName} in connection with {matterDescription}.

The scope of work encompassed {scopeOfWork} requiring comprehensive legal analysis and strategic advice. Our services included:

{detailedServices}

The advisory work delivered significant value through {valueDelivered} and ensured compliance with applicable legal requirements and best practices.

Total professional time: {totalHours} hours reflecting the complexity and importance of the advisory services provided.`,
      keywords: ['advisory', 'consultation', 'advice', 'opinion', 'compliance', 'review', 'analysis', 'strategy']
    },
    general: {
      type: 'general',
      prompt: `Generate a professional fee narrative for general legal services.
Include:
- Description of services rendered
- Professional standards maintained
- Time allocation justification
Matter: {matterTitle}
Services: {services}
Hours: {totalHours}
Tone: Professional, comprehensive`,
      template: `Professional legal services rendered in connection with the {matterTitle} matter for {clientName}.

Our services encompassed {serviceDescription} conducted in accordance with professional standards and ethical requirements. The work included:

{detailedServices}

The time allocated reflects the professional care and attention required to ensure quality service delivery and compliance with applicable legal and professional standards.

Total professional time: {totalHours} hours at the applicable professional rates.`,
      keywords: ['legal services', 'professional', 'consultation', 'assistance', 'representation']
    }
  };

  // Bar Council compliance guidelines
  private readonly BAR_COMPLIANCE_RULES = {
    feeJustification: [
      'complexity of the matter',
      'time and labour required',
      'skill and specialized knowledge required',
      'responsibility assumed',
      'importance of the matter to the client',
      'results achieved',
      'urgency of the matter',
      'experience and reputation of the practitioner'
    ],
    professionalStandards: [
      'Legal Practice Act compliance',
      'Bar Council guidelines adherence',
      'Professional conduct rules',
      'Ethical requirements',
      'Quality service delivery',
      'Client care standards'
    ],
    narrativeRequirements: [
      'Clear description of services',
      'Justification for time spent',
      'Professional language and tone',
      'Compliance with billing guidelines',
      'Transparency in fee structure',
      'Value proposition articulation'
    ]
  };

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
   * Generate Bar-compliant fee narrative using AI prompts
   */
  async generateBarCompliantNarrative(
    request: NarrativeGenerationRequest
  ): Promise<NarrativeGenerationResponse> {
    const { timeEntries, matter, options = {} } = request;
    const narrativeType = options.narrativeType || this.detectNarrativeType(timeEntries, matter);
    
    try {
      // Get the appropriate prompt template
      const promptTemplate = this.NARRATIVE_PROMPTS[narrativeType];
      
      // Prepare context data
      const context = this.prepareNarrativeContext(timeEntries, matter, options);
      
      // Generate the narrative using the template
      const narrative = this.generateFromTemplate(promptTemplate, context, options);
      
      // Validate Bar Council compliance
      const complianceCheck = this.validateBarCompliance(narrative, timeEntries, matter);
      
      // Generate alternatives
      const alternatives = await this.generateAlternativeVersions(narrative, options);
      
      // Generate improvement suggestions
      const suggestions = this.generateBarCompliantSuggestions(narrative, timeEntries, complianceCheck);
      
      return {
        narrative: this.formatNarrative(narrative, true),
        wordCount: narrative.split(' ').length,
        confidence: this.calculateNarrativeConfidence(timeEntries, narrative),
        suggestions,
        alternativeVersions: alternatives,
        complianceCheck,
        narrativeType,
        isEditable: true,
        barCompliant: complianceCheck.isCompliant
      };
      
    } catch (error) {
      console.error('Bar-compliant narrative generation failed:', error);
      throw new Error('Failed to generate Bar-compliant fee narrative');
    }
  }

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
   * Detect narrative type based on time entries and matter
   */
  private detectNarrativeType(timeEntries: TimeEntry[], matter: Matter): 'litigation' | 'advisory' | 'general' {
    const descriptions = timeEntries.map(e => e.description.toLowerCase()).join(' ');
    const matterTitle = matter.title?.toLowerCase() || '';
    const matterDescription = matter.description?.toLowerCase() || '';
    
    const allText = `${descriptions} ${matterTitle} ${matterDescription}`;
    
    // Check for litigation keywords
    const litigationKeywords = this.NARRATIVE_PROMPTS.litigation.keywords;
    const litigationMatches = litigationKeywords.filter(keyword => allText.includes(keyword)).length;
    
    // Check for advisory keywords
    const advisoryKeywords = this.NARRATIVE_PROMPTS.advisory.keywords;
    const advisoryMatches = advisoryKeywords.filter(keyword => allText.includes(keyword)).length;
    
    if (litigationMatches > advisoryMatches && litigationMatches > 0) {
      return 'litigation';
    } else if (advisoryMatches > 0) {
      return 'advisory';
    }
    
    return 'general';
  }

  /**
   * Prepare narrative context for template generation
   */
  private prepareNarrativeContext(
    timeEntries: TimeEntry[],
    matter: Matter,
    options: FeeNarrativeOptions
  ): Record<string, string> {
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.duration, 0) / 60;
    const services = this.extractServices(timeEntries);
    const serviceTypes = this.extractServiceTypes(timeEntries);
    
    return {
      matterTitle: matter.title || 'Legal Matter',
      matterType: matter.matterType || 'Legal',
      matterDescription: matter.description || 'Legal services matter',
      clientName: matter.clientName || 'Client',
      opposingParty: this.extractOpposingParty(matter) || 'Opposing Party',
      totalHours: totalHours.toFixed(1),
      services: services.join(', '),
      serviceTypes: serviceTypes.join(', '),
      detailedServices: this.generateDetailedServicesList(timeEntries),
      complexityDescription: this.generateComplexityDescription(timeEntries, matter),
      justification: this.generateFeeJustification(timeEntries, matter, options),
      scopeOfWork: this.generateScopeOfWork(timeEntries),
      valueDelivered: this.generateValueDelivered(timeEntries, matter, options),
      serviceDescription: this.generateServiceDescription(timeEntries)
    };
  }

  /**
   * Generate narrative from template
   */
  private generateFromTemplate(
    promptTemplate: NarrativePrompt,
    context: Record<string, string>,
    options: FeeNarrativeOptions
  ): string {
    let narrative = promptTemplate.template;
    
    // Replace template variables
    Object.entries(context).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      narrative = narrative.replace(new RegExp(placeholder, 'g'), value);
    });
    
    // Add complexity justification if requested
    if (options.includeComplexityJustification) {
      narrative += `\n\nThe complexity of this matter is justified by ${context.complexityDescription}.`;
    }
    
    // Add value delivered if requested
    if (options.includeValueDelivered && context.valueDelivered) {
      narrative += `\n\nValue delivered: ${context.valueDelivered}.`;
    }
    
    return narrative;
  }

  /**
   * Validate Bar Council compliance
   */
  private validateBarCompliance(
    narrative: string,
    timeEntries: TimeEntry[],
    matter: Matter
  ): any {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check for required elements
    if (!narrative.includes('professional')) {
      issues.push('Narrative should emphasize professional service delivery');
      recommendations.push('Include references to professional standards');
    }
    
    if (!narrative.includes('time') && !narrative.includes('hours')) {
      issues.push('Narrative should include time allocation details');
      recommendations.push('Add clear time breakdown and justification');
    }
    
    // Check for fee justification elements
    const hasJustification = this.BAR_COMPLIANCE_RULES.feeJustification.some(
      element => narrative.toLowerCase().includes(element.toLowerCase())
    );
    
    if (!hasJustification) {
      issues.push('Narrative lacks proper fee justification');
      recommendations.push('Include justification based on complexity, skill required, or results achieved');
    }
    
    // Check professional language
    const unprofessionalWords = ['cheap', 'quick', 'easy', 'simple'];
    const hasUnprofessionalLanguage = unprofessionalWords.some(
      word => narrative.toLowerCase().includes(word)
    );
    
    if (hasUnprofessionalLanguage) {
      issues.push('Narrative contains unprofessional language');
      recommendations.push('Use formal, professional terminology throughout');
    }
    
    return {
      isCompliant: issues.length === 0,
      issues,
      recommendations,
      complianceScore: Math.max(0, 100 - (issues.length * 20))
    };
  }

  /**
   * Generate Bar-compliant suggestions
   */
  private generateBarCompliantSuggestions(
    narrative: string,
    timeEntries: TimeEntry[],
    complianceCheck: any
  ): string[] {
    const suggestions: string[] = [...complianceCheck.recommendations];
    
    // Add general improvement suggestions
    if (narrative.length < 100) {
      suggestions.push('Consider expanding the narrative to provide more comprehensive service description');
    }
    
    if (!narrative.includes('Legal Practice Act') && !narrative.includes('Bar Council')) {
      suggestions.push('Consider referencing applicable professional standards or guidelines');
    }
    
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.duration, 0) / 60;
    if (totalHours > 10 && !narrative.includes('complexity')) {
      suggestions.push('For matters requiring significant time, emphasize complexity and skill required');
    }
    
    return suggestions;
  }

  /**
   * Extract services from time entries
   */
  private extractServices(timeEntries: TimeEntry[]): string[] {
    const services = new Set<string>();
    
    timeEntries.forEach(entry => {
      const workType = this.detectWorkType(entry.description);
      services.add(workType.toLowerCase());
    });
    
    return Array.from(services);
  }

  /**
   * Extract service types for narrative
   */
  private extractServiceTypes(timeEntries: TimeEntry[]): string[] {
    const types = new Set<string>();
    
    timeEntries.forEach(entry => {
      const desc = entry.description.toLowerCase();
      if (desc.includes('research')) types.add('legal research');
      if (desc.includes('draft')) types.add('document drafting');
      if (desc.includes('review')) types.add('document review');
      if (desc.includes('court') || desc.includes('hearing')) types.add('court representation');
      if (desc.includes('client') || desc.includes('meeting')) types.add('client consultation');
      if (desc.includes('correspondence')) types.add('professional correspondence');
    });
    
    return Array.from(types);
  }

  /**
   * Extract opposing party from matter
   */
  private extractOpposingParty(matter: Matter): string | null {
    const title = matter.title?.toLowerCase() || '';
    const description = matter.description?.toLowerCase() || '';
    
    // Look for common patterns like "vs", "v", "against"
    const vsMatch = title.match(/\sv\s(.+?)(?:\s|$)/);
    if (vsMatch) return vsMatch[1];
    
    const againstMatch = description.match(/against\s(.+?)(?:\s|$)/);
    if (againstMatch) return againstMatch[1];
    
    return null;
  }

  /**
   * Generate detailed services list
   */
  private generateDetailedServicesList(timeEntries: TimeEntry[]): string {
    const groupedEntries = this.groupEntriesByWorkType(timeEntries);
    const servicesList: string[] = [];
    
    groupedEntries.forEach((entries, workType) => {
      const totalTime = entries.reduce((sum, entry) => sum + entry.duration, 0);
      const hours = (totalTime / 60).toFixed(1);
      servicesList.push(`• ${workType}: ${hours} hours`);
    });
    
    return servicesList.join('\n');
  }

  /**
   * Generate complexity description
   */
  private generateComplexityDescription(timeEntries: TimeEntry[], matter: Matter): string {
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.duration, 0) / 60;
    const uniqueWorkTypes = new Set(timeEntries.map(e => this.detectWorkType(e.description))).size;
    
    if (totalHours > 20 || uniqueWorkTypes > 4) {
      return 'complex legal issues requiring extensive analysis and multiple areas of expertise';
    } else if (totalHours > 10 || uniqueWorkTypes > 2) {
      return 'multifaceted legal matters requiring careful consideration and professional expertise';
    } else {
      return 'legal matters requiring professional attention and specialized knowledge';
    }
  }

  /**
   * Generate fee justification
   */
  private generateFeeJustification(
    timeEntries: TimeEntry[],
    matter: Matter,
    options: FeeNarrativeOptions
  ): string {
    const justifications: string[] = [];
    
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.duration, 0) / 60;
    if (totalHours > 10) {
      justifications.push('the substantial time and labour required');
    }
    
    const uniqueWorkTypes = new Set(timeEntries.map(e => this.detectWorkType(e.description))).size;
    if (uniqueWorkTypes > 3) {
      justifications.push('the diverse skill set and specialized knowledge required');
    }
    
    if (matter.riskLevel === 'high') {
      justifications.push('the significant responsibility and risk assumed');
    }
    
    if (justifications.length === 0) {
      justifications.push('the professional care and attention required');
    }
    
    return justifications.join(', ');
  }

  /**
   * Generate scope of work description
   */
  private generateScopeOfWork(timeEntries: TimeEntry[]): string {
    const workTypes = this.extractServiceTypes(timeEntries);
    return workTypes.join(', ');
  }

  /**
   * Generate value delivered description
   */
  private generateValueDelivered(
    timeEntries: TimeEntry[],
    matter: Matter,
    options: FeeNarrativeOptions
  ): string {
    const values: string[] = [];
    
    if (timeEntries.some(e => e.description.toLowerCase().includes('research'))) {
      values.push('comprehensive legal analysis and research');
    }
    
    if (timeEntries.some(e => e.description.toLowerCase().includes('draft'))) {
      values.push('professionally drafted documentation');
    }
    
    if (timeEntries.some(e => e.description.toLowerCase().includes('advice'))) {
      values.push('strategic legal advice and guidance');
    }
    
    if (values.length === 0) {
      values.push('professional legal services and expertise');
    }
    
    return values.join(', ');
  }

  /**
   * Generate service description
   */
  private generateServiceDescription(timeEntries: TimeEntry[]): string {
    const descriptions = timeEntries.map(entry => {
      const workType = this.detectWorkType(entry.description);
      return workType.toLowerCase();
    });
    
    const uniqueDescriptions = [...new Set(descriptions)];
    return uniqueDescriptions.join(', ');
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