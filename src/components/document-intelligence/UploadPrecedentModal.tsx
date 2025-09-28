import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle, Plus } from 'lucide-react';
import { DocumentIntelligenceService } from '../../services/api/document-intelligence.service';
import { toast } from 'react-hot-toast';

interface UploadPrecedentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadPrecedentModal: React.FC<UploadPrecedentModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    precedentType: '',
    category: '',
    subcategory: '',
    bar: '',
    courtLevel: '',
    applicableLaws: '',
    tags: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [useTemplate, setUseTemplate] = useState(false);
  const [templateContent, setTemplateContent] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please provide a title');
      return;
    }

    if (!formData.precedentType) {
      toast.error('Please select a precedent type');
      return;
    }

    if (!formData.category.trim()) {
      toast.error('Please provide a category');
      return;
    }

    if (!file && !useTemplate) {
      toast.error('Please upload a file or provide template content');
      return;
    }

    if (useTemplate && !templateContent.trim()) {
      toast.error('Please provide template content');
      return;
    }

    setUploading(true);
    try {
      // In a real implementation, you would upload the file first
      const mockDocumentId = file ? 'mock-doc-' + Date.now() : undefined;
      
      await DocumentIntelligenceService.uploadPrecedent({
        title: formData.title,
        description: formData.description || undefined,
        precedentType: formData.precedentType,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        documentId: mockDocumentId,
        templateContent: useTemplate ? templateContent : undefined,
        bar: formData.bar as any || undefined,
        courtLevel: formData.courtLevel as any || undefined,
        applicableLaws: formData.applicableLaws ? formData.applicableLaws.split(',').map(s => s.trim()) : undefined,
        tags: formData.tags ? formData.tags.split(',').map(s => s.trim()) : undefined
      });
      
      toast.success('Precedent uploaded successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error uploading precedent:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">Upload Precedent</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Standard Employment Contract Template"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the precedent and its use cases"
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
            />
          </div>

          {/* Type and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Precedent Type *
              </label>
              <select
                value={formData.precedentType}
                onChange={(e) => handleInputChange('precedentType', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                required
              >
                <option value="">Select type...</option>
                <option value="pleadings">Pleadings</option>
                <option value="notices">Notices</option>
                <option value="affidavits">Affidavits</option>
                <option value="heads_of_argument">Heads of Argument</option>
                <option value="opinions">Opinions</option>
                <option value="contracts">Contracts</option>
                <option value="correspondence">Correspondence</option>
                <option value="court_orders">Court Orders</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Category *
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                placeholder="e.g., Employment Law, Commercial Law"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                required
              />
            </div>
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Subcategory
            </label>
            <input
              type="text"
              value={formData.subcategory}
              onChange={(e) => handleInputChange('subcategory', e.target.value)}
              placeholder="e.g., Dismissal, Breach of Contract"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
            />
          </div>

          {/* Bar and Court Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Bar
              </label>
              <select
                value={formData.bar}
                onChange={(e) => handleInputChange('bar', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
              >
                <option value="">Any Bar</option>
                <option value="johannesburg">Johannesburg</option>
                <option value="cape_town">Cape Town</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Court Level
              </label>
              <select
                value={formData.courtLevel}
                onChange={(e) => handleInputChange('courtLevel', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
              >
                <option value="">Any Court</option>
                <option value="magistrate">Magistrate Court</option>
                <option value="high_court">High Court</option>
                <option value="sca">Supreme Court of Appeal</option>
                <option value="constitutional">Constitutional Court</option>
              </select>
            </div>
          </div>

          {/* Content Upload Method */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Content *
            </label>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!useTemplate}
                  onChange={() => setUseTemplate(false)}
                  className="text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                />
                <span className="text-sm text-neutral-700">Upload document file</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={useTemplate}
                  onChange={() => setUseTemplate(true)}
                  className="text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                />
                <span className="text-sm text-neutral-700">Provide template text</span>
              </label>
            </div>

            {!useTemplate ? (
              <div className="mt-3 border-2 border-dashed border-neutral-300 rounded-lg p-4 text-center hover:border-mpondo-gold-400 transition-colors">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  id="file-upload-precedent"
                />
                <label
                  htmlFor="file-upload-precedent"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                  <span className="text-sm font-medium text-neutral-900">
                    {file ? file.name : 'Choose file to upload'}
                  </span>
                  <span className="text-xs text-neutral-500 mt-1">
                    PDF, DOC, DOCX up to 10MB
                  </span>
                </label>
              </div>
            ) : (
              <div className="mt-3">
                <textarea
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  placeholder="Paste your template content here. Use placeholders like [CLIENT_NAME], [DATE], etc. for variable content."
                  rows={8}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500 font-mono text-sm"
                />
              </div>
            )}
          </div>

          {/* Applicable Laws */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Applicable Laws
            </label>
            <input
              type="text"
              value={formData.applicableLaws}
              onChange={(e) => handleInputChange('applicableLaws', e.target.value)}
              placeholder="e.g., Labour Relations Act, Basic Conditions of Employment Act"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
            />
            <p className="text-xs text-neutral-500 mt-1">Separate multiple laws with commas</p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="e.g., employment, dismissal, notice period, severance"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
            />
            <p className="text-xs text-neutral-500 mt-1">Separate tags with commas to help others find your precedent</p>
          </div>

          {/* Community Notice */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">Community Contribution</p>
              <p className="text-blue-700">
                Your precedent will be shared with the advocate community. 
                Ensure it contains no confidential client information before uploading.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || (!file && !useTemplate) || !formData.title || !formData.precedentType || !formData.category}
              className="flex-1 px-4 py-2 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Upload Precedent
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
