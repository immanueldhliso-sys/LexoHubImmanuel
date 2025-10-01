/**
 * TemplateCategoryFilter Component
 * 
 * Provides filtering functionality for matter templates by category.
 * Includes search and category selection with visual indicators.
 */

import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import type { TemplateCategory, TemplateSearchFilters } from '@/types/matter-templates';
import { matterTemplatesService } from '@/services/api/matter-templates.service';

interface TemplateCategoryFilterProps {
  filters: TemplateSearchFilters;
  onFiltersChange: (filters: TemplateSearchFilters) => void;
  className?: string;
}

export const TemplateCategoryFilter: React.FC<TemplateCategoryFilterProps> = ({
  filters,
  onFiltersChange,
  className = ''
}) => {
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const result = await matterTemplatesService.getCategories();
      if (result.data) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      search_term: value || undefined
    });
  };

  const handleCategoryChange = (category: string | undefined) => {
    onFiltersChange({
      ...filters,
      category: category
    });
    setShowCategoryDropdown(false);
  };

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    onFiltersChange({
      ...filters,
      sort_by: sortBy as 'name' | 'usage_count' | 'created_at' | 'updated_at',
      sort_order: sortOrder
    });
  };

  const handleToggleFilter = (filterKey: 'is_shared' | 'is_default', value?: boolean) => {
    onFiltersChange({
      ...filters,
      [filterKey]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search_term: undefined,
      category: undefined,
      is_shared: undefined,
      is_default: undefined,
      sort_by: 'updated_at',
      sort_order: 'desc'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Commercial Litigation': 'bg-red-500',
      'Contract Law': 'bg-blue-500',
      'Employment Law': 'bg-green-500',
      'Family Law': 'bg-purple-500',
      'Criminal Law': 'bg-orange-500',
      'Property Law': 'bg-cyan-500',
      'Intellectual Property': 'bg-pink-500',
      'Tax Law': 'bg-lime-500',
      'Constitutional Law': 'bg-indigo-500',
      'Administrative Law': 'bg-amber-500',
      'General': 'bg-gray-500'
    };
    return colors[category] || colors['General'];
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search_term) count++;
    if (filters.category) count++;
    if (filters.is_shared !== undefined) count++;
    if (filters.is_default !== undefined) count++;
    return count;
  };

  const selectedCategory = categories.find(cat => cat.name === filters.category);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={filters.search_term || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {filters.search_term && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="flex items-center justify-between w-full sm:w-48 px-4 py-2 text-left bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <div className="flex items-center space-x-2">
              {selectedCategory && (
                <div className={`w-3 h-3 rounded-full ${getCategoryColor(selectedCategory.name)}`} />
              )}
              <span className="text-sm font-medium text-gray-700">
                {selectedCategory ? selectedCategory.name : 'All Categories'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {showCategoryDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
              <div className="py-1">
                <button
                  onClick={() => handleCategoryChange(undefined)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <span>All Categories</span>
                </button>
                
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.name)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <div className={`w-3 h-3 rounded-full ${getCategoryColor(category.name)}`} />
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
            showAdvancedFilters || getActiveFiltersCount() > 0
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters</span>
          {getActiveFiltersCount() > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {getActiveFiltersCount()}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Advanced Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Template Type Filters */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                Template Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.is_shared === true}
                    onChange={(e) => handleToggleFilter('is_shared', e.target.checked ? true : undefined)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Shared Templates</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.is_default === true}
                    onChange={(e) => handleToggleFilter('is_default', e.target.checked ? true : undefined)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Default Templates</span>
                </label>
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                Sort By
              </label>
              <select
                value={`${filters.sort_by || 'updated_at'}_${filters.sort_order || 'desc'}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('_');
                  handleSortChange(sortBy, sortOrder as 'asc' | 'desc');
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="updated_at_desc">Recently Updated</option>
                <option value="created_at_desc">Recently Created</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="usage_count_desc">Most Used</option>
                <option value="usage_count_asc">Least Used</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search_term && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              Search: "{filters.search_term}"
              <button
                onClick={() => handleSearchChange('')}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {filters.category && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              Category: {filters.category}
              <button
                onClick={() => handleCategoryChange(undefined)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {filters.is_shared === true && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              Shared Templates
              <button
                onClick={() => handleToggleFilter('is_shared', undefined)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {filters.is_default === true && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              Default Templates
              <button
                onClick={() => handleToggleFilter('is_default', undefined)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};