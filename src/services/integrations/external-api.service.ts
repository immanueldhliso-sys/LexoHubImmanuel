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

      // Simulate API call to court system
      const mockCases: CourtCase[] = [
        {
          caseNumber: 'GHC/2024/12345',
          court: 'Gauteng High Court',
          parties: [
            { name: 'Smith Industries Ltd', role: 'Plaintiff' },
            { name: 'Jones Construction CC', role: 'Defendant' }
          ],
          filingDate: '2024-01-15',
          status: 'active',
          nextHearing: {
            date: '2024-03-15',
            time: '10:00',
            courtroom: 'Court A',
            purpose: 'Motion Hearing'
          },
          documents: [
            {
              id: 'DOC001',
              title: 'Notice of Motion',
              type: 'motion',
              filedDate: '2024-01-15',
              filedBy: 'Smith & Associates'
            }
          ]
        }
      ];

      toast.success(`Synced ${mockCases.length} cases from ${courtAPI.name}`);
      return mockCases;
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

      // Simulate file submission
      const submittedFiling: ElectronicFiling = {
        ...filing,
        id: `EF${Date.now()}`,
        status: 'pending',
        filingDate: new Date().toISOString()
      };

      // Simulate processing delay
      setTimeout(() => {
        submittedFiling.status = 'accepted';
        submittedFiling.confirmationNumber = `CONF${Date.now()}`;
        toast.success(`Electronic filing accepted: ${submittedFiling.confirmationNumber}`);
      }, 3000);

      toast.success('Electronic filing submitted successfully');
      return submittedFiling;
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

      // Simulate API call
      const mockCase: CourtCase = {
        caseNumber,
        court: courtAPI.name,
        parties: [
          { name: 'Tracked Party A', role: 'Applicant' },
          { name: 'Tracked Party B', role: 'Respondent' }
        ],
        filingDate: '2024-01-10',
        status: 'active',
        documents: []
      };

      return mockCase;
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

      // Simulate account retrieval
      const mockAccounts: BankAccount[] = [
        {
          accountId: 'ACC001',
          accountNumber: '****1234',
          accountType: 'business',
          bankName: bankAPI.bankName,
          balance: {
            current: 125000.50,
            available: 120000.50,
            currency: 'ZAR'
          },
          lastUpdated: new Date().toISOString()
        }
      ];

      toast.success(`Connected to ${bankAPI.bankName} - ${mockAccounts.length} accounts found`);
      return mockAccounts;
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
      // Simulate API call to fetch transactions
      const mockTransactions: BankTransaction[] = [
        {
          transactionId: 'TXN001',
          accountId,
          date: '2024-02-10',
          amount: 75000.00,
          currency: 'ZAR',
          type: 'credit',
          description: 'Payment from ABC Corp',
          reference: 'INV-2024-001',
          category: 'Legal Fees',
          balance: 125000.50,
          reconciled: false,
          invoiceId: 'INV-2024-001'
        },
        {
          transactionId: 'TXN002',
          accountId,
          date: '2024-02-08',
          amount: 2500.00,
          currency: 'ZAR',
          type: 'debit',
          description: 'Office Rent',
          reference: 'RENT-FEB24',
          category: 'Operating Expenses',
          balance: 50000.50,
          reconciled: true
        }
      ];

      return mockTransactions;
    } catch (error) {
      console.error('Error fetching bank transactions:', error);
      throw error;
    }
  }

  // Get invoice financing offers
  static async getInvoiceFinancingOffers(invoiceAmount: number): Promise<InvoiceFinancingOffer[]> {
    try {
      // Simulate multiple financing offers
      const mockOffers: InvoiceFinancingOffer[] = [
        {
          offerId: 'OFFER001',
          provider: 'Nedbank Invoice Finance',
          invoiceAmount,
          advanceRate: 80,
          advanceAmount: invoiceAmount * 0.8,
          fee: invoiceAmount * 0.025,
          totalCost: invoiceAmount * 0.025,
          terms: '80% advance, 2.5% fee, 30-day term',
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          approvalStatus: 'approved'
        },
        {
          offerId: 'OFFER002',
          provider: 'Standard Bank Business Finance',
          invoiceAmount,
          advanceRate: 75,
          advanceAmount: invoiceAmount * 0.75,
          fee: invoiceAmount * 0.02,
          totalCost: invoiceAmount * 0.02,
          terms: '75% advance, 2.0% fee, 45-day term',
          validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          approvalStatus: 'pending'
        }
      ];

      return mockOffers;
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
      // Simulate CIPC API call
      const mockVerification: CompanyVerification = {
        registrationNumber,
        companyName: 'Example Company (Pty) Ltd',
        status: 'active',
        registrationDate: '2020-05-15',
        directors: [
          {
            name: 'John Smith',
            idNumber: '****1234',
            appointmentDate: '2020-05-15',
            status: 'active'
          }
        ],
        address: {
          registered: '123 Business Street, Johannesburg, 2000',
          postal: 'PO Box 123, Johannesburg, 2000'
        },
        lastUpdated: new Date().toISOString()
      };

      return mockVerification;
    } catch (error) {
      console.error('Error verifying company registration:', error);
      throw error;
    }
  }

  // Check tax compliance status with SARS
  static async checkTaxCompliance(taxNumber: string): Promise<TaxComplianceStatus> {
    try {
      // Simulate SARS API call
      const mockStatus: TaxComplianceStatus = {
        taxNumber,
        companyName: 'Example Company (Pty) Ltd',
        status: 'compliant',
        lastAssessment: '2024-01-31',
        nextReturn: '2024-02-28'
      };

      return mockStatus;
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
