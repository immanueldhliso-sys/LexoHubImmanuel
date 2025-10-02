/**
 * ShareTemplateModal Component
 * 
 * Modal for sharing matter templates with other attorneys.
 * Includes attorney search, permission selection, and sharing confirmation.
 */

import React, { useState, useEffect } from 'react';
import { X, Search, Share2, Users, Mail, Building, AlertCircle, Check } from 'lucide-react';
import type { 
  MatterTemplateWithSharing, 
  ShareTemplateRequest,
  TemplatePermission 
} from '@/types/matter-templates';
import { matterTemplatesService } from '@/services/api/matter-templates.service';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface Advocate {
  id: string;
  full_name: string;
  email: string;
  practice_number: string;
  bar: string;
  specialisations: string[];
}

interface ShareTemplateModalProps {
  template: MatterTemplateWithSharing;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ShareTemplateModal: React.FC<ShareTemplateModalProps> = ({
  template,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdvocate, setSelectedAdvocate] = useState<Advocate | null>(null);
  const [permission, setPermission] = useState<TemplatePermission>('read');
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [filteredAdvocates, setFilteredAdvocates] = useState<Advocate[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAdvocates();
    }
  }, [isOpen]);

  const loadAdvocates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('advocates')
        .select('id, full_name, email, practice_number, bar, specialisations')
        .limit(50);

      if (error) throw error;

      const advocateList: Advocate[] = (data || []).map((adv: any) => ({
        id: adv.id,
        full_name: adv.full_name || 'Unknown',
        email: adv.email || '',
        practice_number: adv.practice_number || '',
        bar: adv.bar || '',
        specialisations: adv.specialisations || []
      }));

      setAdvocates(advocateList);
      setFilteredAdvocates(advocateList);
    } catch (error) {
      console.error('Error loading advocates:', error);
      toast.error('Failed to load advocates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAdvocates(advocates);
    } else {
      const filtered = advocates.filter(advocate =>
        advocate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        advocate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        advocate.practice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        advocate.bar.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAdvocates(filtered);
    }
  }, [searchTerm, advocates]);

  const handleShare = async () => {
    if (!selectedAdvocate) {
      toast.error('Please select an attorney to share with');
      return;
    }

    setSharing(true);
    try {
      const shareData: ShareTemplateRequest = {
        template_id: template.id,
        shared_with_advocate_id: selectedAdvocate.id,
        permissions: permission
      };

      const result = await matterTemplatesService.shareTemplate(shareData);
      
      if (result.error) {
        toast.error(result.error.message || 'Failed to share template');
      } else {
        toast.success(`Template shared with ${selectedAdvocate.full_name}`);
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      toast.error('Failed to share template. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedAdvocate(null);
    setPermission('read');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-mpondo-gold-100 rounded-lg flex items-center justify-center">
              <Share2 className="w-5 h-5 text-mpondo-gold-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Share Template</h2>
              <p className="text-sm text-neutral-600">Share "{template.name}" with another attorney</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Attorney Search */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Search Attorney
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, practice number, or bar..."
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
              />
            </div>
          </div>

          {/* Attorney List */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Select Attorney
            </label>
            <div className="border border-neutral-300 rounded-lg max-h-60 overflow-y-auto">
              {filteredAdvocates.length > 0 ? (
                filteredAdvocates.map((advocate) => (
                  <div
                    key={advocate.id}
                    onClick={() => setSelectedAdvocate(advocate)}
                    className={`p-4 border-b border-neutral-200 last:border-b-0 cursor-pointer transition-colors ${
                      selectedAdvocate?.id === advocate.id
                        ? 'bg-mpondo-gold-50 border-l-4 border-l-mpondo-gold-500'
                        : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-neutral-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-neutral-900">{advocate.full_name}</h3>
                            {selectedAdvocate?.id === advocate.id && (
                              <Check className="w-4 h-4 text-mpondo-gold-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-neutral-600">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span>{advocate.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              <span>{advocate.bar} Bar</span>
                            </div>
                          </div>
                          <div className="text-xs text-neutral-500 mt-1">
                            Practice No: {advocate.practice_number} • {advocate.specialisations.join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-neutral-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                  <p>No attorneys found matching your search</p>
                </div>
              )}
            </div>
          </div>

          {/* Permission Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Permission Level
            </label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                <input
                  type="radio"
                  name="permission"
                  value="read"
                  checked={permission === 'read'}
                  onChange={(e) => setPermission(e.target.value as TemplatePermission)}
                  className="mt-1 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                />
                <div>
                  <div className="font-medium text-neutral-900">Read Only</div>
                  <div className="text-sm text-neutral-600">
                    Attorney can view the template but cannot make copies or modifications
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                <input
                  type="radio"
                  name="permission"
                  value="copy"
                  checked={permission === 'copy'}
                  onChange={(e) => setPermission(e.target.value as TemplatePermission)}
                  className="mt-1 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                />
                <div>
                  <div className="font-medium text-neutral-900">Copy & Use</div>
                  <div className="text-sm text-neutral-600">
                    Attorney can view, copy, and use the template for their own matters
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Template Info */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-neutral-900 mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-neutral-600" />
              Template Information
            </h3>
            <div className="space-y-1 text-sm text-neutral-600">
              <p><span className="font-medium">Name:</span> {template.name}</p>
              <p><span className="font-medium">Category:</span> {template.category}</p>
              {template.description && (
                <p><span className="font-medium">Description:</span> {template.description}</p>
              )}
              <p><span className="font-medium">Usage Count:</span> {template.usage_count} times</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 bg-neutral-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={!selectedAdvocate || sharing}
            className="px-4 py-2 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {sharing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Share Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};