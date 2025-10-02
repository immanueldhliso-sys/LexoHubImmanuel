/**
 * TemplateManagementPage Component
 * 
 * Page for managing matter templates with sharing functionality.
 * Allows users to view, edit, delete, and share templates with other attorneys.
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Share2, 
  Edit3, 
  Trash2,
  Users,
  Star,
  Calendar,
  TrendingUp,
  Grid,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { Icon } from '../design-system/components';
import type { 
  MatterTemplateWithSharing, 
  TemplateCategory
} from '@/types/matter-templates';
import { matterTemplatesService } from '@/services/api/matter-templates.service';
import { TemplateCard } from '@/components/matters/templates/TemplateCard';
import { ShareTemplateModal } from '@/components/matters/templates/ShareTemplateModal';
import { toast } from 'react-hot-toast';

export const TemplateManagementPage: React.FC = () => {
  const [templates, setTemplates] = useState<MatterTemplateWithSharing[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MatterTemplateWithSharing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'usage_count' | 'created_at' | 'updated_at'>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSharedOnly, setShowSharedOnly] = useState(false);
  const [showOwnedOnly, setShowOwnedOnly] = useState(false);
  
  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [templateToShare, setTemplateToShare] = useState<MatterTemplateWithSharing | null>(null);

  useEffect(() => {
    loadTemplatesAndCategories();
  }, []);

  useEffect(() => {
    filterAndSortTemplates();
  }, [templates, searchQuery, selectedCategory, sortBy, sortOrder, showSharedOnly, showOwnedOnly]);

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
    } catch (error) {
      toast.error('Failed to load templates');
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
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

    // Apply ownership filters
    if (showSharedOnly) {
      filtered = filtered.filter(template => template.is_shared || !template.is_owner);
    }

    if (showOwnedOnly) {
      filtered = filtered.filter(template => template.is_owner);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      // Handle different data types
      if (sortBy === 'name') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredTemplates(filtered);
  };

  const handleTemplateShare = (template: MatterTemplateWithSharing) => {
    setTemplateToShare(template);
    setShareModalOpen(true);
  };

  const handleTemplateEdit = (template: MatterTemplateWithSharing) => {
    // TODO: Implement template editing
    toast.success(`Edit functionality for "${template.name}" coming soon!`);
  };

  const handleTemplateDelete = async (templateId: string) => {
    try {
      const result = await matterTemplatesService.deleteTemplate(templateId);
      if (result.success) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        toast.success('Template deleted successfully');
      } else {
        toast.error('Failed to delete template');
      }
    } catch (error) {
      toast.error('Failed to delete template');
      console.error('Error deleting template:', error);
    }
  };

  const handleShareSuccess = () => {
    setShareModalOpen(false);
    setTemplateToShare(null);
    // Reload templates to get updated sharing status
    loadTemplatesAndCategories();
  };

  const getTemplateStats = () => {
    const total = templates.length;
    const owned = templates.filter(t => t.is_owner).length;
    const shared = templates.filter(t => t.is_shared).length;
    const received = templates.filter(t => !t.is_owner).length;

    return { total, owned, shared, received };
  };

  const stats = getTemplateStats();

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Template Management</h1>
                <p className="mt-1 text-sm text-neutral-600">
                  Manage and share your matter templates with other attorneys
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                  title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
                >
                  {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
                </button>
                <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-neutral-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{stats.total}</p>
                    <p className="text-xs text-neutral-600">Total Templates</p>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-neutral-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{stats.owned}</p>
                    <p className="text-xs text-neutral-600">Owned</p>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Share2 className="w-5 h-5 text-neutral-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{stats.shared}</p>
                    <p className="text-xs text-neutral-600">Shared</p>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-neutral-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{stats.received}</p>
                    <p className="text-xs text-neutral-600">Received</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>

              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="updated_at-desc">Recently Updated</option>
                <option value="created_at-desc">Recently Created</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="usage_count-desc">Most Used</option>
                <option value="usage_count-asc">Least Used</option>
              </select>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ownership Filters */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Ownership</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={showOwnedOnly}
                        onChange={(e) => setShowOwnedOnly(e.target.checked)}
                        className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-neutral-700">My Templates Only</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={showSharedOnly}
                        onChange={(e) => setShowSharedOnly(e.target.checked)}
                        className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-neutral-700">Shared Templates Only</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Templates Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-neutral-600">Loading templates...</p>
            </div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No templates found</h3>
              <p className="text-neutral-600 mb-4">
                {searchQuery || selectedCategory || showSharedOnly || showOwnedOnly
                  ? 'Try adjusting your search or filters'
                  : 'Create your first template to get started'
                }
              </p>
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </button>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onShare={handleTemplateShare}
                onEdit={handleTemplateEdit}
                onDelete={handleTemplateDelete}
                showActions={true}
                compact={viewMode === 'list'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Share Template Modal */}
      {shareModalOpen && templateToShare && (
        <ShareTemplateModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setTemplateToShare(null);
          }}
          template={templateToShare}
          onSuccess={handleShareSuccess}
        />
      )}
    </div>
  );
};