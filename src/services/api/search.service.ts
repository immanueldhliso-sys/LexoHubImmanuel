import { supabase } from '@/lib/supabase';

export interface SearchResult {
  id: string;
  type: 'matter' | 'client' | 'invoice' | 'document';
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Record<string, any>;
  relevanceScore?: number;
  icon?: string;
  route?: string;
}

export interface SearchOptions {
  query: string;
  types?: Array<'matter' | 'client' | 'invoice' | 'document'>;
  limit?: number;
  advocateId?: string;
}

export class SearchService {
  static async search(options: SearchOptions): Promise<SearchResult[]> {
    const { query, types = ['matter', 'client', 'invoice', 'document'], limit = 20, advocateId } = options;

    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    try {
      if (types.includes('matter')) {
        const matters = await this.searchMatters(searchTerm, advocateId, limit);
        results.push(...matters);
      }

      if (types.includes('client')) {
        const clients = await this.searchClients(searchTerm, advocateId, limit);
        results.push(...clients);
      }

      if (types.includes('invoice')) {
        const invoices = await this.searchInvoices(searchTerm, advocateId, limit);
        results.push(...invoices);
      }

      if (types.includes('document')) {
        const documents = await this.searchDocuments(searchTerm, advocateId, limit);
        results.push(...documents);
      }

      return this.rankResults(results).slice(0, limit);
    } catch (error) {
      console.error('Error performing search:', error);
      throw new Error('Failed to perform search');
    }
  }

  private static async searchMatters(
    searchTerm: string,
    advocateId?: string,
    limit: number = 10
  ): Promise<SearchResult[]> {
    try {
      let query = supabase
        .from('matters')
        .select('id, title, client_name, matter_type, status, reference_number, created_at');

      if (advocateId) {
        query = query.eq('advocate_id', advocateId);
      }

      const { data, error } = await query
        .or(`title.ilike.%${searchTerm}%,client_name.ilike.%${searchTerm}%,reference_number.ilike.%${searchTerm}%,matter_type.ilike.%${searchTerm}%`)
        .limit(limit);

      if (error) throw error;

      return (data || []).map(matter => ({
        id: matter.id,
        type: 'matter' as const,
        title: matter.title || 'Untitled Matter',
        subtitle: matter.client_name || 'No client',
        description: `${matter.matter_type || 'General'} • ${matter.status || 'Unknown'} • ${matter.reference_number || 'No ref'}`,
        metadata: {
          status: matter.status,
          matterType: matter.matter_type,
          referenceNumber: matter.reference_number,
          createdAt: matter.created_at
        },
        icon: 'Briefcase',
        route: `/matters/${matter.id}`,
        relevanceScore: this.calculateRelevance(searchTerm, [
          matter.title,
          matter.client_name,
          matter.reference_number,
          matter.matter_type
        ])
      }));
    } catch (error) {
      console.error('Error searching matters:', error);
      return [];
    }
  }

  private static async searchClients(
    searchTerm: string,
    advocateId?: string,
    limit: number = 10
  ): Promise<SearchResult[]> {
    try {
      let query = supabase
        .from('matters')
        .select('client_name, client_email, client_phone');

      if (advocateId) {
        query = query.eq('advocate_id', advocateId);
      }

      const { data, error } = await query
        .or(`client_name.ilike.%${searchTerm}%,client_email.ilike.%${searchTerm}%,client_phone.ilike.%${searchTerm}%`)
        .limit(limit);

      if (error) throw error;

      const uniqueClients = new Map<string, any>();
      (data || []).forEach(matter => {
        if (matter.client_name && !uniqueClients.has(matter.client_name)) {
          uniqueClients.set(matter.client_name, matter);
        }
      });

      return Array.from(uniqueClients.values()).map((client, index) => ({
        id: `client-${index}`,
        type: 'client' as const,
        title: client.client_name || 'Unknown Client',
        subtitle: client.client_email || '',
        description: client.client_phone || 'No phone',
        metadata: {
          email: client.client_email,
          phone: client.client_phone
        },
        icon: 'User',
        route: `/clients?search=${encodeURIComponent(client.client_name)}`,
        relevanceScore: this.calculateRelevance(searchTerm, [
          client.client_name,
          client.client_email,
          client.client_phone
        ])
      }));
    } catch (error) {
      console.error('Error searching clients:', error);
      return [];
    }
  }

  private static async searchInvoices(
    searchTerm: string,
    advocateId?: string,
    limit: number = 10
  ): Promise<SearchResult[]> {
    try {
      let query = supabase
        .from('invoices')
        .select('id, invoice_number, matter_id, total_amount, status, dateIssued, matters(title, client_name)');

      if (advocateId) {
        query = query.eq('advocate_id', advocateId);
      }

      const { data, error } = await query
        .ilike('invoice_number', `%${searchTerm}%`)
        .limit(limit);

      if (error) throw error;

      return (data || []).map(invoice => {
        const matter = invoice.matters as any;
        return {
          id: invoice.id,
          type: 'invoice' as const,
          title: invoice.invoice_number || 'Unknown Invoice',
          subtitle: matter?.client_name || 'No client',
          description: `R${invoice.total_amount?.toLocaleString() || '0'} • ${invoice.status || 'Unknown'} • ${matter?.title || 'No matter'}`,
          metadata: {
            amount: invoice.total_amount,
            status: invoice.status,
            dateIssued: invoice.dateIssued,
            matterId: invoice.matter_id
          },
          icon: 'Receipt',
          route: `/invoices/${invoice.id}`,
          relevanceScore: this.calculateRelevance(searchTerm, [
            invoice.invoice_number,
            matter?.client_name,
            matter?.title
          ])
        };
      });
    } catch (error) {
      console.error('Error searching invoices:', error);
      return [];
    }
  }

  private static async searchDocuments(
    searchTerm: string,
    advocateId?: string,
    limit: number = 10
  ): Promise<SearchResult[]> {
    try {
      let query = supabase
        .from('documents')
        .select('id, title, file_name, document_type, matter_id, created_at, matters(title, client_name)');

      if (advocateId) {
        query = query.eq('advocate_id', advocateId);
      }

      const { data, error } = await query
        .or(`title.ilike.%${searchTerm}%,file_name.ilike.%${searchTerm}%,document_type.ilike.%${searchTerm}%`)
        .limit(limit);

      if (error) throw error;

      return (data || []).map(doc => {
        const matter = doc.matters as any;
        return {
          id: doc.id,
          type: 'document' as const,
          title: doc.title || doc.file_name || 'Untitled Document',
          subtitle: matter?.client_name || 'No client',
          description: `${doc.document_type || 'Document'} • ${matter?.title || 'No matter'}`,
          metadata: {
            fileName: doc.file_name,
            documentType: doc.document_type,
            matterId: doc.matter_id,
            createdAt: doc.created_at
          },
          icon: 'FileText',
          route: `/documents/${doc.id}`,
          relevanceScore: this.calculateRelevance(searchTerm, [
            doc.title,
            doc.file_name,
            doc.document_type,
            matter?.title
          ])
        };
      });
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }

  private static calculateRelevance(searchTerm: string, fields: (string | null | undefined)[]): number {
    let score = 0;
    const term = searchTerm.toLowerCase();

    fields.forEach(field => {
      if (!field) return;
      const fieldLower = field.toLowerCase();

      if (fieldLower === term) {
        score += 100;
      } else if (fieldLower.startsWith(term)) {
        score += 50;
      } else if (fieldLower.includes(term)) {
        score += 25;
      } else if (this.fuzzyMatch(term, fieldLower)) {
        score += 10;
      }
    });

    return score;
  }

  private static fuzzyMatch(pattern: string, text: string): boolean {
    let patternIdx = 0;
    let textIdx = 0;

    while (patternIdx < pattern.length && textIdx < text.length) {
      if (pattern[patternIdx] === text[textIdx]) {
        patternIdx++;
      }
      textIdx++;
    }

    return patternIdx === pattern.length;
  }

  private static rankResults(results: SearchResult[]): SearchResult[] {
    return results.sort((a, b) => {
      const scoreA = a.relevanceScore || 0;
      const scoreB = b.relevanceScore || 0;
      return scoreB - scoreA;
    });
  }

  static async quickSearch(query: string, advocateId?: string): Promise<SearchResult[]> {
    return this.search({
      query,
      types: ['matter', 'client', 'invoice'],
      limit: 10,
      advocateId
    });
  }

  static async searchByType(
    query: string,
    type: 'matter' | 'client' | 'invoice' | 'document',
    advocateId?: string,
    limit: number = 20
  ): Promise<SearchResult[]> {
    return this.search({
      query,
      types: [type],
      limit,
      advocateId
    });
  }
}
