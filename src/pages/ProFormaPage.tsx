import React, { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Calendar, Building, Search, Filter, RefreshCw, Send, CheckCircle, Clock, AlertCircle, Download, Printer } from 'lucide-react';
import { Button, Card, CardHeader, CardContent, Input, Modal, ModalBody, ModalFooter } from '../design-system/components';
import { LoadingSpinner } from '../components/design-system/components/LoadingSpinner';
import { ProFormaCreationModal } from '../components/proforma/ProFormaCreationModal';
import { proformaService } from '../services/api/proforma.service';
import { InvoicePDFService } from '../services/pdf/invoice-pdf.service';
import { AdvocateService } from '../services/api/advocate.service';
import { MatterService } from '../services/api/matters.service';
import { toast } from 'react-hot-toast';
import { formatRand } from '../lib/currency';
import type { 
  ProForma, 
  ProFormaFilters, 
  ProFormaSummaryStats,
  Matter,
  Advocate,
  ProFormaGenerationRequest,
  ProFormaStatus 
} from '../types';

interface ProFormaPageState {
  // Data
  proformas: ProForma[];
  filteredProFormas: ProForma[];
  matters: Matter[];
  advocate: Advocate | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Modal states
  showCreationModal: boolean;
  showDetailsModal: boolean;
  showConversionModal: boolean;
  showDeleteModal: boolean;
  selectedProFormaId: string | null;
  
  // Filters
  filters: ProFormaFilters;
  
  // Summary stats
  summaryStats: ProFormaSummaryStats;

  // PDF generation states
  pdfGenerating: Record<string, boolean>;
}

const ProFormaPage: React.FC = () => {
  const [state, setState] = useState<ProFormaPageState>({
    proformas: [],
    filteredProFormas: [],
    matters: [],
    isLoading: true,
    error: null,
    showCreationModal: false,
    showDetailsModal: false,
    showConversionModal: false,
    showDeleteModal: false,
    selectedProFormaId: null,
    filters: {
      search: '',
      status: 'all',
      dateRange: null
    },
    summaryStats: {
      totalCount: 0,
      estimatedValue: 0,
      currentMonthCount: 0,
      conversionRate: 0,
      averageValue: 0,
      pendingAcceptance: 0
    },
    pdfGenerating: {}
  });

  // Apply filters to pro formas
  const applyFilters = useCallback((proformas: ProForma[], filters: ProFormaFilters): ProForma[] => {
    return proformas.filter(proforma => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matter = state.matters.find(m => m.id === proforma.matter_id);
        const searchableText = [
          proforma.quote_number,
          proforma.fee_narrative,
          matter?.title,
          matter?.client_name,
          matter?.reference_number
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'all') {
        if (proforma.status !== filters.status) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange) {
        const proformaDate = new Date(proforma.quote_date);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        
        if (proformaDate < startDate || proformaDate > endDate) {
          return false;
        }
      }

      return true;
    });
  }, [state.matters]);

  // PDF Generation Functions
  const handleDownloadPDF = async (proforma: ProForma) => {
    const matter = state.matters.find(m => m.id === proforma.matter_id);
    
    if (!matter) {
      toast.error('Matter information not found for this pro forma');
      return;
    }

    if (!state.advocate) {
      toast.error('Advocate information not found');
      return;
    }

    setState(prev => ({
      ...prev,
      pdfGenerating: { ...prev.pdfGenerating, [proforma.id]: true }
    }));

    try {
      // Use static method with correct parameters
      const result = await InvoicePDFService.generateProFormaPDF(
        proforma, 
        matter, 
        state.advocate,
        { autoDownload: false }
      );

      if (result.success && result.blob) {
        // Use the static downloadPDF method
        const filename = `proforma-${proforma.invoice_number || proforma.id}.pdf`;
        InvoicePDFService.downloadPDF(result.blob, filename);
        toast.success('Pro forma PDF downloaded successfully');
      } else {
        throw new Error(result.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setState(prev => ({
        ...prev,
        pdfGenerating: { ...prev.pdfGenerating, [proforma.id]: false }
      }));
    }
  };

  const handlePrintPDF = async (proforma: ProForma) => {
    const matter = state.matters.find(m => m.id === proforma.matter_id);
    
    if (!matter) {
      toast.error('Matter information not found for this pro forma');
      return;
    }

    if (!state.advocate) {
      toast.error('Advocate information not found');
      return;
    }

    setState(prev => ({
      ...prev,
      pdfGenerating: { ...prev.pdfGenerating, [`${proforma.id}_print`]: true }
    }));

    try {
      // Use static method with correct parameters
      const result = await InvoicePDFService.generateProFormaPDF(
        proforma, 
        matter, 
        state.advocate,
        { autoDownload: false }
      );

      if (result.success && result.blob) {
        // Create a temporary URL for the PDF
        const pdfUrl = URL.createObjectURL(result.blob);
        
        // Open in new window for printing
        const printWindow = window.open(pdfUrl, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
            // Clean up the URL after a delay
            setTimeout(() => {
              URL.revokeObjectURL(pdfUrl);
            }, 1000);
          };
        } else {
          toast.error('Please allow popups to print the PDF');
          URL.revokeObjectURL(pdfUrl);
        }
        
        toast.success('PDF opened for printing');
      } else {
        throw new Error(result.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF for printing:', error);
      toast.error('Failed to generate PDF for printing. Please try again.');
    } finally {
      setState(prev => ({
        ...prev,
        pdfGenerating: { ...prev.pdfGenerating, [`${proforma.id}_print`]: false }
      }));
    }
  };

  // Calculate summary statistics
  const calculateSummaryStats = useCallback((proformas: ProForma[]): ProFormaSummaryStats => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthProFormas = proformas.filter(proforma => {
      const proformaDate = new Date(proforma.quote_date);
      return proformaDate.getMonth() === currentMonth && proformaDate.getFullYear() === currentYear;
    });

    const convertedProFormas = proformas.filter(proforma => proforma.status === 'converted_to_invoice');
    const pendingProFormas = proformas.filter(proforma => proforma.status === 'awaiting_acceptance');

    return {
      totalCount: proformas.length,
      estimatedValue: proformas.reduce((sum, proforma) => sum + proforma.total_amount, 0),
      currentMonthCount: currentMonthProFormas.length,
      conversionRate: proformas.length > 0 ? (convertedProFormas.length / proformas.length) * 100 : 0,
      averageValue: proformas.length > 0 ? proformas.reduce((sum, proforma) => sum + proforma.total_amount, 0) / proformas.length : 0,
      pendingAcceptance: pendingProFormas.length
    };
  }, []);

  // Load pro formas and matters
  const loadData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Load pro formas, matters, and advocate data from API
      const [proformasData, mattersResponse, advocateData] = await Promise.all([
        proformaService.getProFormas(),
        MatterService.getMatters({ page: 1, pageSize: 100 }),
        AdvocateService.getCurrentAdvocate()
      ]);

      setState(prev => ({
        ...prev,
        proformas: proformasData,
        matters: mattersResponse?.data || [],
        advocate: advocateData,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error loading pro formas:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch pro formas'
      }));
    }
  }, []);

  // Handle pro forma creation
  const handleCreateProForma = useCallback(async (data: ProFormaGenerationRequest) => {
    try {
      setState(prev => ({ ...prev, showCreationModal: false }));
      
      const newProForma = await proformaService.generateProForma(data);
      
      toast.success('Pro Forma created successfully');
      
      // Reload data to include the new pro forma
      await loadData();
    } catch (error) {
      console.error('Error creating pro forma:', error);
      toast.error('Failed to create pro forma');
    }
  }, [loadData]);

  // Handle pro forma conversion to invoice
  const handleConvertToInvoice = useCallback(async (proformaId: string) => {
    try {
      setState(prev => ({ ...prev, showConversionModal: false }));
      
      const invoice = await proformaService.convertToInvoice(proformaId);
      
      toast.success('Pro Forma converted to invoice successfully');
      
      setState(prev => ({
        ...prev,
        selectedProFormaId: null,
        showConversionModal: false
      }));
      
      // Reload data to reflect the status change
      await loadData();
    } catch (error) {
      console.error('Error converting pro forma:', error);
      toast.error('Failed to convert pro forma to invoice');
    }
  }, [loadData]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<ProFormaFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update filtered data and summary stats when proformas or filters change
  useEffect(() => {
    if (state.proformas.length > 0) {
      const filteredProFormas = applyFilters(state.proformas, state.filters);
      const summaryStats = calculateSummaryStats(state.proformas);
      
      setState(prev => ({
        ...prev,
        filteredProFormas,
        summaryStats
      }));
    }
  }, [state.proformas, state.filters, applyFilters, calculateSummaryStats]);

  const getStatusBadgeColor = (status: ProFormaStatus): string => {
    switch (status) {
      case 'draft':
        return 'bg-neutral-100 text-neutral-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'awaiting_acceptance':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-neutral-100 text-neutral-600';
      case 'converted_to_invoice':
        return 'bg-mpondo-gold-100 text-mpondo-gold-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getStatusIcon = (status: ProFormaStatus) => {
    switch (status) {
      case 'awaiting_acceptance':
        return <Clock className="h-3 w-3" />;
      case 'accepted':
        return <CheckCircle className="h-3 w-3" />;
      case 'declined':
        return <AlertCircle className="h-3 w-3" />;
      case 'converted_to_invoice':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Loading state
  if (state.isLoading && state.proformas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Pro Forma Management</h1>
          <p className="text-neutral-600 mt-1">
            Create and manage client pro formas with seamless invoice conversion
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setState(prev => ({ ...prev, showCreationModal: true }))}
          className="bg-judicial-blue-600 hover:bg-judicial-blue-700"
          data-testid="create-proforma-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Pro Forma
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Pro Formas</p>
                <p className="text-2xl font-bold text-neutral-900">{state.summaryStats.totalCount}</p>
              </div>
              <FileText className="h-8 w-8 text-judicial-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Estimated Value</p>
                <p className="text-2xl font-bold text-neutral-900">{formatRand(state.summaryStats.estimatedValue)}</p>
              </div>
              <Building className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">This Month</p>
                <p className="text-2xl font-bold text-neutral-900">{state.summaryStats.currentMonthCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-neutral-900">{state.summaryStats.conversionRate.toFixed(1)}%</p>
              </div>
              <RefreshCw className="h-8 w-8 text-mpondo-gold-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Average Value</p>
                <p className="text-2xl font-bold text-neutral-900">{formatRand(state.summaryStats.averageValue)}</p>
              </div>
              <Building className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Pending</p>
                <p className="text-2xl font-bold text-neutral-900">{state.summaryStats.pendingAcceptance}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search pro formas, matters, or clients..."
                  value={state.filters.search}
                  onChange={(e) => handleFilterChange({ search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={state.filters.status}
                onChange={(e) => handleFilterChange({ status: e.target.value as any })}
                className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-judicial-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="awaiting_acceptance">Awaiting Acceptance</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="expired">Expired</option>
                <option value="converted_to_invoice">Converted</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pro Formas List */}
      {state.filteredProFormas.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No pro formas found</h3>
            <p className="text-neutral-600 mb-4">
              {state.filters.search || state.filters.status !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first pro forma to get started with the simplified workflow.'
              }
            </p>
            <Button
              variant="primary"
              onClick={() => setState(prev => ({ ...prev, showCreationModal: true }))}
              className="bg-judicial-blue-600 hover:bg-judicial-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Pro Forma
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {state.filteredProFormas.map((proforma) => {
            const matter = state.matters.find(m => m.id === proforma.matter_id);
            
            return (
              <Card key={proforma.id} variant="default" hoverable>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900">
                          {proforma.quote_number}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(proforma.status)}`}>
                          {getStatusIcon(proforma.status)}
                          {proforma.status === 'awaiting_acceptance' ? 'Awaiting Acceptance' :
                           proforma.status === 'converted_to_invoice' ? 'Converted' :
                           proforma.status.charAt(0).toUpperCase() + proforma.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-neutral-600">Matter:</span>
                          <p className="font-medium text-neutral-900">{matter?.title || 'Unknown Matter'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-neutral-600">Client:</span>
                          <p className="font-medium text-neutral-900">{matter?.client_name || 'Unknown Client'}</p>
                        </div>
                        <div>
                          <span className="text-neutral-600">Pro Forma Date:</span>
                          <p className="font-medium text-neutral-900">
                            {new Date(proforma.quote_date).toLocaleDateString('en-ZA')}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-neutral-600">Valid Until:</span>
                          <p className="font-medium text-neutral-900">
                            {new Date(proforma.valid_until).toLocaleDateString('en-ZA')}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-neutral-600">Amount:</span>
                          <p className="font-bold text-lg text-neutral-900">
                            {formatRand(proforma.total_amount)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => setState(prev => ({ ...prev, showDetailsModal: true, selectedProFormaId: proforma.id }))}
                         >
                           View Details
                         </Button>
                         
                         {/* PDF Download Button */}
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleDownloadPDF(proforma)}
                           disabled={state.pdfGenerating[proforma.id]}
                           className="text-blue-600 border-blue-600 hover:bg-blue-50"
                         >
                           {state.pdfGenerating[proforma.id] ? (
                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                           ) : (
                             <Download className="h-4 w-4 mr-1" />
                           )}
                           {state.pdfGenerating[proforma.id] ? 'Generating...' : 'Download PDF'}
                         </Button>
                         
                         {/* PDF Print Button */}
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handlePrintPDF(proforma)}
                           disabled={state.pdfGenerating[`${proforma.id}_print`]}
                           className="text-green-600 border-green-600 hover:bg-green-50"
                         >
                           {state.pdfGenerating[`${proforma.id}_print`] ? (
                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                           ) : (
                             <Printer className="h-4 w-4 mr-1" />
                           )}
                           {state.pdfGenerating[`${proforma.id}_print`] ? 'Preparing...' : 'Print PDF'}
                         </Button>
                         
                         {proforma.status === 'accepted' && (
                           <Button
                             variant="primary"
                             size="sm"
                             onClick={() => setState(prev => ({ ...prev, showConversionModal: true, selectedProFormaId: proforma.id }))}
                             className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700"
                           >
                             <Send className="h-4 w-4 mr-1" />
                             Convert to Invoice
                           </Button>
                         )}
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pro Forma Creation Modal */}
      <ProFormaCreationModal
        isOpen={state.showCreationModal}
        onClose={() => setState(prev => ({ ...prev, showCreationModal: false }))}
        onSubmit={handleCreateProForma}
        onProFormaCreated={handleCreateProForma}
      />

      {/* Pro Forma Details Modal */}
      <Modal
        isOpen={state.showDetailsModal}
        onClose={() => setState(prev => ({ ...prev, showDetailsModal: false, selectedProFormaId: null }))}
      >
        <ModalBody>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900">Pro Forma Details</h3>
            {/* Pro forma details content will be implemented */}
            <p className="text-neutral-600">Pro forma details will be displayed here.</p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button 
            variant="outline" 
            onClick={() => setState(prev => ({ ...prev, showDetailsModal: false, selectedProFormaId: null }))}
          >
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Conversion Confirmation Modal */}
      <Modal
        isOpen={state.showConversionModal}
        onClose={() => setState(prev => ({ ...prev, showConversionModal: false, selectedProFormaId: null }))}
      >
        <ModalBody>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-mpondo-gold-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Convert Pro Forma to Invoice</h3>
            <p className="text-neutral-600">
              This will create a new invoice based on the accepted pro forma. The pro forma status will be updated to "Converted".
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button 
            variant="outline" 
            onClick={() => setState(prev => ({ ...prev, showConversionModal: false, selectedProFormaId: null }))}
          >
            Cancel
          </Button>
          <Button 
            variant="primary"
            onClick={() => state.selectedProFormaId && handleConvertToInvoice(state.selectedProFormaId)}
            className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700"
          >
            Convert to Invoice
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ProFormaPage;