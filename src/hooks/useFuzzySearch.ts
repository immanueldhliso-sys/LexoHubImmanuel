import { useState, useEffect, useCallback } from 'react';
import { SearchResult, SearchCategory } from '../types';
import { FileText, Users, Receipt, FolderPlus, Brain } from 'lucide-react';
import { SearchService } from '@/services/api/search.service';
import { useAuth } from '@/contexts/AuthContext';

const staticActions: SearchResult[] = [
  {
    id: 'action-new-matter',
    title: 'Add New Matter',
    description: 'Create a new matter file',
    category: SearchCategory.ACTIONS,
    icon: FolderPlus,
    metadata: { shortcut: 'Ctrl+Shift+M' }
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

const mapSearchResultToLocal = (result: any): SearchResult => {
  const iconMap: Record<string, any> = {
    'Briefcase': FileText,
    'User': Users,
    'Receipt': Receipt,
    'FileText': FileText
  };

  const categoryMap: Record<string, SearchCategory> = {
    'matter': SearchCategory.MATTERS,
    'client': SearchCategory.CLIENTS,
    'invoice': SearchCategory.INVOICES,
    'document': SearchCategory.DOCUMENTS
  };

  return {
    id: result.id,
    title: result.title,
    description: result.description || result.subtitle || '',
    category: categoryMap[result.type] || SearchCategory.MATTERS,
    icon: iconMap[result.icon || 'FileText'] || FileText,
    page: result.route?.split('/')[1] as any || 'matters',
    metadata: result.metadata,
    relevanceScore: result.relevanceScore
  };
};

export const useFuzzySearch = (query: string) => {
  const { user } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);

      const results = await SearchService.search({
        query: searchQuery,
        types: ['matter', 'client', 'invoice', 'document'],
        limit: 15,
        advocateId: user?.id
      });

      const mappedResults = results.map(mapSearchResultToLocal);
      
      const actionMatches = staticActions.filter(action => 
        action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setSearchResults([...mappedResults, ...actionMatches]);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults(staticActions.filter(action => 
        action.title.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } finally {
      setIsSearching(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    setDebounceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [query, performSearch]);
  
  return {
    searchResults,
    isSearching
  };
};

export default useFuzzySearch;