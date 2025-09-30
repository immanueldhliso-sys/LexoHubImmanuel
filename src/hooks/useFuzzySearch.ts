import { useState, useEffect, useMemo } from 'react';
import { SearchResult, SearchCategory } from '../types';
import { FileText, Users, Receipt, Zap, FolderPlus, Mic, Brain } from 'lucide-react';

// Mock data for demonstration
const mockMatters = [
  {
    id: 'matter-1',
    title: 'Smith vs Jones Commercial Dispute',
    description: 'Contract breach litigation - R2.5M claim',
    category: SearchCategory.MATTERS,
    icon: FileText,
    page: 'matters' as const,
    metadata: { client: 'Smith Industries', status: 'active', value: 2500000 }
  },
  {
    id: 'matter-2',
    title: 'ABC Corp Merger Advisory',
    description: 'M&A transaction advisory services',
    category: SearchCategory.MATTERS,
    icon: FileText,
    page: 'matters' as const,
    metadata: { client: 'ABC Corporation', status: 'active', value: 5000000 }
  },
  {
    id: 'matter-3',
    title: 'Property Development Dispute',
    description: 'Construction contract dispute - Sandton',
    category: SearchCategory.MATTERS,
    icon: FileText,
    page: 'matters' as const,
    metadata: { client: 'Sandton Developments', status: 'pending', value: 1200000 }
  }
];

const mockClients = [
  {
    id: 'client-1',
    title: 'Smith Industries (Pty) Ltd',
    description: 'Manufacturing company - 3 active matters',
    category: SearchCategory.CLIENTS,
    icon: Users,
    page: 'matters' as const,
    metadata: { type: 'company', matters: 3, totalValue: 4200000 }
  },
  {
    id: 'client-2',
    title: 'ABC Corporation',
    description: 'Technology company - 1 active matter',
    category: SearchCategory.CLIENTS,
    icon: Users,
    page: 'matters' as const,
    metadata: { type: 'company', matters: 1, totalValue: 5000000 }
  },
  {
    id: 'client-3',
    title: 'John Williams',
    description: 'Individual client - Employment dispute',
    category: SearchCategory.CLIENTS,
    icon: Users,
    page: 'matters' as const,
    metadata: { type: 'individual', matters: 1, totalValue: 150000 }
  }
];

const mockInvoices = [
  {
    id: 'invoice-1',
    title: 'INV-2024-001 - Smith Industries',
    description: 'R45,000.00 - Due 15 Jan 2024',
    category: SearchCategory.INVOICES,
    icon: Receipt,
    page: 'invoices' as const,
    metadata: { amount: 45000, status: 'sent', dueDate: '2024-01-15' }
  },
  {
    id: 'invoice-2',
    title: 'INV-2024-002 - ABC Corporation',
    description: 'R125,000.00 - Paid',
    category: SearchCategory.INVOICES,
    icon: Receipt,
    page: 'invoices' as const,
    metadata: { amount: 125000, status: 'paid', dueDate: '2024-01-10' }
  },
  {
    id: 'invoice-3',
    title: 'INV-2024-003 - Sandton Developments',
    description: 'R32,500.00 - Overdue',
    category: SearchCategory.INVOICES,
    icon: Receipt,
    page: 'invoices' as const,
    metadata: { amount: 32500, status: 'overdue', dueDate: '2023-12-20' }
  }
];

const mockActions = [
  {
    id: 'action-new-matter',
    title: 'Add New Matter',
    description: 'Create a new matter file',
    category: SearchCategory.ACTIONS,
    icon: FolderPlus,
    metadata: { shortcut: 'Ctrl+Shift+M' }
  },
  {
    id: 'action-voice-entry',
    title: 'Start Voice Time Entry',
    description: 'Record time using voice commands',
    category: SearchCategory.ACTIONS,
    icon: Mic,
    metadata: { shortcut: 'Ctrl+Shift+V' }
  },
  {
    id: 'action-analyze-brief',
    title: 'Analyze Brief',
    description: 'AI-powered brief analysis',
    category: SearchCategory.ACTIONS,
    icon: Brain,
    metadata: { shortcut: 'Ctrl+Shift+A' }
  },
  {
    id: 'action-quick-invoice',
    title: 'Quick Invoice',
    description: 'Generate invoice from time entries',
    category: SearchCategory.ACTIONS,
    icon: Receipt,
    metadata: { shortcut: 'Ctrl+Shift+I' }
  }
];

const allSearchData: SearchResult[] = [
  ...mockMatters,
  ...mockClients,
  ...mockInvoices,
  ...mockActions
];

// Simple fuzzy search implementation
const fuzzySearch = (query: string, items: SearchResult[]): SearchResult[] => {
  if (!query.trim()) return [];

  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
  
  return items
    .map(item => {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const descriptionLower = (item.description || '').toLowerCase();
      
      // Exact matches get highest score
      if (titleLower.includes(query.toLowerCase())) {
        score += 100;
      }
      
      if (descriptionLower.includes(query.toLowerCase())) {
        score += 50;
      }
      
      // Partial matches
      searchTerms.forEach(term => {
        if (titleLower.includes(term)) {
          score += 20;
        }
        if (descriptionLower.includes(term)) {
          score += 10;
        }
        
        // Word boundary matches
        const titleWords = titleLower.split(/\s+/);
        const descWords = descriptionLower.split(/\s+/);
        
        titleWords.forEach(word => {
          if (word.startsWith(term)) score += 15;
          if (word === term) score += 25;
        });
        
        descWords.forEach(word => {
          if (word.startsWith(term)) score += 8;
          if (word === term) score += 12;
        });
      });
      
      return { ...item, relevanceScore: score };
    })
    .filter(item => item.relevanceScore! > 0)
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    .slice(0, 20); // Limit results
};

export const useFuzzySearch = (query: string) => {
  const [isSearching, setIsSearching] = useState(false);
  
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    
    setIsSearching(true);
    
    // Simulate search delay for better UX
    const results = fuzzySearch(query, allSearchData);
    
    // Reset loading state after a short delay
    setTimeout(() => setIsSearching(false), 100);
    
    return results;
  }, [query]);
  
  useEffect(() => {
    if (query.trim()) {
      setIsSearching(true);
      const timer = setTimeout(() => setIsSearching(false), 200);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [query]);
  
  return {
    searchResults,
    isSearching
  };
};

export default useFuzzySearch;