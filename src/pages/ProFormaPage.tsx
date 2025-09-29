import React, { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Calendar, Building, Search, Filter, RefreshCw } from 'lucide-react';
import { Button, Card, CardHeader, CardContent, Input, Modal, ModalBody, ModalFooter } from '../design-system/components';
import { LoadingSpinner } from '../components/design-system/components/LoadingSpinner';
import { InvoiceService } from '../services/api/invoices.service';
import { InvoiceGenerationModal } from '../components/invoices/InvoiceGenerationModal';
import { debugSupabaseConnection } from '../utils/debug-supabase';
import { toast } from 'react-hot-toast';
import type { 
  Invoice, 
  ProFormaFilters, 
  ProFormaSummaryStats,
  Matter,
  InvoiceGenerationRequest 
} from '../types';
import { InvoiceStatus } from '../types';

interface ProFormaPageState {
  // Data
  proFormas: Invoice[];
  filteredProFormas: Invoice[];
  matters: Matter[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Modal States
  showCreationModal: boolean;
  showDetailsModal: boolean;
  showConversionModal: boolean;
  showDeleteModal: boolean;
  selectedProFormaId: string | null;
  
  // Filter State
  filters: ProFormaFilters;
  
  // Summary Statistics
  summaryStats: ProFormaSummaryStats;
}

const ProFormaPage: React.FC = () => {
  const [state, setState] = useState<ProFormaPageState>({
    proFormas: [],
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
      averageValue: 0
    }
  });

  // Apply filters to pro formas
  const applyFilters = useCallback((proFormas: Invoice[], filters: ProFormaFilters): Invoice[] => {
    return proFormas.filter(proForma => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          proForma.invoice_number.toLowerCase().includes(searchLower) ||
          (proForma.matter_id && proForma.matter_id.toLowerCase().includes(searchLower)) ||
          (proForma.fee_narrative && proForma.fee_narrative.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (filters.status !== 'all') {
        switch (filters.status) {
          case 'active':
            return proForma.status === InvoiceStatus.PRO_FORMA;
          case 'converted':
            return proForma.status === InvoiceStatus.CONVERTED;
          case 'expired':
            // Consider pro formas older than 30 days as expired
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return new Date(proForma.created_at) < thirtyDaysAgo && proForma.status === InvoiceStatus.PRO_FORMA;
          default:
            return true;
        }
      }
      
      // Date range filter
      if (filters.dateRange) {
        const proFormaDate = new Date(proForma.created_at);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        
        if (proFormaDate < startDate || proFormaDate > endDate) {
          return false;
        }
      }
      
      return true;
    });
  }, []);

  // Calculate summary statistics
  const calculateSummaryStats = useCallback((proFormas: Invoice[]): ProFormaSummaryStats => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthProFormas = proFormas.filter(pf => {
      const pfDate = new Date(pf.created_at);
      return pfDate.getMonth() === currentMonth && pfDate.getFullYear() === currentYear;
    });
    
    const convertedProFormas = proFormas.filter(pf => pf.status === InvoiceStatus.CONVERTED);
    const totalValue = proFormas.reduce((sum, pf) => sum + pf.total_amount, 0);
    
    return {
      totalCount: proFormas.length,
      estimatedValue: totalValue,
      currentMonthCount: currentMonthProFormas.length,
      conversionRate: proFormas.length > 0 ? (convertedProFormas.length / proFormas.length) * 100 : 0,
      averageValue: proFormas.length > 0 ? totalValue / proFormas.length : 0
    };
  }, []);

  // Fetch pro forma invoices
  const fetchProFormas = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Debug Supabase connection first
      console.log('🔍 Running Supabase connection debug...');
      const debugResult = await debugSupabaseConnection();
      console.log('Debug result:', debugResult);
      
      const response = await InvoiceService.getInvoices({
        status: [InvoiceStatus.PRO_FORMA],
        page: 1,
        pageSize: 100 // Get all pro formas for now
      });
      
      const proFormas = response.data;
      const filteredProFormas = applyFilters(proFormas, state.filters);
      const summaryStats = calculateSummaryStats(proFormas);
      
      setState(prev => ({
        ...prev,
        proFormas,
        filteredProFormas,
        summaryStats,
        isLoading: false
      }));
      
    } catch (error) {
      console.error('Error fetching pro formas:', error);
      
      // Use mock data when backend is unavailable
      const mockProFormas: Invoice[] = [
        {
          id: 'pf-001',
          matter_id: 'MAT-2024-001',
          advocate_id: 'adv-001',
          invoice_number: 'PF-2024-001',
          invoice_date: '2024-09-15',
          due_date: '2024-10-15',
          bar: BarAssociation.JOHANNESBURG,
          fees_amount: 25000,
          disbursements_amount: 2500,
          subtotal: 27500,
          vat_rate: 0.15,
          vat_amount: 4125,
          total_amount: 31625,
          status: InvoiceStatus.PRO_FORMA,
          amount_paid: 0,
          balance_due: 31625,
          fee_narrative: 'Professional services rendered in respect of commercial litigation matter involving breach of contract claim.',
          internal_notes: 'Initial pro forma for client approval',
          reminders_sent: 0,
          reminder_history: [],
          created_at: '2024-09-15T10:00:00Z',
          updated_at: '2024-09-15T10:00:00Z',
          days_outstanding: 14,
          is_overdue: false
        },
        {
          id: 'pf-002',
          matter_id: 'MAT-2024-002',
          advocate_id: 'adv-001',
          invoice_number: 'PF-2024-002',
          invoice_date: '2024-09-20',
          due_date: '2024-10-20',
          bar: BarAssociation.CAPE_TOWN,
          fees_amount: 18000,
          disbursements_amount: 1200,
          subtotal: 19200,
          vat_rate: 0.15,
          vat_amount: 2880,
          total_amount: 22080,
          status: InvoiceStatus.CONVERTED,
          amount_paid: 22080,
          balance_due: 0,
          fee_narrative: 'Legal opinion on property transfer and related due diligence work.',
          internal_notes: 'Converted to final invoice INV-2024-045',
          reminders_sent: 0,
          reminder_history: [],
          created_at: '2024-09-20T14:30:00Z',
          updated_at: '2024-09-25T09:15:00Z',
          days_outstanding: 0,
          is_overdue: false
        }
      ];
      
      const filteredProFormas = applyFilters(mockProFormas, state.filters);
      const summaryStats = calculateSummaryStats(mockProFormas);
      
      setState(prev => ({
        ...prev,
        proFormas: mockProFormas,
        filteredProFormas,
        summaryStats,
        isLoading: false,
        error: null // Clear error since we're using mock data
      }));
      
      toast.success('Using demo data - Supabase backend not available');
    }
  }, [state.filters, applyFilters, calculateSummaryStats]);

  // Handle pro forma creation
  const handleCreateProForma = useCallback(async (data: InvoiceGenerationRequest) => {
    try {
      await InvoiceService.generateInvoice({ ...data, isProForma: true });
      setState(prev => ({ ...prev, showCreationModal: false }));
      await fetchProFormas();
      toast.success('Pro forma invoice created successfully');
    } catch (error) {
      console.error('Error creating pro forma:', error);
      toast.error('Failed to create pro forma invoice');
    }
  }, [fetchProFormas]);

  // Handle conversion to final invoice
  const handleConvertToFinal = useCallback(async (proFormaId: string) => {
    try {
      await InvoiceService.convertProFormaToFinal(proFormaId);
      setState(prev => ({ ...prev, showConversionModal: false, selectedProFormaId: null }));
      await fetchProFormas();
    } catch (error) {
      console.error('Error converting pro forma:', error);
    }
  }, [fetchProFormas]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: Partial<ProFormaFilters>) => {
    setState(prev => {
      const updatedFilters = { ...prev.filters, ...newFilters };
      const filteredProFormas = applyFilters(prev.proFormas, updatedFilters);
      
      return {
        ...prev,
        filters: updatedFilters,
        filteredProFormas
      };
    });
  }, [applyFilters]);

  // Initial data fetch
  useEffect(() => {
    fetchProFormas();
  }, []);

  // Update filtered results when filters change
  useEffect(() => {
    const filteredProFormas = applyFilters(state.proFormas, state.filters);
    setState(prev => ({ ...prev, filteredProFormas }));
  }, [state.proFormas, state.filters, applyFilters]);

  if (state.isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Card variant="outlined">
          <CardContent className="text-center py-12">
            <div className="text-status-error-500 mb-4">
              <FileText className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Error Loading Pro Formas</h3>
            <p className="text-neutral-600 mb-6">{state.error}</p>
            <Button variant="primary" onClick={fetchProFormas}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Pro Forma Invoices</h1>
          <p className="text-neutral-600 mt-1">
            Create and manage preliminary invoices for estimation purposes
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setState(prev => ({ ...prev, showCreationModal: true }))}
          data-testid="create-pro-forma-button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Pro Forma
        </Button>
      </div>

      {/* Info Banner */}
      <Card variant="outlined" className="border-judicial-blue-200 bg-judicial-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-judicial-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-judicial-blue-900">About Pro Forma Invoices</h3>
              <p className="text-sm text-judicial-blue-800 mt-1">
                Pro forma invoices are preliminary bills used for estimation purposes. They don't affect billing status 
                or matter WIP values, and can later be converted to final invoices.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="default">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-judicial-blue-600" />
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Pro Formas</p>
                <p className="text-2xl font-bold text-neutral-900">{state.summaryStats.totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card variant="default">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-status-success-100 rounded-lg">
                <span className="text-status-success-600 font-bold">R</span>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-600">Estimated Value</p>
                <p className="text-2xl font-bold text-neutral-900">
                  R{state.summaryStats.estimatedValue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card variant="default">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-status-warning-600" />
              <div>
                <p className="text-sm font-medium text-neutral-600">This Month</p>
                <p className="text-2xl font-bold text-neutral-900">{state.summaryStats.currentMonthCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="default">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search pro formas..."
                value={state.filters.search}
                onChange={(e) => handleFiltersChange({ search: e.target.value })}
                className="w-full"
                data-testid="search-input"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={state.filters.status}
                onChange={(e) => handleFiltersChange({ status: e.target.value as ProFormaFilters['status'] })}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mpondo-gold-500"
                data-testid="status-filter"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="converted">Converted</option>
                <option value="expired">Expired</option>
              </select>
              <Button variant="outline" onClick={() => handleFiltersChange({ search: '', status: 'all', dateRange: null })}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pro Forma List */}
      <Card variant="default">
        <CardHeader className="p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            Pro Forma Invoices ({state.filteredProFormas.length})
          </h2>
        </CardHeader>
        
        {state.filteredProFormas.length === 0 ? (
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {state.proFormas.length === 0 ? 'No Pro Forma Invoices' : 'No Results Found'}
            </h3>
            <p className="text-neutral-600 mb-6">
              {state.proFormas.length === 0 
                ? 'Create your first pro forma invoice to get started with preliminary billing.'
                : 'No pro formas match your current filters. Try adjusting your search criteria.'
              }
            </p>
            {state.proFormas.length === 0 ? (
              <Button variant="primary" onClick={() => setState(prev => ({ ...prev, showCreationModal: true }))}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Pro Forma
              </Button>
            ) : (
              <Button variant="outline" onClick={() => handleFiltersChange({ search: '', status: 'all', dateRange: null })}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        ) : (
          <div className="divide-y divide-neutral-200">
            {state.filteredProFormas.map((proForma) => (
              <div key={proForma.id} className="p-6 hover:bg-neutral-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-neutral-900">{proForma.invoice_number}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        proForma.status === InvoiceStatus.PRO_FORMA 
                          ? 'bg-judicial-blue-100 text-judicial-blue-800'
                          : proForma.status === InvoiceStatus.CONVERTED
                          ? 'bg-status-success-100 text-status-success-800'
                          : 'bg-neutral-100 text-neutral-800'
                      }`}>
                        {proForma.status === InvoiceStatus.PRO_FORMA ? 'Pro Forma' : 
                         proForma.status === InvoiceStatus.CONVERTED ? 'Converted' : proForma.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-neutral-400" />
                        <span className="text-neutral-600">Matter: {proForma.matter_id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-neutral-400" />
                        <span className="text-neutral-600">
                          {proForma.fee_narrative ? proForma.fee_narrative.substring(0, 50) + '...' : 'No description'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 flex items-center justify-center text-neutral-400 font-bold">R</span>
                        <span className="text-neutral-600">
                          R{proForma.total_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <span className="text-neutral-600">
                          {new Date(proForma.created_at).toLocaleDateString('en-ZA')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {proForma.status === InvoiceStatus.PRO_FORMA && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setState(prev => ({ 
                          ...prev, 
                          showConversionModal: true, 
                          selectedProFormaId: proForma.id 
                        }))}
                        className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700"
                        data-testid={`convert-button-${proForma.id}`}
                      >
                        Convert to Final
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setState(prev => ({ 
                        ...prev, 
                        showDetailsModal: true, 
                        selectedProFormaId: proForma.id 
                      }))}
                      data-testid={`details-button-${proForma.id}`}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Conversion Confirmation Modal */}
      {state.showConversionModal && state.selectedProFormaId && (
        <Modal 
          isOpen={state.showConversionModal} 
          onClose={() => setState(prev => ({ ...prev, showConversionModal: false, selectedProFormaId: null }))}
          size="md"
        >
          <ModalBody>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-mpondo-gold-100 mb-4">
                <FileText className="h-6 w-6 text-mpondo-gold-600" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Convert Pro Forma to Final Invoice</h3>
              <p className="text-sm text-neutral-600 mb-4">
                This will create a final invoice based on this pro forma and mark the time entries as billed. 
                This action cannot be undone.
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
              onClick={() => handleConvertToFinal(state.selectedProFormaId!)}
              className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700"
            >
              Convert to Final Invoice
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Pro Forma Details Modal */}
      {state.showDetailsModal && state.selectedProFormaId && (
        <Modal 
          isOpen={state.showDetailsModal} 
          onClose={() => setState(prev => ({ ...prev, showDetailsModal: false, selectedProFormaId: null }))}
          size="lg"
        >
          <ModalBody>
            {(() => {
              const selectedProForma = state.proFormas.find(pf => pf.id === state.selectedProFormaId);
              if (!selectedProForma) return <div>Pro forma not found</div>;
              
              return (
                <div className="space-y-6">
                  <div className="text-center border-b border-neutral-200 pb-4">
                    <h3 className="text-xl font-semibold text-neutral-900">{selectedProForma.invoice_number}</h3>
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full mt-2 ${
                      selectedProForma.status === InvoiceStatus.PRO_FORMA 
                        ? 'bg-judicial-blue-100 text-judicial-blue-800'
                        : selectedProForma.status === InvoiceStatus.CONVERTED
                        ? 'bg-status-success-100 text-status-success-800'
                        : 'bg-neutral-100 text-neutral-800'
                    }`}>
                      {selectedProForma.status === InvoiceStatus.PRO_FORMA ? 'Pro Forma' : 
                       selectedProForma.status === InvoiceStatus.CONVERTED ? 'Converted' : selectedProForma.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-3">Invoice Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Matter ID:</span>
                          <span className="text-neutral-900">{selectedProForma.matter_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Created:</span>
                          <span className="text-neutral-900">
                            {new Date(selectedProForma.created_at).toLocaleDateString('en-ZA')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Due Date:</span>
                          <span className="text-neutral-900">
                            {new Date(selectedProForma.due_date).toLocaleDateString('en-ZA')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Bar:</span>
                          <span className="text-neutral-900 capitalize">{selectedProForma.bar}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-3">Financial Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Fees:</span>
                          <span className="text-neutral-900">
                            R{selectedProForma.fees_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Disbursements:</span>
                          <span className="text-neutral-900">
                            R{selectedProForma.disbursements_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">VAT ({(selectedProForma.vat_rate * 100).toFixed(0)}%):</span>
                          <span className="text-neutral-900">
                            R{selectedProForma.vat_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold text-base border-t border-neutral-200 pt-2">
                          <span className="text-neutral-900">Total:</span>
                          <span className="text-neutral-900">
                            R{selectedProForma.total_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedProForma.fee_narrative && (
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-3">Fee Narrative</h4>
                      <div className="bg-neutral-50 p-4 rounded-lg">
                        <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                          {selectedProForma.fee_narrative}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="outline" 
              onClick={() => setState(prev => ({ ...prev, showDetailsModal: false, selectedProFormaId: null }))}
            >
              Close
            </Button>
            {(() => {
              const selectedProForma = state.proFormas.find(pf => pf.id === state.selectedProFormaId);
              return selectedProForma?.status === InvoiceStatus.PRO_FORMA && (
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setState(prev => ({ 
                      ...prev, 
                      showDetailsModal: false,
                      showConversionModal: true 
                    }));
                  }}
                  className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700"
                >
                  Convert to Final Invoice
                </Button>
              );
            })()}
          </ModalFooter>
        </Modal>
      )}

      {/* Pro Forma Creation Modal */}
      {state.showCreationModal && (
        <InvoiceGenerationModal
          isOpen={state.showCreationModal}
          onClose={() => setState(prev => ({ ...prev, showCreationModal: false }))}
          onInvoiceGenerated={fetchProFormas}
          defaultToProForma={true}
        />
      )}
    </div>
  );
};

export default ProFormaPage;
