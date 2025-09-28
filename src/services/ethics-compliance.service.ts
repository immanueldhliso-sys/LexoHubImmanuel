/**
 * Ethics Rule Alerts Service
 * Proactive monitoring and alerts for professional conduct compliance
 */

import type { Matter, User, TimeEntry, Invoice } from '../types';

export interface EthicsRule {
  id: string;
  category: EthicsCategory;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  barCouncil: 'johannesburg' | 'cape_town' | 'national';
  ruleReference: string;
  checkFunction: (context: EthicsCheckContext) => EthicsViolation[];
}

export interface EthicsViolation {
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  affectedEntities: string[];
  canProceed: boolean;
  requiresDisclosure: boolean;
  deadline?: Date;
}

export interface EthicsCheckContext {
  user: User;
  matter?: Matter;
  timeEntries?: TimeEntry[];
  invoices?: Invoice[];
  proposedAction?: string;
  relatedParties?: string[];
}

export enum EthicsCategory {
  CONFLICT_OF_INTEREST = 'conflict_of_interest',
  CLIENT_CONFIDENTIALITY = 'client_confidentiality',
  FEE_ARRANGEMENTS = 'fee_arrangements',
  PROFESSIONAL_CONDUCT = 'professional_conduct',
  TRUST_ACCOUNT = 'trust_account',
  ADVERTISING = 'advertising',
  COMPETENCE = 'competence',
  INDEPENDENCE = 'independence'
}

export class EthicsComplianceService {
  private rules: Map<string, EthicsRule> = new Map();
  private violationHistory: Map<string, EthicsViolation[]> = new Map();

  constructor() {
    this.initializeRules();
  }

  /**
   * Check for ethics violations in a given context
   */
  async checkCompliance(context: EthicsCheckContext): Promise<EthicsViolation[]> {
    const violations: EthicsViolation[] = [];

    for (const rule of this.rules.values()) {
      try {
        const ruleViolations = rule.checkFunction(context);
        violations.push(...ruleViolations);
      } catch (error) {
        console.error(`Error checking rule ${rule.id}:`, error);
      }
    }

    // Sort by severity
    violations.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    // Store violations for history
    if (violations.length > 0) {
      const userId = context.user.id;
      if (!this.violationHistory.has(userId)) {
        this.violationHistory.set(userId, []);
      }
      this.violationHistory.get(userId)!.push(...violations);
    }

    return violations;
  }

  /**
   * Check before accepting a new matter
   */
  async checkNewMatterCompliance(
    user: User,
    proposedMatter: Partial<Matter>,
    existingMatters: Matter[]
  ): Promise<EthicsViolation[]> {
    const context: EthicsCheckContext = {
      user,
      matter: proposedMatter as Matter,
      proposedAction: 'accept_new_matter',
      relatedParties: [
        proposedMatter.clientName,
        proposedMatter.instructingAttorney,
        proposedMatter.instructingFirm
      ].filter(Boolean) as string[]
    };

    return this.checkCompliance(context);
  }

  /**
   * Check fee arrangement compliance
   */
  async checkFeeArrangement(
    user: User,
    matter: Matter,
    proposedFee: number,
    feeType: 'hourly' | 'fixed' | 'contingency' | 'success'
  ): Promise<EthicsViolation[]> {
    const context: EthicsCheckContext = {
      user,
      matter,
      proposedAction: `fee_arrangement_${feeType}`
    };

    return this.checkCompliance(context);
  }

  /**
   * Check trust account transaction compliance
   */
  async checkTrustAccountTransaction(
    user: User,
    amount: number,
    transactionType: 'deposit' | 'withdrawal' | 'transfer',
    matter?: Matter
  ): Promise<EthicsViolation[]> {
    const context: EthicsCheckContext = {
      user,
      matter,
      proposedAction: `trust_${transactionType}_${amount}`
    };

    return this.checkCompliance(context);
  }

  /**
   * Get compliance dashboard data
   */
  getComplianceDashboard(user: User): {
    overallScore: number;
    recentViolations: EthicsViolation[];
    riskAreas: string[];
    recommendations: string[];
  } {
    const userViolations = this.violationHistory.get(user.id) || [];
    const recentViolations = userViolations
      .filter(v => {
        const violationDate = new Date(); // In real implementation, violations would have timestamps
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return violationDate > thirtyDaysAgo;
      })
      .slice(0, 10);

    // Calculate compliance score
    const totalRules = this.rules.size;
    const violatedRules = new Set(userViolations.map(v => v.ruleId)).size;
    const overallScore = Math.max(0, ((totalRules - violatedRules) / totalRules) * 100);

    // Identify risk areas
    const riskAreas = this.identifyRiskAreas(userViolations);

    // Generate recommendations
    const recommendations = this.generateRecommendations(userViolations, riskAreas);

    return {
      overallScore: Math.round(overallScore),
      recentViolations,
      riskAreas,
      recommendations
    };
  }

  /**
   * Initialize ethics rules
   */
  private initializeRules(): void {
    // Conflict of Interest Rules
    this.addRule({
      id: 'conflict_direct_adverse',
      category: EthicsCategory.CONFLICT_OF_INTEREST,
      title: 'Direct Adverse Interest Conflict',
      description: 'Cannot represent parties with directly adverse interests',
      severity: 'critical',
      barCouncil: 'national',
      ruleReference: 'Rule 2.04',
      checkFunction: (context) => this.checkDirectAdverseConflict(context)
    });

    this.addRule({
      id: 'conflict_former_client',
      category: EthicsCategory.CONFLICT_OF_INTEREST,
      title: 'Former Client Conflict',
      description: 'Cannot act against former client in related matter',
      severity: 'high',
      barCouncil: 'national',
      ruleReference: 'Rule 2.05',
      checkFunction: (context) => this.checkFormerClientConflict(context)
    });

    // Fee Arrangement Rules
    this.addRule({
      id: 'fee_contingency_limit',
      category: EthicsCategory.FEE_ARRANGEMENTS,
      title: 'Contingency Fee Limitations',
      description: 'Contingency fees subject to specific limitations',
      severity: 'medium',
      barCouncil: 'national',
      ruleReference: 'Rule 3.02',
      checkFunction: (context) => this.checkContingencyFeeLimit(context)
    });

    this.addRule({
      id: 'fee_reasonableness',
      category: EthicsCategory.FEE_ARRANGEMENTS,
      title: 'Fee Reasonableness',
      description: 'Fees must be reasonable and proportionate',
      severity: 'medium',
      barCouncil: 'national',
      ruleReference: 'Rule 3.01',
      checkFunction: (context) => this.checkFeeReasonableness(context)
    });

    // Trust Account Rules
    this.addRule({
      id: 'trust_mixing_prohibition',
      category: EthicsCategory.TRUST_ACCOUNT,
      title: 'Trust Account Mixing Prohibition',
      description: 'Cannot mix client funds with own funds',
      severity: 'critical',
      barCouncil: 'national',
      ruleReference: 'Rule 4.01',
      checkFunction: (context) => this.checkTrustAccountMixing(context)
    });

    // Professional Conduct Rules
    this.addRule({
      id: 'competence_requirement',
      category: EthicsCategory.COMPETENCE,
      title: 'Competence Requirement',
      description: 'Must be competent in area of practice',
      severity: 'high',
      barCouncil: 'national',
      ruleReference: 'Rule 1.01',
      checkFunction: (context) => this.checkCompetenceRequirement(context)
    });

    // Client Confidentiality Rules
    this.addRule({
      id: 'confidentiality_breach',
      category: EthicsCategory.CLIENT_CONFIDENTIALITY,
      title: 'Client Confidentiality',
      description: 'Must maintain client confidentiality',
      severity: 'critical',
      barCouncil: 'national',
      ruleReference: 'Rule 2.01',
      checkFunction: (context) => this.checkConfidentialityBreach(context)
    });
  }

  /**
   * Add a new ethics rule
   */
  private addRule(rule: EthicsRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Check for direct adverse interest conflicts
   */
  private checkDirectAdverseConflict(context: EthicsCheckContext): EthicsViolation[] {
    const violations: EthicsViolation[] = [];

    if (!context.matter || !context.relatedParties) return violations;

    // In a real implementation, this would check against a database of existing matters
    // For now, we'll simulate some basic checks

    const clientName = context.matter.clientName?.toLowerCase();
    const opposingParties = context.relatedParties.map(p => p.toLowerCase());

    // Check if client appears as opposing party in other matters
    if (opposingParties.some(party => party.includes('opposing') || party.includes('defendant'))) {
      violations.push({
        ruleId: 'conflict_direct_adverse',
        severity: 'critical',
        title: 'Potential Direct Adverse Interest',
        description: 'Client may have adverse interest to existing client',
        recommendation: 'Conduct thorough conflict check and obtain written consent if proceeding',
        affectedEntities: [context.matter.id || 'new-matter'],
        canProceed: false,
        requiresDisclosure: true
      });
    }

    return violations;
  }

  /**
   * Check for former client conflicts
   */
  private checkFormerClientConflict(context: EthicsCheckContext): EthicsViolation[] {
    const violations: EthicsViolation[] = [];

    // Simulate former client check
    if (context.matter?.clientName?.toLowerCase().includes('former')) {
      violations.push({
        ruleId: 'conflict_former_client',
        severity: 'high',
        title: 'Former Client Conflict',
        description: 'Matter may involve former client relationship',
        recommendation: 'Review former client files and obtain consent if substantially related',
        affectedEntities: [context.matter.id || 'new-matter'],
        canProceed: true,
        requiresDisclosure: true
      });
    }

    return violations;
  }

  /**
   * Check contingency fee limitations
   */
  private checkContingencyFeeLimit(context: EthicsCheckContext): EthicsViolation[] {
    const violations: EthicsViolation[] = [];

    if (context.proposedAction?.includes('contingency')) {
      // Check if contingency fee is appropriate for matter type
      const matterType = context.matter?.briefType?.toLowerCase();
      
      if (matterType?.includes('criminal') || matterType?.includes('family')) {
        violations.push({
          ruleId: 'fee_contingency_limit',
          severity: 'critical',
          title: 'Prohibited Contingency Fee',
          description: 'Contingency fees not permitted in criminal or family matters',
          recommendation: 'Use hourly or fixed fee arrangement instead',
          affectedEntities: [context.matter?.id || 'matter'],
          canProceed: false,
          requiresDisclosure: false
        });
      }
    }

    return violations;
  }

  /**
   * Check fee reasonableness
   */
  private checkFeeReasonableness(context: EthicsCheckContext): EthicsViolation[] {
    const violations: EthicsViolation[] = [];

    // Extract fee amount from proposed action
    const feeMatch = context.proposedAction?.match(/fee_arrangement_(\d+)/);
    if (feeMatch) {
      const proposedFee = parseInt(feeMatch[1]);
      const standardRate = 2500; // Standard hourly rate

      if (proposedFee > standardRate * 3) {
        violations.push({
          ruleId: 'fee_reasonableness',
          severity: 'medium',
          title: 'Potentially Unreasonable Fee',
          description: 'Proposed fee significantly exceeds standard rates',
          recommendation: 'Justify fee with complexity, urgency, or specialized expertise',
          affectedEntities: [context.matter?.id || 'matter'],
          canProceed: true,
          requiresDisclosure: true
        });
      }
    }

    return violations;
  }

  /**
   * Check trust account mixing
   */
  private checkTrustAccountMixing(context: EthicsCheckContext): EthicsViolation[] {
    const violations: EthicsViolation[] = [];

    if (context.proposedAction?.includes('trust_')) {
      // Simulate trust account checks
      const actionParts = context.proposedAction.split('_');
      const transactionType = actionParts[1];
      const amount = parseFloat(actionParts[2]);

      if (transactionType === 'withdrawal' && amount > 100000) {
        violations.push({
          ruleId: 'trust_mixing_prohibition',
          severity: 'high',
          title: 'Large Trust Account Withdrawal',
          description: 'Large withdrawal requires additional verification',
          recommendation: 'Ensure proper authorization and documentation',
          affectedEntities: ['trust-account'],
          canProceed: true,
          requiresDisclosure: false,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });
      }
    }

    return violations;
  }

  /**
   * Check competence requirement
   */
  private checkCompetenceRequirement(context: EthicsCheckContext): EthicsViolation[] {
    const violations: EthicsViolation[] = [];

    if (context.matter && context.user) {
      const matterType = context.matter.briefType?.toLowerCase();
      const userSpecializations = context.user.specialisations?.map(s => s.toLowerCase()) || [];

      // Check if user has relevant specialization
      const hasRelevantExperience = userSpecializations.some(spec => 
        matterType?.includes(spec) || spec.includes(matterType || '')
      );

      if (!hasRelevantExperience && matterType) {
        violations.push({
          ruleId: 'competence_requirement',
          severity: 'medium',
          title: 'Competence Consideration',
          description: 'Matter type not in listed specializations',
          recommendation: 'Ensure competence through study, association with experienced counsel, or referral',
          affectedEntities: [context.matter.id || 'matter'],
          canProceed: true,
          requiresDisclosure: false
        });
      }
    }

    return violations;
  }

  /**
   * Check confidentiality breach
   */
  private checkConfidentialityBreach(context: EthicsCheckContext): EthicsViolation[] {
    const violations: EthicsViolation[] = [];

    // This would integrate with document sharing, communication logs, etc.
    // For now, we'll return empty as this requires more complex integration

    return violations;
  }

  /**
   * Identify risk areas from violation history
   */
  private identifyRiskAreas(violations: EthicsViolation[]): string[] {
    const riskCounts = new Map<string, number>();

    for (const violation of violations) {
      const rule = this.rules.get(violation.ruleId);
      if (rule) {
        const category = rule.category;
        riskCounts.set(category, (riskCounts.get(category) || 0) + 1);
      }
    }

    return Array.from(riskCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);
  }

  /**
   * Generate recommendations based on violations and risk areas
   */
  private generateRecommendations(violations: EthicsViolation[], riskAreas: string[]): string[] {
    const recommendations: string[] = [];

    if (riskAreas.includes(EthicsCategory.CONFLICT_OF_INTEREST)) {
      recommendations.push('Implement systematic conflict checking procedures');
      recommendations.push('Maintain comprehensive client database for conflict screening');
    }

    if (riskAreas.includes(EthicsCategory.FEE_ARRANGEMENTS)) {
      recommendations.push('Review fee structures against Bar Council guidelines');
      recommendations.push('Document fee arrangements in writing');
    }

    if (riskAreas.includes(EthicsCategory.TRUST_ACCOUNT)) {
      recommendations.push('Conduct monthly trust account reconciliations');
      recommendations.push('Implement dual authorization for large transactions');
    }

    if (violations.some(v => v.severity === 'critical')) {
      recommendations.push('Seek immediate professional conduct guidance');
    }

    return recommendations;
  }

  /**
   * Get ethics training recommendations
   */
  getTrainingRecommendations(user: User): string[] {
    const violations = this.violationHistory.get(user.id) || [];
    const recommendations: string[] = [];

    const riskAreas = this.identifyRiskAreas(violations);

    if (riskAreas.includes(EthicsCategory.CONFLICT_OF_INTEREST)) {
      recommendations.push('Conflict of Interest Management Course');
    }

    if (riskAreas.includes(EthicsCategory.TRUST_ACCOUNT)) {
      recommendations.push('Trust Account Management Training');
    }

    if (riskAreas.includes(EthicsCategory.FEE_ARRANGEMENTS)) {
      recommendations.push('Ethical Fee Arrangements Workshop');
    }

    // Always recommend general ethics training
    recommendations.push('Annual Professional Conduct Update');

    return recommendations;
  }
}

// Export singleton instance
export const ethicsComplianceService = new EthicsComplianceService();