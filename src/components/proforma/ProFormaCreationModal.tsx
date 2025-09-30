import React, { useState } from 'react';
import { X, FileText, Calendar, DollarSign } from 'lucide-react';
import { Button, Input, Modal, ModalBody, ModalFooter } from '../../design-system/components';
import type { ProFormaGenerationRequest } from '../../types';

interface ProFormaCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProFormaGenerationRequest) => Promise<void>;
  isLoading?: boolean;
}

export const ProFormaCreationModal: React.FC<ProFormaCreationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ProFormaGenerationRequest>({
    matter_id: '',
    fee_narrative: '',
    total_amount: 0,
    valid_until: '',
    quote_date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        matter_id: '',
        fee_narrative: '',
        total_amount: 0,
        valid_until: '',
        quote_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error submitting pro forma:', error);
    }
  };

  const handleInputChange = (field: keyof ProFormaGenerationRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalBody>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-judicial-blue-600" />
            <h2 className="text-xl font-semibold text-neutral-900">Create New Pro Forma</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Matter ID
            </label>
            <Input
              type="text"
              value={formData.matter_id}
              onChange={(e) => handleInputChange('matter_id', e.target.value)}
              placeholder="Enter matter ID"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Fee Narrative
            </label>
            <textarea
              value={formData.fee_narrative}
              onChange={(e) => handleInputChange('fee_narrative', e.target.value)}
              placeholder="Describe the services and fees..."
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-judicial-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Total Amount (R)
              </label>
              <Input
                type="number"
                value={formData.total_amount}
                onChange={(e) => handleInputChange('total_amount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Valid Until
              </label>
              <Input
                type="date"
                value={formData.valid_until}
                onChange={(e) => handleInputChange('valid_until', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Pro Forma Date
            </label>
            <Input
              type="date"
              value={formData.quote_date}
              onChange={(e) => handleInputChange('quote_date', e.target.value)}
              required
            />
          </div>
        </form>
      </ModalBody>

      <ModalFooter>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Pro Forma'}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};