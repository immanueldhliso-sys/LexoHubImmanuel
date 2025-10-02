import React from 'react';
import { X } from 'lucide-react';
import { DocumentUploadWithProcessing } from '../document-processing/DocumentUploadWithProcessing';

interface DocumentProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  matterId: string;
  matterTitle: string;
  onDocumentProcessed?: (documentId: string, extractedData: any) => void;
}

export const DocumentProcessingModal: React.FC<DocumentProcessingModalProps> = ({
  isOpen,
  onClose,
  matterId,
  matterTitle,
  onDocumentProcessed
}) => {
  if (!isOpen) return null;

  const handleComplete = (documentId: string, extractedData: any) => {
    if (onDocumentProcessed) {
      onDocumentProcessed(documentId, extractedData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              Process Document
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              Matter: {matterTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <DocumentUploadWithProcessing
            matterId={matterId}
            onComplete={handleComplete}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};
