import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Mic, Clock, ArrowRight, FileText, Users, Receipt, Zap } from 'lucide-react';
import { SearchResult, SearchCategory, SearchState, KeyboardShortcut } from '../../types';
import { Button } from '../../design-system/components';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useFuzzySearch } from '../../hooks/useFuzzySearch';

interface GlobalCommandBarProps {
  onNavigate: (page: string) => void;
  onAction: (actionId: string) => void;
  className?: string;
}

const GlobalCommandBar: React.FC<GlobalCommandBarProps> = ({
  onNavigate,
  onAction,
  className = ''
}) => {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    isOpen: false,
    isLoading: false,
    results: [],
    selectedIndex: -1,
    recentSearches: [],
    categories: [SearchCategory.MATTERS, SearchCategory.CLIENTS, SearchCategory.INVOICES, SearchCategory.ACTIONS]
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { searchResults, isSearching } = useFuzzySearch(searchState.query);

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrlKey: true,
      description: 'Open command bar',
      action: () => openCommandBar()
    },
    {
      key: 'Escape',
      description: 'Close command bar',
      action: () => closeCommandBar()
    }
  ];

  useKeyboardShortcuts(shortcuts);

  const openCommandBar = useCallback(() => {
    setSearchState(prev => ({ ...prev, isOpen: true }));
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  const closeCommandBar = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      isOpen: false,
      query: '',
      selectedIndex: -1,
      results: []
    }));
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchState(prev => ({
      ...prev,
      query,
      isLoading: query.length > 0,
      results: query.length > 0 ? searchResults : []
    }));
  }, [searchResults]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!searchState.isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSearchState(prev => ({
          ...prev,
          selectedIndex: Math.min(prev.selectedIndex + 1, prev.results.length - 1)
        }));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSearchState(prev => ({
          ...prev,
          selectedIndex: Math.max(prev.selectedIndex - 1, -1)
        }));
        break;
      case 'Enter':
        e.preventDefault();
        if (searchState.selectedIndex >= 0 && searchState.results[searchState.selectedIndex]) {
          handleSelectResult(searchState.results[searchState.selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeCommandBar();
        break;
    }
  }, [searchState.isOpen, searchState.selectedIndex, searchState.results]);

  const handleSelectResult = useCallback((result: SearchResult) => {
    // Add to recent searches
    setSearchState(prev => ({
      ...prev,
      recentSearches: [result.title, ...prev.recentSearches.filter(s => s !== result.title)].slice(0, 5)
    }));

    // Navigate or perform action
    if (result.page) {
      onNavigate(result.page);
    } else if (result.href) {
      window.location.href = result.href;
    } else if (result.category === SearchCategory.ACTIONS) {
      onAction(result.id);
    }

    closeCommandBar();
  }, [onNavigate, onAction]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeCommandBar();
      }
    };

    if (searchState.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [searchState.isOpen]);

  // Update results when search results change
  useEffect(() => {
    if (searchState.query) {
      setSearchState(prev => ({
        ...prev,
        results: searchResults,
        isLoading: isSearching,
        selectedIndex: searchResults.length > 0 ? 0 : -1
      }));
    }
  }, [searchResults, isSearching, searchState.query]);

  const getCategoryIcon = (category: SearchCategory) => {
    switch (category) {
      case SearchCategory.MATTERS:
        return FileText;
      case SearchCategory.CLIENTS:
        return Users;
      case SearchCategory.INVOICES:
        return Receipt;
      case SearchCategory.ACTIONS:
        return Zap;
      case SearchCategory.RECENT:
        return Clock;
      default:
        return Search;
    }
  };

  const getCategoryLabel = (category: SearchCategory) => {
    switch (category) {
      case SearchCategory.MATTERS:
        return 'Matters';
      case SearchCategory.CLIENTS:
        return 'Clients';
      case SearchCategory.INVOICES:
        return 'Invoices';
      case SearchCategory.ACTIONS:
        return 'Actions';
      case SearchCategory.RECENT:
        return 'Recent';
      default:
        return 'Search';
    }
  };

  const groupedResults = searchState.results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<SearchCategory, SearchResult[]>);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-neutral-400" />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search matters, clients, invoices... (Ctrl+K)"
          value={searchState.query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setSearchState(prev => ({ ...prev, isOpen: true }))}
          className="w-full pl-10 pr-12 py-2 bg-white border border-neutral-200 rounded-lg text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-judicial-blue-500 focus:border-transparent transition-all duration-200"
          aria-label="Global search"
          aria-expanded={searchState.isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-6 w-6 text-neutral-400 hover:text-neutral-600"
            aria-label="Voice search"
          >
            <Mic className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Dropdown */}
      {searchState.isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {searchState.query === '' ? (
            /* Empty State - Recent Searches */
            <div className="p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-3">
                <Clock className="h-4 w-4" />
                Recent Searches
              </div>
              {searchState.recentSearches.length > 0 ? (
                <div className="space-y-1">
                  {searchState.recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(search)}
                      className="w-full text-left px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 rounded-md transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">No recent searches</p>
              )}
              
              {/* Quick Actions */}
              <div className="mt-6">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-3">
                  <Zap className="h-4 w-4" />
                  Quick Actions
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => onAction('new-matter')}
                    className="w-full text-left px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 rounded-md transition-colors flex items-center justify-between"
                  >
                    <span>Add New Matter</span>
                    <span className="text-xs text-neutral-400">Ctrl+Shift+M</span>
                  </button>
                  <button
                    onClick={() => onAction('voice-time-entry')}
                    className="w-full text-left px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 rounded-md transition-colors flex items-center justify-between"
                  >
                    <span>Start Voice Time Entry</span>
                    <span className="text-xs text-neutral-400">Ctrl+Shift+V</span>
                  </button>
                  <button
                    onClick={() => onAction('create-invoice')}
                    className="w-full text-left px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 rounded-md transition-colors flex items-center justify-between"
                  >
                    <span>Create Invoice</span>
                    <span className="text-xs text-neutral-400">Ctrl+Shift+I</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Search Results */
            <div className="p-2">
              {searchState.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-judicial-blue-500"></div>
                </div>
              ) : searchState.results.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(groupedResults).map(([category, results]) => (
                    <div key={category}>
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                        {React.createElement(getCategoryIcon(category as SearchCategory), { className: "h-3 w-3" })}
                        {getCategoryLabel(category as SearchCategory)}
                      </div>
                      <div className="space-y-1">
                        {results.map((result, index) => {
                          const globalIndex = searchState.results.indexOf(result);
                          const isSelected = globalIndex === searchState.selectedIndex;
                          return (
                            <button
                              key={result.id}
                              onClick={() => handleSelectResult(result)}
                              className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between group ${
                                isSelected
                                  ? 'bg-judicial-blue-50 text-judicial-blue-900'
                                  : 'hover:bg-neutral-50'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {result.icon && (
                                  <result.icon className={`h-4 w-4 flex-shrink-0 ${
                                    isSelected ? 'text-judicial-blue-600' : 'text-neutral-400'
                                  }`} />
                                )}
                                <div className="min-w-0">
                                  <div className={`text-sm font-medium truncate ${
                                    isSelected ? 'text-judicial-blue-900' : 'text-neutral-900'
                                  }`}>
                                    {result.title}
                                  </div>
                                  {result.description && (
                                    <div className={`text-xs truncate ${
                                      isSelected ? 'text-judicial-blue-700' : 'text-neutral-500'
                                    }`}>
                                      {result.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <ArrowRight className={`h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ${
                                isSelected ? 'text-judicial-blue-600' : 'text-neutral-400'
                              }`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Search className="h-8 w-8 text-neutral-300 mb-2" />
                  <p className="text-sm text-neutral-500">No results found</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Try searching for matters, clients, or invoices
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalCommandBar;