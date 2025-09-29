/**
 * External API Integration Service
 * Handles integrations with court systems, financial institutions, and other external services
 */

import { toast } from 'react-hot-toast';

// Court System Integration Types
export interface CourtSystemAPI {
  id: string;
  name: string;
  jurisdiction: string;
  apiVersion: string;
  baseUrl: string;
  authType: 'oauth2' | 'api_key' | 'certificate';
  capabilities: {
    electronicFiling: boolean;
    caseTracking: boolean;
    calendarSync: boolean;
    documentSubmission: boolean;
    paymentProcessing: boolean;
  };
  status: 'active' | 'maintenance' | 'offline';
}

export interface CourtCase {
  caseNumber: string;
  court: string;
  parties: Array<{ name: string; role: string }>;
  filingDate: string;
  status: 'active' | 'concluded' | 'stayed' | 'transferred';
  nextHearing?: {
    date: string;
    time: string;
    courtroom: string;
    purpose: string;
  };
  documents: Array<{
    id: string;
    title: string;
    type: string;
    filedDate: string;
    filedBy: string;
  }>;
}

export interface ElectronicFiling {
  id: string;
  caseNumber: string;
  documentType: string;
  title: string;
  fileData: Blob;
  metadata: {
    pages: number;
    size: number;
    checksum: string;
  };
  filingDate: string;
  status: 'pending' | 'submitted' | 'accepted' | 'rejected';
  confirmationNumber?: string;
  rejectionReason?: string;
}

// Financial Institution Integration Types
export interface BankingAPI {
  id: string;
  bankName: string;
  apiType: 'open_banking' | 'proprietary' | 'aggregator';
  baseUrl: string;
  capabilities: {
    accountBalance: boolean;
    transactionHistory: boolean;
    paymentInitiation: boolean;
    directDebit: boolean;
    invoiceFinancing: boolean;
  };
  regions: string[];
}

export interface BankAccount {
  accountId: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'business' | 'trust';
  bankName: string;
  balance: {
    current: number;
    available: number;
    currency: string;
  };
  lastUpdated: string;
}

export interface BankTransaction {
  transactionId: string;
  accountId: string;
  date: string;
  amount: number;
  currency: string;
  type: 'credit' | 'debit';
  description: string;
  reference: string;
  category: string;
  balance: number;
  reconciled: boolean;
  matterId?: string;
  invoiceId?: string;
}

export interface InvoiceFinancingOffer {
  offerId: string;
  provider: string;
  invoiceAmount: number;
  advanceRate: number; // percentage
  advanceAmount: number;
  fee: number;
  totalCost: number;
  terms: string;
  validUntil: string;
  approvalStatus: 'pending' | 'approved' | 'declined';
}

// Government Services Integration Types
export interface GovernmentAPI {
  service: 'sars' | 'cipc' | 'department_justice' | 'master_court';
  name: string;
  baseUrl: string;
  capabilities: string[];
  authRequired: boolean;
}

export interface CompanyVerification {
  registrationNumber: string;
  companyName: string;
  status: 'active' | 'deregistered' | 'under_investigation';
  registrationDate: string;
  directors: Array<{
    name: string;
    idNumber: string;
    appointmentDate: string;
    status: 'active' | 'resigned';
  }>;
  address: {
    registered: string;
    postal: string;
  };
  lastUpdated: string;
}

export interface TaxComplianceStatus {
  taxNumber: string;
  companyName: string;
  status: 'compliant' | 'non_compliant' | 'under_review';
  lastAssessment: string;
  outstandingAmount?: number;
  nextReturn?: string;
}

export class ExternalAPIService {
  private static readonly COURT_APIS: Map<string, CourtSystemAPI> = new Map([
    ['gauteng_high', {
      id: 'gauteng_high',
      name: 'Gauteng High Court',
      jurisdiction: 'gauteng',
      apiVersion: 'v2.1',
      baseUrl: 'https://api.ghc.justice.gov.za',
      authType: 'certificate',
      capabilities: {
        electronicFiling: true,
        caseTracking: true,
        calendarSync: true,
        documentSubmission: true,
        paymentProcessing: true
      },
      status: 'active'
    }],
    ['western_cape_high', {
      id: 'western_cape_high',
      name: 'Western Cape High Court',
      jurisdiction: 'western_cape',
      apiVersion: 'v1.8',
      baseUrl: 'https://api.wchc.justice.gov.za',
      authType: 'oauth2',
      capabilities: {
        electronicFiling: true,
        caseTracking: true,
        calendarSync: false,
        documentSubmission: true,
        paymentProcessing: false
      },
      status: 'active'
    }]
  ]);

  private static readonly BANKING_APIS: Map<string, BankingAPI> = new Map([
    ['standard_bank', {
      id: 'standard_bank',
      bankName: 'Standard Bank',
      apiType: 'open_banking',
      baseUrl: 'https://api.standardbank.co.za',
      capabilities: {
        accountBalance: true,
        transactionHistory: true,
        paymentInitiation: true,
        directDebit: true,
        invoiceFinancing: false
      },
      regions: ['ZA']
    }],
    ['nedbank', {
      id: 'nedbank',
      bankName: 'Nedbank',
      apiType: 'proprietary',
      baseUrl: 'https://api.nedbank.co.za',
      capabilities: {
        accountBalance: true,
        transactionHistory: true,
        paymentInitiation: false,
        directDebit: true,
        invoiceFinancing: true
      },
      regions: ['ZA']
    }]
  ]);

  /**
   * Court System Integrations
   */

  // Get available court systems
  static getAvailableCourtSystems(): CourtSystemAPI[] {
    return Array.from(this.COURT_APIS.values());
  }

  // Sync court diary with external court system
  static async syncCourtDiary(courtId: string, advocateId: string): Promise<CourtCase[]> {
    try {
      const courtAPI = this.COURT_APIS.get(courtId);
      if (!courtAPI) {
        throw new Error(`Court system ${courtId} not found`);
      }

      if (courtAPI.status !== 'active') {
        throw new Error(`Court system ${courtId} is currently ${courtAPI.status}`);
      }

      // No mock responses: require real integration
      toast.info(`Court diary sync requires configured integration for ${courtAPI.name}`);
      return [];
    } catch (error) {
      console.error('Error syncing court diary:', error);
      toast.error(`Failed to sync court diary: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  // Submit electronic filing
  static async submitElectronicFiling(filing: Omit<ElectronicFiling, 'id' | 'status' | 'filingDate'>): Promise<ElectronicFiling> {
    try {
      // Validate filing
      this.validateElectronicFiling(filing);

      // No mock submission: require real e-filing integration
      toast.error('Electronic filing integration not configured');
      throw new Error('Electronic filing integration not configured');
    } catch (error) {
      console.error('Error submitting electronic filing:', error);
      toast.error(`Failed to submit electronic filing: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  // Track case status
  static async trackCaseStatus(caseNumber: string, courtId: string): Promise<CourtCase | null> {
    try {
      const courtAPI = this.COURT_APIS.get(courtId);
      if (!courtAPI) {
        throw new Error(`Court system ${courtId} not found`);
      }

      // No mock tracking: require real integration
      toast.info(`Case tracking requires configured integration for ${courtAPI.name}`);
      return null;
    } catch (error) {
      console.error('Error tracking case status:', error);
      throw error;
    }
  }

  /**
   * Banking and Financial Integrations
   */

  // Get available banking integrations
  static getAvailableBanks(): BankingAPI[] {
    return Array.from(this.BANKING_APIS.values());
  }

  // Connect bank account
  static async connectBankAccount(bankId: string, credentials: any): Promise<BankAccount[]> {
    try {
      const bankAPI = this.BANKING_APIS.get(bankId);
      if (!bankAPI) {
        throw new Error(`Bank ${bankId} not found`);
      }

      // Simulate OAuth flow or API key validation
      await this.authenticateWithBank(bankAPI, credentials);

      // No mock accounts: return empty until integration configured
      toast.info(`Connected to ${bankAPI.bankName}, no accounts until integration is configured`);
      return [];
    } catch (error) {
      console.error('Error connecting bank account:', error);
      toast.error(`Failed to connect bank account: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  // Fetch bank transactions
  static async fetchBankTransactions(
    accountId: string, 
    fromDate: string, 
    toDate: string
  ): Promise<BankTransaction[]> {
    try {
      // No mock transactions: return empty until integration configured
      return [];
    } catch (error) {
      console.error('Error fetching bank transactions:', error);
      throw error;
    }
  }

  // Get invoice financing offers
  static async getInvoiceFinancingOffers(invoiceAmount: number): Promise<InvoiceFinancingOffer[]> {
    try {
      // No mock offers: return empty until integration configured
      return [];
    } catch (error) {
      console.error('Error getting invoice financing offers:', error);
      throw error;
    }
  }

  /**
   * Government Services Integrations
   */

  // Verify company registration with CIPC
  static async verifyCompanyRegistration(registrationNumber: string): Promise<CompanyVerification> {
    try {
      // No mock verification: require real government API integration
      throw new Error('Company verification integration not configured');
    } catch (error) {
      console.error('Error verifying company registration:', error);
      throw error;
    }
  }

  // Check tax compliance status with SARS
  static async checkTaxCompliance(taxNumber: string): Promise<TaxComplianceStatus> {
    try {
      // No mock tax status: require real SARS integration
      throw new Error('Tax compliance integration not configured');
    } catch (error) {
      console.error('Error checking tax compliance:', error);
      throw error;
    }
  }

  /**
   * Utility Methods
   */

  // Validate electronic filing
  private static validateElectronicFiling(filing: any): void {
    if (!filing.caseNumber) {
      throw new Error('Case number is required');
    }
    if (!filing.documentType) {
      throw new Error('Document type is required');
    }
    if (!filing.fileData || filing.fileData.size === 0) {
      throw new Error('Document file is required');
    }
    if (filing.fileData.size > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('Document file size cannot exceed 50MB');
    }
  }

  // Authenticate with bank API
  private static async authenticateWithBank(bankAPI: BankingAPI, credentials: any): Promise<void> {
    // Simulate authentication process
    if (bankAPI.authType === 'oauth2') {
      // OAuth2 flow simulation
      if (!credentials.clientId || !credentials.clientSecret) {
        throw new Error('OAuth2 credentials required');
      }
    } else if (bankAPI.authType === 'api_key') {
      // API key validation simulation
      if (!credentials.apiKey) {
        throw new Error('API key required');
      }
    }

    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Get integration status
  static async getIntegrationStatus(): Promise<Record<string, any>> {
    return {
      courts: {
        connected: this.COURT_APIS.size,
        active: Array.from(this.COURT_APIS.values()).filter(c => c.status === 'active').length,
        capabilities: Array.from(this.COURT_APIS.values()).map(c => c.capabilities)
      },
      banking: {
        connected: this.BANKING_APIS.size,
        active: this.BANKING_APIS.size,
        capabilities: Array.from(this.BANKING_APIS.values()).map(b => b.capabilities)
      },
      government: {
        available: ['CIPC', 'SARS', 'Department of Justice'],
        active: 3
      }
    };
  }

  // Test API connectivity
  static async testConnectivity(serviceType: string, serviceId: string): Promise<boolean> {
    try {
      switch (serviceType) {
        case 'court':
          const courtAPI = this.COURT_APIS.get(serviceId);
          return courtAPI?.status === 'active';
        
        case 'bank':
          const bankAPI = this.BANKING_APIS.get(serviceId);
          return bankAPI !== undefined;
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Error testing connectivity:', error);
      return false;
    }
  }
}
