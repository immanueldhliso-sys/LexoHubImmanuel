import React, { useState, useEffect, useCallback } from 'react';
import { X, FileText, Clock, Calculator, AlertCircle, Sparkles, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { InvoiceService } from '@/services/api/invoices.service';
import { TimeEntryService } from '@/services/api/time-entries.service';
import { DocumentIntelligenceService } from '@/services/api/document-intelligence.service';
import { formatRand } from '../../lib/currency';
import type { Matter, TimeEntry, InvoiceGenerationRequest } from '@/types';

interface InvoiceGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  matter?: Matter;
  onInvoiceGenerated?: () => void;
  defaultToProForma?: boolean;
}

export const InvoiceGenerationModal: React.FC<InvoiceGenerationModalProps> = ({
  isOpen,
  onClose,
  matter,
  onInvoiceGenerated,
  defaultToProForma = false
}) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [customNarrative, setCustomNarrative] = useState('');
  const [includeUnbilledTime] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [useAINarrative, setUseAINarrative] = useState(true);
  const [previewNarrative, setPreviewNarrative] = useState('');
  const [showNarrativePreview, setShowNarrativePreview] = useState(false);
  const [isProForma, setIsProForma] = useState(defaultToProForma);
  const [selectedMatter, setSelectedMatter] = useState<Matter | null>(matter || null);
  const [availableMatters, setAvailableMatters] = useState<Matter[]>([]);

  const loadAvailableMatters = useCallback(async () => {
    try {
      setIsLoading(true);
      // Mock matters for now - in real app this would fetch from API
      const mockMatters: Matter[] = [
        {
          id: '1',
          title: 'Smith v Jones Commercial Dispute',
          clientName: 'ABC Corporation',
          instructingAttorney: 'John Smith',
          instructingFirm: 'Smith & Associates',
          wipValue: 125000,
          estimatedFee: 200000,
          actualFee: 0,
          status: 'ACTIVE' as any,
          dateCreated: '2024-01-15T10:00:00Z',
          dateModified: '2024-01-20T14:30:00Z',
          bar: 'johannesburg' as any,
          briefType: 'Commercial Litigation',
          description: 'Contract dispute regarding supply agreement breach',
          conflictCheckCompleted: true,
          conflictCheckDate: '2024-01-14T09:00:00Z',
          riskLevel: 'Medium',
          settlementProbability: 72
        }
      ];
      setAvailableMatters(mockMatters);
    } catch (error) {
      console.error('Error loading matters:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadUnbilledTimeEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!selectedMatter?.id) return;
      
      const response = await TimeEntryService.getTimeEntries({
        matterId: selectedMatter.id,
        billable: true,
        invoiced: false
      });
      setTimeEntries(response.data);
      // Select all entries by default
      setSelectedEntries(response.data.map(e => e.id));
    } catch (error) {
      console.error('Error loading unbilled time entries:', error);
      toast.error('Failed to load unbilled time entries');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMatter?.id]);

  // Load available matters if no matter provided
  useEffect(() => {
    if (isOpen && !matter) {
      loadAvailableMatters();
    }
  }, [isOpen, matter, loadAvailableMatters]);

  // Load unbilled time entries
  useEffect(() => {
    if (isOpen && selectedMatter?.id) {
      loadUnbilledTimeEntries();
    }
  }, [isOpen, selectedMatter?.id, loadUnbilledTimeEntries]);

  const handleEntryToggle = (entryId: string) => {
    setSelectedEntries(prev => 
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handlePreviewNarrative = async () => {
    if (selectedEntries.length === 0) {
      toast.error('Please select time entries to preview narrative');
      return;
    }

    try {
      setShowNarrativePreview(true);
      const result = await DocumentIntelligenceService.generateFeeNarrative({
        matterId: selectedMatter?.id || '',
        timeEntryIds: selectedEntries,
        includeValuePropositions: true
      });
      setPreviewNarrative(result.narrativeText);
    } catch (error) {
      console.error('Error generating narrative preview:', error);
      toast.error('Failed to generate narrative preview');
    }
  };

  const calculateTotals = () => {
    const selectedTimeEntries = timeEntries.filter(entry => 
      selectedEntries.includes(entry.id)
    );
    
    const totalHours = selectedTimeEntries.reduce((sum, entry) => 
      sum + (entry.duration / 60), 0
    );
    
    const totalFees = selectedTimeEntries.reduce((sum, entry) => 
      sum + ((entry.duration / 60) * entry.rate), 0
    );
    
    const disbursements = selectedMatter?.disbursements || 0;
    const vatRate = selectedMatter?.bar === 'johannesburg' ? 0.15 : 0.15; // 15% VAT for both bars
    const vatAmount = totalFees * vatRate;
    const totalAmount = totalFees + vatAmount + disbursements;

    return {
      totalHours,
      totalFees,
      disbursements,
      vatAmount,
      totalAmount
    };
  };

  const handleGenerateInvoice = async () => {
    if (selectedEntries.length === 0) {
      toast.error('Please select at least one time entry');
      return;
    }

    try {
      setIsGenerating(true);
      
      const request: InvoiceGenerationRequest = {
        matterId: selectedMatter?.id || '',
        timeEntryIds: selectedEntries,
        customNarrative: customNarrative.trim() || undefined,
        includeUnbilledTime,
        isProForma: isProForma
      };

      await InvoiceService.generateInvoice(request);
      
      toast.success(isProForma ? 'Pro forma invoice generated successfully' : 'Invoice generated successfully');
      onInvoiceGenerated?.();
      onClose();
      
    } catch (error) {
      console.error('Error generating invoice:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate invoice';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const totals = calculateTotals();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-mpondo-gold/10 rounded-lg">
              <FileText className="w-5 h-5 text-mpondo-gold-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                Generate Invoice
              </h2>
              <p className="text-sm text-neutral-600">
                {selectedMatter?.title} • {selectedMatter?.clientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-full max-h-[calc(90vh-80px)]">
          {/* Time Entries Selection */}
          <div className="flex-1 p-6 overflow-y-auto">
            
            {/* Matter Selection (if no matter provided) */}
            {!matter && (
              <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">Select Matter</h3>
                <div className="space-y-3">
                  {availableMatters.map((availableMatter) => (
                    <label
                      key={availableMatter.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedMatter?.id === availableMatter.id
                          ? 'border-mpondo-gold-500 bg-mpondo-gold-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="matter"
                        checked={selectedMatter?.id === availableMatter.id}
                        onChange={() => setSelectedMatter(availableMatter)}
                        className="text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-neutral-900">{availableMatter.title}</div>
                        <div className="text-sm text-neutral-600">{availableMatter.clientName}</div>
                        <div className="text-xs text-neutral-500">
                          {availableMatter.bar} Bar • WIP: {formatRand(availableMatter.wipValue || 0)}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Unbilled Time Entries
              </h3>
              <p className="text-sm text-neutral-600">
                Select the time entries to include in this invoice
              </p>
            </div>

            {!selectedMatter ? (
              <div className="text-center py-8">
                <p className="text-neutral-600">Please select a matter to view unbilled time entries</p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mpondo-gold-600"></div>
              </div>
            ) : timeEntries.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-600">No unbilled time entries found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {timeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedEntries.includes(entry.id)
                        ? 'border-mpondo-gold-300 bg-mpondo-gold/5'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                    onClick={() => handleEntryToggle(entry.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={selectedEntries.includes(entry.id)}
                            onChange={() => handleEntryToggle(entry.id)}
                            className="rounded border-neutral-300 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                          />
                          <span className="text-sm font-medium text-neutral-900">
                            {format(new Date(entry.date), 'dd MMM yyyy')}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-700 mb-2">
                          {entry.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-neutral-500">
                          <span>{(entry.duration / 60).toFixed(1)} hours</span>
                          <span>R{entry.rate.toFixed(2)}/hour</span>
                          <span className="font-medium text-neutral-700">
                            R{((entry.duration / 60) * entry.rate).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Invoice Type Selection */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-6">
                <label className="block text-sm font-medium text-neutral-700">
                  Invoice Type
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="invoiceType"
                      checked={!isProForma}
                      onChange={() => setIsProForma(false)}
                      className="text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                    />
                    <span className="text-sm text-neutral-700">Final Invoice</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="invoiceType"
                      checked={isProForma}
                      onChange={() => setIsProForma(true)}
                      className="text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                    />
                    <span className="text-sm text-neutral-700">Pro Forma Invoice</span>
                  </label>
                </div>
              </div>
              
              {isProForma && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Pro Forma Invoice:</strong> This will create a preliminary invoice for estimation purposes. 
                    Time entries will not be marked as billed and can be included in a final invoice later.
                  </p>
                </div>
              )}
            </div>

            {/* Fee Narrative Section */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-neutral-700">
                  Fee Narrative
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAINarrative}
                      onChange={(e) => setUseAINarrative(e.target.checked)}
                      className="rounded border-neutral-300 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                    />
                    <span className="text-sm text-neutral-600 flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-mpondo-gold-600" />
                      Use AI Assistant
                    </span>
                  </label>
                  {useAINarrative && selectedEntries.length > 0 && (
                    <button
                      type="button"
                      onClick={handlePreviewNarrative}
                      className="text-sm text-mpondo-gold-600 hover:text-mpondo-gold-700 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                  )}
                </div>
              </div>

              {!useAINarrative && (
                <textarea
                  value={customNarrative}
                  onChange={(e) => setCustomNarrative(e.target.value)}
                  placeholder="Enter custom fee narrative..."
                  rows={4}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent resize-none"
                />
              )}

              {useAINarrative && (
                <div className="p-3 bg-mpondo-gold-50 border border-mpondo-gold-200 rounded-lg">
                  <p className="text-sm text-mpondo-gold-800">
                    AI will generate a professional fee narrative based on your time entries, including:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-mpondo-gold-700">
                    <li>• Categorized work summary</li>
                    <li>• Key activities performed</li>
                    <li>• Value propositions</li>
                    <li>• Professional service standards</li>
                  </ul>
                </div>
              )}

              {/* Narrative Preview Modal */}
              {showNarrativePreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                    <div className="p-6 border-b border-neutral-200">
                      <h3 className="text-lg font-semibold text-neutral-900">Fee Narrative Preview</h3>
                    </div>
                    <div className="p-6 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-neutral-700">
                        {previewNarrative}
                      </pre>
                    </div>
                    <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
                      <button
                        onClick={() => setShowNarrativePreview(false)}
                        className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="lg:w-80 bg-neutral-50 p-6 border-l border-neutral-200">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">
              Invoice Summary
            </h3>

            <div className="space-y-4">
              {/* Bar Information */}
              <div className="p-3 bg-white rounded-lg border border-neutral-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-judicial-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-neutral-700">
                    {selectedMatter?.bar} Bar
                  </span>
                </div>
                <p className="text-xs text-neutral-600">
                  Payment Terms: {selectedMatter?.bar === 'johannesburg' ? '60' : '90'} days
                </p>
              </div>

              {/* Totals */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Hours:</span>
                  <span className="font-medium">{totals.totalHours.toFixed(1)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Professional Fees:</span>
                  <span className="font-medium">R{totals.totalFees.toFixed(2)}</span>
                </div>
                
                {totals.disbursements > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Disbursements:</span>
                    <span className="font-medium">R{totals.disbursements.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">VAT (15%):</span>
                  <span className="font-medium">R{totals.vatAmount.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-neutral-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-neutral-900">Total Amount:</span>
                    <span className="font-bold text-lg text-neutral-900">
                      R{totals.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning for no selection */}
              {selectedEntries.length === 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                      Please select at least one time entry to generate an invoice
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-3">
              <button
                onClick={handleGenerateInvoice}
                disabled={selectedEntries.length === 0 || isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4" />
                    Generate Invoice
                  </>
                )}
              </button>
              
              <button
                onClick={onClose}
                className="w-full px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};