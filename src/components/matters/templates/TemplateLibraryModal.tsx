/**
 * TemplateLibraryModal Component
 * 
 * Modal for browsing and selecting matter templates.
 * Includes search, filtering, and template preview functionality.
 */

import React, { useState, useEffect } from 'react';
import { X, Search, Filter, Star, Users, Clock, FileText, Plus } from 'lucide-react';
import type { 
  MatterTemplate, 
  TemplateCategory, 
  MatterTemplateData 
} from '@/types/matter-templates';

interface TemplateWithSuggestion extends MatterTemplate {
  isSuggested?: boolean;
}
import { matterTemplatesService } from '@/services/api/matter-templates.service';
import { TemplateCard } from './TemplateCard';
import { TemplateCategoryFilter } from './TemplateCategoryFilter';
import { toast } from 'react-hot-toast';

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect: (templateData: MatterTemplateData) => void;
  currentMatterData?: Partial<MatterTemplateData>;
}

export const TemplateLibraryModal: React.FC<TemplateLibraryModalProps> = ({
  isOpen,
  onClose,
  onTemplateSelect,
  currentMatterData
}) => {
  const [templates, setTemplates] = useState<MatterTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MatterTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'name'>('recent');
  const [showSharedOnly, setShowSharedOnly] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MatterTemplate | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplatesAndCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    filterAndSortTemplates();
  }, [templates, searchQuery, selectedCategory, sortBy, showSharedOnly]);

  const loadTemplatesAndCategories = async () => {
    setIsLoading(true);
    try {
      const [templatesResult, categoriesResult] = await Promise.all([
        matterTemplatesService.getUserTemplates(),
        matterTemplatesService.getCategories()
      ]);

      if (templatesResult.data) {
        setTemplates(templatesResult.data);
      }

      if (categoriesResult.data) {
        setCategories(categoriesResult.data);
      }

      // Load suggested templates if we have current matter data
      if (currentMatterData) {
        loadSuggestedTemplates();
      }
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuggestedTemplates = async () => {
    if (!currentMatterData) return;

    try {
      const result = await matterTemplatesService.getSuggestedTemplates(currentMatterData);
      if (result.data && result.data.length > 0) {
        // Mark suggested templates
        setTemplates(prev => prev.map(template => ({
          ...template,
          isSuggested: result.data!.some(suggested => suggested.id === template.id)
        })));
      }
    } catch (error) {
      console.error('Failed to load suggested templates:', error);
    }
  };

  const filterAndSortTemplates = () => {
    let filtered = [...templates];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Apply shared filter
    if (showSharedOnly) {
      filtered = filtered.filter(template => template.is_shared);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.usage_count || 0) - (a.usage_count || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    // Put suggested templates first
    const suggested = filtered.filter(t => (t as TemplateWithSuggestion).isSuggested);
    const others = filtered.filter(t => !(t as TemplateWithSuggestion).isSuggested);
    
    setFilteredTemplates([...suggested, ...others]);
  };

  const handleTemplateSelect = async (template: MatterTemplate) => {
    try {
      // Track template usage
      await matterTemplatesService.incrementUsage(template.id);
      
      // Apply template data
      onTemplateSelect(template.template_data);
      onClose();
      
      toast.success(`Template "${template.name}" applied successfully`);
    } catch (error) {
      toast.error('Failed to apply template');
    }
  };

  const handleTemplatePreview = (template: MatterTemplate) => {
    setSelectedTemplate(template);
  };

  const closePreview = () => {
    setSelectedTemplate(null);
  };

  const getTemplateStats = () => {
    const total = templates.length;
    const shared = templates.filter(t => t.is_shared).length;
    const personal = total - shared;
    const suggested = templates.filter(t => (t as TemplateWithSuggestion).isSuggested).length;

    return { total, shared, personal, suggested };
  };

  if (!isOpen) return null;

  const stats = getTemplateStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Template Library</h2>
              <p className="text-sm text-gray-600">
                Choose from {stats.total} templates ({stats.suggested} suggested)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg flex items-center space-x-2 transition-colors ${
                showFilters 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>

          {showFilters && (
            <TemplateCategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
              showSharedOnly={showSharedOnly}
              onSharedOnlyChange={setShowSharedOnly}
            />
          )}

          {/* Quick Stats */}
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span>{stats.total} Total</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{stats.shared} Shared</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4" />
              <span>{stats.suggested} Suggested</span>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading templates...</p>
              </div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || selectedCategory 
                    ? 'Try adjusting your search or filters'
                    : 'Create your first template to get started'
                  }
                </p>
                {!searchQuery && !selectedCategory && (
                  <button
                    onClick={onClose}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => handleTemplateSelect(template)}
                  onPreview={() => handleTemplatePreview(template)}
                  isHighlighted={(template as TemplateWithSuggestion).isSuggested}
                />
              ))}
            </div>
          )}
        </div>

        {/* Template Preview Modal */}
        {selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{selectedTemplate.name}</h3>
                <button
                  onClick={closePreview}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-600">
                      {selectedTemplate.description || 'No description provided'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Template Data</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                        {JSON.stringify(selectedTemplate.template_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Category: {selectedTemplate.category}</span>
                      <span>Used: {selectedTemplate.usage_count || 0} times</span>
                    </div>
                    <button
                      onClick={() => handleTemplateSelect(selectedTemplate)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}