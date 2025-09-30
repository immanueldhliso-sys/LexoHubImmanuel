/**
 * TemplateCard Component
 * 
 * Displays individual matter template information with actions for selection,
 * editing, sharing, and deletion. Follows LEXO design system principles.
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Share2, 
  Edit3, 
  Trash2, 
  Copy, 
  Star, 
  Users, 
  Calendar,
  TrendingUp,
  MoreVertical,
  Check
} from 'lucide-react';
import type { MatterTemplateWithSharing } from '@/types/matter-templates';
import { matterTemplatesService } from '@/services/api/matter-templates.service';
import { toast } from 'react-hot-toast';

interface TemplateCardProps {
  template: MatterTemplateWithSharing;
  onSelect?: (template: MatterTemplateWithSharing) => void;
  onEdit?: (template: MatterTemplateWithSharing) => void;
  onDelete?: (templateId: string) => void;
  onShare?: (template: MatterTemplateWithSharing) => void;
  isSelected?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  onEdit,
  onDelete,
  onShare,
  isSelected = false,
  showActions = true,
  compact = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleSelect = () => {
    if (onSelect) {
      onSelect(template);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(template);
    }
    setShowMenu(false);
  };

  const handleShare = () => {
    if (onShare) {
      onShare(template);
    }
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the template "${template.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const result = await matterTemplatesService.deleteTemplate(template.id);
      if (result.error) {
        toast.error(result.error.message);
      } else {
        onDelete(template.id);
      }
    } catch (error) {
      toast.error('Failed to delete template');
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  const handleCopyTemplate = async () => {
    setIsLoading(true);
    try {
      const copyData = {
        name: `${template.name} (Copy)`,
        description: template.description,
        category: template.category,
        template_data: template.template_data,
        is_default: false,
        is_shared: false
      };

      const result = await matterTemplatesService.createTemplate(copyData);
      if (result.error) {
        toast.error(result.error.message);
      } else {
        toast.success('Template copied successfully');
      }
    } catch (error) {
      toast.error('Failed to copy template');
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Commercial Litigation': 'bg-red-100 text-red-800 border-red-200',
      'Contract Law': 'bg-blue-100 text-blue-800 border-blue-200',
      'Employment Law': 'bg-green-100 text-green-800 border-green-200',
      'Family Law': 'bg-purple-100 text-purple-800 border-purple-200',
      'Criminal Law': 'bg-orange-100 text-orange-800 border-orange-200',
      'Property Law': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Intellectual Property': 'bg-pink-100 text-pink-800 border-pink-200',
      'Tax Law': 'bg-lime-100 text-lime-800 border-lime-200',
      'Constitutional Law': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Administrative Law': 'bg-amber-100 text-amber-800 border-amber-200',
      'General': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category] || colors['General'];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (compact) {
    return (
      <div
        className={`
          p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md
          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onClick={handleSelect}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {template.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {template.category}
              </p>
            </div>
          </div>
          {isSelected && (
            <Check className="h-5 w-5 text-blue-600" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-white border rounded-lg shadow-sm transition-all duration-200 hover:shadow-md
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}
        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {template.name}
              </h3>
              {template.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {template.description}
                </p>
              )}
            </div>
          </div>
          
          {showActions && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    {onSelect && (
                      <button
                        onClick={handleSelect}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Check className="h-4 w-4" />
                        <span>Select Template</span>
                      </button>
                    )}
                    
                    {template.is_owner && onEdit && (
                      <button
                        onClick={handleEdit}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>Edit Template</span>
                      </button>
                    )}
                    
                    <button
                      onClick={handleCopyTemplate}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy Template</span>
                    </button>
                    
                    {template.is_owner && onShare && (
                      <button
                        onClick={handleShare}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Share2 className="h-4 w-4" />
                        <span>Share Template</span>
                      </button>
                    )}
                    
                    {template.is_owner && onDelete && (
                      <>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={handleDelete}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Template</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category and Status */}
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(template.category)}`}>
            {template.category}
          </span>
          
          <div className="flex items-center space-x-2">
            {template.is_default && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                <Star className="h-3 w-3 mr-1" />
                Default
              </span>
            )}
            
            {template.is_shared && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                <Users className="h-3 w-3 mr-1" />
                Shared
              </span>
            )}
            
            {!template.is_owner && template.shared_by_name && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                From {template.shared_by_name}
              </span>
            )}
          </div>
        </div>

        {/* Template Data Preview */}
        <div className="space-y-2 mb-4">
          {template.template_data.matterType && (
            <div className="text-sm">
              <span className="text-gray-500">Matter Type:</span>
              <span className="ml-2 text-gray-900">{template.template_data.matterType}</span>
            </div>
          )}
          
          {template.template_data.clientType && (
            <div className="text-sm">
              <span className="text-gray-500">Client Type:</span>
              <span className="ml-2 text-gray-900">{template.template_data.clientType}</span>
            </div>
          )}
          
          {template.template_data.feeType && (
            <div className="text-sm">
              <span className="text-gray-500">Fee Type:</span>
              <span className="ml-2 text-gray-900">{template.template_data.feeType}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span>{template.usage_count} uses</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Updated {formatDate(template.updated_at)}</span>
            </div>
          </div>
          
          {onSelect && (
            <button
              onClick={handleSelect}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Use Template
            </button>
          )}
        </div>
      </div>
      
      {/* Click overlay for selection */}
      {onSelect && !showActions && (
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={handleSelect}
        />
      )}
    </div>
  );
};