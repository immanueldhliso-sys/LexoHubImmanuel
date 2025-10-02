/**
 * Data Export Modal
 * "Liberate Your Data" - UI for comprehensive data export functionality
 */

import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input } from '../../design-system/components';
import { Download, FileText, Database, Clock, DollarSign, FileCheck, X } from 'lucide-react';
import { dataExportService, type ExportOptions, type ExportResult } from '../../services/data-export.service';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataExportModal: React.FC<DataExportModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeTimeEntries: true,
    includeInvoices: true,
    includePayments: true,
    includeDocuments: true,
    includeNotes: true
  });
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [lastExportResult, setLastExportResult] = useState<ExportResult | null>(null);

  const handleExport = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    setIsExporting(true);
    
    try {
      const options: ExportOptions = {
        ...exportOptions,
        dateRange: dateRange.start && dateRange.end ? dateRange : undefined
      };

      const result = await dataExportService.exportMatterData(user.id, options);
      setLastExportResult(result);

      if (result.success) {
        toast.success(`Export completed! ${result.recordCount} matters exported.`);
        // Auto-download the file
        dataExportService.downloadExport(result);
      } else {
        toast.error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadAgain = () => {
    if (lastExportResult) {
      dataExportService.downloadExport(lastExportResult);
    }
  };

  const resetModal = () => {
    setLastExportResult(null);
    setDateRange({ start: '', end: '' });
    setExportOptions({
      format: 'csv',
      includeTimeEntries: true,
      includeInvoices: true,
      includePayments: true,
      includeDocuments: true,
      includeNotes: true
    });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalHeader>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-mpondo-gold/10 rounded-lg">
            <Database className="w-6 h-6 text-mpondo-gold-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">
              Liberate Your Data
            </h2>
            <p className="text-sm text-neutral-600">
              Export your complete matter records and related data
            </p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </ModalHeader>

      <ModalBody>
        {lastExportResult?.success ? (
          // Export Success View
          <div className="text-center py-8">
            <div className="p-4 bg-green-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileCheck className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Export Completed Successfully!
            </h3>
            <p className="text-neutral-600 mb-4">
              {lastExportResult.recordCount} matters exported to {lastExportResult.filename}
            </p>
            <div className="bg-neutral-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-neutral-700">Format:</span>
                  <span className="ml-2 text-neutral-600">{exportOptions.format.toUpperCase()}</span>
                </div>
                <div>
                  <span className="font-medium text-neutral-700">Records:</span>
                  <span className="ml-2 text-neutral-600">{lastExportResult.recordCount}</span>
                </div>
                <div>
                  <span className="font-medium text-neutral-700">Exported:</span>
                  <span className="ml-2 text-neutral-600">
                    {new Date(lastExportResult.timestamp).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-neutral-700">File:</span>
                  <span className="ml-2 text-neutral-600">{lastExportResult.filename}</span>
                </div>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={handleDownloadAgain}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Again</span>
            </Button>
          </div>
        ) : (
          // Export Configuration View
          <div className="space-y-6">
            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'csv', label: 'CSV', icon: FileText, description: 'Standard CSV format' },
                  { value: 'excel-csv', label: 'Excel CSV', icon: FileText, description: 'Excel-compatible CSV' },
                  { value: 'json', label: 'JSON', icon: Database, description: 'Structured JSON data' }
                ].map((format) => (
                  <button
                    key={format.value}
                    onClick={() => setExportOptions(prev => ({ ...prev, format: format.value as any }))}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      exportOptions.format === format.value
                        ? 'border-mpondo-gold bg-mpondo-gold/5'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <format.icon className="w-4 h-4" />
                      <span className="font-medium text-sm">{format.label}</span>
                    </div>
                    <p className="text-xs text-neutral-600">{format.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Date Range (Optional)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-600 mb-1">From Date</label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    placeholder="Start date"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-600 mb-1">To Date</label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    placeholder="End date"
                  />
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Leave empty to export all matters
              </p>
            </div>

            {/* Data Inclusion Options */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Include Related Data
              </label>
              <div className="space-y-3">
                {[
                  { key: 'includeTimeEntries', label: 'Time Entries', icon: Clock, description: 'All recorded time entries' },
                  { key: 'includeInvoices', label: 'Invoices', icon: DollarSign, description: 'Invoice records and details' },
                  { key: 'includePayments', label: 'Payments', icon: DollarSign, description: 'Payment history and records' },
                  { key: 'includeDocuments', label: 'Documents', icon: FileText, description: 'Document metadata and references' },
                  { key: 'includeNotes', label: 'Notes', icon: FileText, description: 'Matter notes and comments' }
                ].map((option) => (
                  <label key={option.key} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportOptions[option.key as keyof ExportOptions] as boolean}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        [option.key]: e.target.checked
                      }))}
                      className="w-4 h-4 text-mpondo-gold border-neutral-300 rounded focus:ring-mpondo-gold"
                    />
                    <div className="flex items-center space-x-2">
                      <option.icon className="w-4 h-4 text-neutral-500" />
                      <div>
                        <span className="text-sm font-medium text-neutral-700">{option.label}</span>
                        <p className="text-xs text-neutral-500">{option.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Export Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Database className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    About Data Liberation
                  </h4>
                  <p className="text-sm text-blue-700">
                    This export includes all your matter data in a portable format. 
                    You own your data and can use it with any other system. 
                    The export is comprehensive and includes all related records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <div className="flex justify-between w-full">
          <div>
            {lastExportResult?.success && (
              <Button
                variant="outline"
                onClick={resetModal}
                disabled={isExporting}
              >
                New Export
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isExporting}
            >
              {lastExportResult?.success ? 'Close' : 'Cancel'}
            </Button>
            
            {!lastExportResult?.success && (
              <Button
                variant="primary"
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center space-x-2"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export Data</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default DataExportModal;