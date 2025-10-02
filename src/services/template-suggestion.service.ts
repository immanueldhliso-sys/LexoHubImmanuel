/**
 * Template Suggestion Service
 * Analyzes text input and suggests relevant matter templates
 */

import { matterTemplatesService } from './api/matter-templates.service';
import type { MatterTemplate, TemplateCategory } from '../types/matter-templates';

export interface TemplateSuggestion {
  template: MatterTemplate;
  confidence: number;
  matchReasons: string[];
}

export interface TemplateAnalysis {
  suggestions: TemplateSuggestion[];
  extractedMatterData: Partial<{
    title: string;
    description: string;
    matter_type: string;
    client_name: string;
    court_case_number: string;
    tags: string;
  }>;
  confidence: number;
}

class TemplateAnalysisService {
  private readonly MATTER_TYPE_KEYWORDS = {
    'Commercial Litigation': ['commercial', 'business', 'contract dispute', 'breach', 'damages', 'litigation'],
    'Contract Law': ['contract', 'agreement', 'breach', 'terms', 'conditions', 'negotiation'],
    'Employment Law': ['employment', 'labour', 'ccma', 'dismissal', 'unfair', 'workplace'],
    'Family Law': ['divorce', 'custody', 'maintenance', 'family', 'marriage', 'separation'],
    'Criminal Law': ['criminal', 'charge', 'prosecution', 'defence', 'bail', 'plea'],
    'Property Law': ['property', 'transfer', 'conveyancing', 'mortgage', 'lease', 'real estate'],
    'Intellectual Property': ['trademark', 'copyright', 'patent', 'intellectual', 'brand'],
    'Tax Law': ['tax', 'sars', 'revenue', 'vat', 'income tax', 'assessment'],
    'Constitutional Law': ['constitutional', 'human rights', 'bill of rights', 'constitutional court'],
    'Administrative Law': ['administrative', 'government', 'public', 'municipal', 'state']
  };

  private readonly LEGAL_ENTITIES_PATTERNS = {
    courts: [
      'constitutional court', 'supreme court', 'high court', 'magistrate court',
      'labour court', 'land claims court', 'johannesburg', 'cape town', 'pretoria', 'durban'
    ],
    legalTerms: [
      'versus', 'v.', 'vs.', 'plaintiff', 'defendant', 'applicant', 'respondent',
      'matter', 'case', 'application', 'appeal', 'judgment', 'order'
    ],
    southAfricanTerms: [
      'pty ltd', 'close corporation', 'cc', 'inc', 'fideicommissum', 'testament',
      'usufruct', 'ccma', 'labour relations act', 'pleadings', 'affidavit'
    ]
  };

  /**
   * Analyze text input and suggest relevant templates
   */
  async analyzeTextForTemplates(text: string): Promise<TemplateAnalysis> {
    try {
      // Get all available templates
      const templates = await matterTemplatesService.getTemplates();
      
      // Extract matter-related information from text
      const extractedMatterData = this.extractMatterDataFromText(text);
      
      // Generate template suggestions
      const suggestions = this.generateTemplateSuggestions(text, templates, extractedMatterData);
      
      // Calculate overall confidence
      const confidence = this.calculateOverallConfidence(suggestions, extractedMatterData);

      return {
        suggestions: suggestions.slice(0, 5), // Top 5 suggestions
        extractedMatterData,
        confidence
      };
    } catch (error) {
      console.error('Error analyzing text for templates:', error);
      return {
        suggestions: [],
        extractedMatterData: {},
        confidence: 0
      };
    }
  }

  /**
   * Extract matter-related data from text input
   */
  private extractMatterDataFromText(text: string): TemplateAnalysis['extractedMatterData'] {
    const lowerText = text.toLowerCase();
    const extractedMatterData: TemplateAnalysis['extractedMatterData'] = {};

    // Extract matter type based on keywords
    for (const [matterType, keywords] of Object.entries(this.MATTER_TYPE_KEYWORDS)) {
      if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
        extractedMatterData.matter_type = matterType;
        break;
      }
    }

    // Extract client name patterns
    const clientPatterns = [
      /(?:for|representing|client)\s+([A-Z][a-zA-Z\s]+?)(?:\s|$|,|\.|versus|v\.)/i,
      /([A-Z][a-zA-Z\s]+?)\s+(?:versus|v\.?|vs\.?)\s+([A-Z][a-zA-Z\s]+)/i
    ];

    for (const pattern of clientPatterns) {
      const match = transcription.match(pattern);
      if (match) {
        extractedMatterData.client_name = match[1].trim();
        if (match[2]) {
          extractedMatterData.title = `${match[1].trim()} v ${match[2].trim()}`;
        }
        break;
      }
    }

    // Extract case number patterns
    const caseNumberPattern = /(?:case|matter|file)\s*(?:number|no\.?|#)\s*([A-Z0-9/-]+)/i;
    const caseMatch = transcription.match(caseNumberPattern);
    if (caseMatch) {
      extractedMatterData.court_case_number = caseMatch[1];
    }

    // Generate description from work type and context
    if (extractedData?.workType) {
      extractedMatterData.description = `${extractedData.workType} work related to ${extractedMatterData.client_name || 'client matter'}`;
    }

    // Extract tags from legal terms
    const tags: string[] = [];
    for (const terms of Object.values(this.LEGAL_ENTITIES_PATTERNS)) {
      for (const term of terms) {
        if (lowerText.includes(term.toLowerCase())) {
          tags.push(term);
        }
      }
    }
    if (tags.length > 0) {
      extractedMatterData.tags = tags.join(', ');
    }

    return extractedMatterData;
  }

  /**
   * Generate template suggestions based on analysis
   */
  private generateTemplateSuggestions(
    text: string, 
    templates: MatterTemplate[], 
    extractedData: TemplateAnalysis['extractedMatterData']
  ): TemplateSuggestion[] {
    const suggestions: TemplateSuggestion[] = [];
    const lowerText = text.toLowerCase();

    for (const template of templates) {
      const matchReasons: string[] = [];
      let confidence = 0;

      // Match by matter type
      if (extractedData.matter_type && template.data.matterType === extractedData.matter_type) {
        confidence += 0.4;
        matchReasons.push(`Matter type: ${extractedData.matter_type}`);
      }

      // Match by category keywords
      if (template.category) {
        const categoryKeywords = this.getCategoryKeywords(template.category);
        const keywordMatches = categoryKeywords.filter(keyword => 
          lowerText.includes(keyword.toLowerCase())
        );
        if (keywordMatches.length > 0) {
          confidence += 0.3 * (keywordMatches.length / categoryKeywords.length);
          matchReasons.push(`Category keywords: ${keywordMatches.join(', ')}`);
        }
      }

      // Match by template tags
      if (template.data.tags) {
        const templateTags = template.data.tags.split(',').map(tag => tag.trim().toLowerCase());
        const tagMatches = templateTags.filter(tag => lowerText.includes(tag));
        if (tagMatches.length > 0) {
          confidence += 0.2 * (tagMatches.length / templateTags.length);
          matchReasons.push(`Template tags: ${tagMatches.join(', ')}`);
        }
      }

      // Match by description similarity
      if (template.data.description) {
        const descriptionWords = template.data.description.toLowerCase().split(/\s+/);
        const textWords = lowerText.split(/\s+/);
        const commonWords = descriptionWords.filter(word => 
          word.length > 3 && textWords.includes(word)
        );
        if (commonWords.length > 0) {
          confidence += 0.1 * (commonWords.length / descriptionWords.length);
          matchReasons.push(`Description similarity: ${commonWords.length} common words`);
        }
      }

      // Only include suggestions with meaningful confidence
      if (confidence > 0.1 && matchReasons.length > 0) {
        suggestions.push({
          template,
          confidence: Math.min(confidence, 1.0),
          matchReasons
        });
      }
    }

    // Sort by confidence
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get keywords for a template category
   */
  private getCategoryKeywords(category: TemplateCategory): string[] {
    const categoryKeywordMap: Record<TemplateCategory, string[]> = {
      'litigation': ['litigation', 'court', 'case', 'lawsuit', 'dispute', 'trial'],
      'corporate': ['corporate', 'company', 'business', 'commercial', 'entity'],
      'property': ['property', 'real estate', 'conveyancing', 'transfer', 'lease'],
      'family': ['family', 'divorce', 'custody', 'maintenance', 'marriage'],
      'criminal': ['criminal', 'charge', 'prosecution', 'defence', 'bail'],
      'employment': ['employment', 'labour', 'workplace', 'dismissal', 'ccma'],
      'intellectual_property': ['intellectual property', 'trademark', 'copyright', 'patent'],
      'tax': ['tax', 'revenue', 'sars', 'vat', 'assessment'],
      'other': ['legal', 'matter', 'case', 'client']
    };

    return categoryKeywordMap[category] || [];
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(suggestions: TemplateSuggestion[], extractedData: TemplateAnalysis['extractedMatterData']): number {
    if (suggestions.length === 0) return 0;

    const topSuggestionConfidence = suggestions[0]?.confidence || 0;
    const dataExtractionScore = Object.keys(extractedData).length * 0.1;
    
    return Math.min(topSuggestionConfidence + dataExtractionScore, 1.0);
  }

  /**
   * Get smart template suggestions based on recent text activity
   */
  async getSmartSuggestions(recentTexts: string[]): Promise<TemplateSuggestion[]> {
    if (recentTexts.length === 0) return [];

    // Combine recent texts for analysis
    const combinedText = recentTexts.join(' ');
    const analysis = await this.analyzeTextForTemplates(combinedText);
    
    return analysis.suggestions;
  }
}

export const templateSuggestionService = new TemplateAnalysisService();