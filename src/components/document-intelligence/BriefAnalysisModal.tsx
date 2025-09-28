import React, { useState } from 'react';
import { X, Upload, Brain, FileText, AlertCircle } from 'lucide-react';
import { DocumentIntelligenceService } from '../../services/api/document-intelligence.service';
import { toast } from 'react-hot-toast';

interface BriefAnalysisModalProps {
  onClose: () => void;
}

export const BriefAnalysisModal: React.FC<BriefAnalysisModalProps> = ({ onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [analysisType, setAnalysisType] = useState<'brief' | 'contract' | 'opinion' | 'pleading' | 'general'>('brief');
  const [priority, setPriority] = useState(5);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error('File size must be less than 50MB');
        return;
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(selectedFile.type)) {
        toast.error('Only PDF and Word documents are supported');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select a file to analyze');
      return;
    }

    setUploading(true);
    try {
      // In a real implementation, you would upload the file first
      // For now, we'll simulate with a mock document ID
      const mockDocumentId = 'mock-doc-' + Date.now();
      
      setAnalyzing(true);
      await DocumentIntelligenceService.analyzeDocument({
        documentId: mockDocumentId,
        analysisType,
        priority
      });
      
      toast.success('Document analysis started successfully!');
      onClose();
    } catch (error) {
      console.error('Error starting analysis:', error);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">AI Document Analysis</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Document to Analyze
            </label>
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-mpondo-gold-400 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                <span className="text-sm font-medium text-neutral-900">
                  {file ? file.name : 'Choose file to upload'}
                </span>
                <span className="text-xs text-neutral-500 mt-1">
                  PDF, DOC, DOCX up to 50MB
                </span>
              </label>
            </div>
          </div>

          {/* Analysis Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Document Type
            </label>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value as any)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
            >
              <option value="brief">Brief/Instructions</option>
              <option value="contract">Contract/Agreement</option>
              <option value="opinion">Legal Opinion</option>
              <option value="pleading">Court Pleading</option>
              <option value="general">General Document</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Analysis Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
            >
              <option value={10}>Urgent (High Priority)</option>
              <option value={7}>Important</option>
              <option value={5}>Normal</option>
              <option value={3}>Low Priority</option>
            </select>
          </div>

          {/* Analysis Features */}
          <div className="bg-neutral-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-neutral-900 mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Analysis Features
            </h3>
            <div className="space-y-2 text-sm text-neutral-600">
              {analysisType === 'brief' && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-mpondo-gold-500 rounded-full"></div>
                    Extract parties, opposing counsel, and key contacts
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-mpondo-gold-500 rounded-full"></div>
                    Identify deadlines and important dates
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-mpondo-gold-500 rounded-full"></div>
                    Analyze matter complexity and value
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-mpondo-gold-500 rounded-full"></div>
                    Generate matter summary and key issues
                  </div>
                </>
              )}
              {analysisType === 'contract' && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-mpondo-gold-500 rounded-full"></div>
                    Extract contract terms and obligations
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-mpondo-gold-500 rounded-full"></div>
                    Identify key dates and deadlines
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-mpondo-gold-500 rounded-full"></div>
                    Assess potential risks and issues
                  </div>
                </>
              )}
              {analysisType === 'general' && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-mpondo-gold-500 rounded-full"></div>
                    Extract key entities and information
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-mpondo-gold-500 rounded-full"></div>
                    Generate document summary
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-mpondo-gold-500 rounded-full"></div>
                    Identify important dates and deadlines
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Data Privacy Notice</p>
              <p className="text-yellow-700">
                Documents are processed securely and are not stored permanently. 
                Analysis results are saved to your account only.
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
              disabled={!file || uploading || analyzing}
              className="flex-1 px-4 py-2 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : analyzing ? (
                <>
                  <Brain className="w-4 h-4" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Start Analysis
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
