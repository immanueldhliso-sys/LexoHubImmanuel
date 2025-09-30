import React, { useState, useEffect, useCallback } from 'react';
import { X, FileText, Clock, Calculator, AlertCircle, Sparkles, Eye, Plus, Trash2, Download, Send, Percent, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { InvoiceService } from '@/services/api/invoices.service';
import { TimeEntryService } from '@/services/api/time-entries.service';
import { DocumentIntelligenceService } from '@/services/api/document-intelligence.service';
import { FeeNarrativeGenerator } from '@/services/fee-narrative-generator.service';
import { InvoicePDFService } from '@/services/pdf/invoice-pdf.service';
import { InvoiceEmailService } from '@/services/email/invoice-email.service';
import { formatRand } from '../../lib/currency';
import type { 
  Matter, 
  TimeEntry, 
  InvoiceGenerationRequest, 
  InvoiceGenerationOptions,
  FeeStructure,
  Expense,
  ExpenseCategory,
  NarrativeGenerationRequest
} from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { matterApiService } from '@/services/api';

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
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
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

  // New enhancement states
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [feeStructureOverride, setFeeStructureOverride] = useState<Partial<FeeStructure> | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    description: '',
    amount: 0,
    category: 'other' as ExpenseCategory,
    date: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState<'time' | 'expenses' | 'settings'>('time');

  const loadAvailableMatters = useCallback(async () => {
    try {
      setIsLoading(true);
      // Load real matters for the current advocate
      if (authLoading || !isAuthenticated || !user?.id) {
        setAvailableMatters([]);
      } else {
        const { data } = await matterApiService.getByAdvocate(user.id);
        setAvailableMatters((data || []) as unknown as Matter[]);
      }
    } catch (error) {
      console.error('Error loading matters:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, user?.id]);

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

  const loadUnbilledExpenses = useCallback(async () => {
    try {
      if (!selectedMatter?.id) return;
      
      // Mock expenses for now - replace with actual API call
      const mockExpenses: Expense[] = [
        {
          id: '1',
          description: 'Court filing fees',
          amount: 250.00,
          category: 'court_fees',
          date: new Date().toISOString(),
          matterId: selectedMatter.id,
          invoiced: false
        },
        {
          id: '2',
          description: 'Document printing and binding',
          amount: 85.50,
          category: 'printing',
          date: new Date().toISOString(),
          matterId: selectedMatter.id,
          invoiced: false
        }
      ];
      
      setExpenses(mockExpenses);
      setSelectedExpenses(mockExpenses.map(e => e.id));
    } catch (error) {
      console.error('Error loading unbilled expenses:', error);
      toast.error('Failed to load unbilled expenses');
    }
  }, [selectedMatter?.id]);

  // Load available matters if no matter provided
  useEffect(() => {
    if (isOpen && !matter && !authLoading && isAuthenticated) {
      loadAvailableMatters();
    }
  }, [isOpen, matter, authLoading, isAuthenticated, loadAvailableMatters]);

  // Load unbilled time entries and expenses
  useEffect(() => {
    if (isOpen && selectedMatter?.id) {
      loadUnbilledTimeEntries();
      loadUnbilledExpenses();
    }
  }, [isOpen, selectedMatter?.id, loadUnbilledTimeEntries, loadUnbilledExpenses]);

  const handleEntryToggle = (entryId: string) => {
    setSelectedEntries(prev => 
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleExpenseToggle = (expenseId: string) => {
    setSelectedExpenses(prev => 
      prev.includes(expenseId)
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    );
  };

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) {
      toast.error('Please fill in all expense details');
      return;
    }

    const expense: Expense = {
      id: `temp_${Date.now()}`,
      description: newExpense.description,
      amount: newExpense.amount,
      category: newExpense.category || 'other',
      date: newExpense.date || new Date().toISOString(),
      matterId: selectedMatter?.id || '',
      invoiced: false
    };

    setExpenses(prev => [...prev, expense]);
    setSelectedExpenses(prev => [...prev, expense.id]);
    setNewExpense({
      description: '',
      amount: 0,
      category: 'other',
      date: new Date().toISOString().split('T')[0]
    });
    setShowExpenseForm(false);
    toast.success('Expense added successfully');
  };

  const handleRemoveExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    setSelectedExpenses(prev => prev.filter(id => id !== expenseId));
  };

  const handlePreviewNarrative = async () => {
    if (selectedEntries.length === 0) {
      toast.error('Please select time entries to preview narrative');
      return;
    }

    try {
      setShowNarrativePreview(true);
      
      // Use the enhanced narrative generator
      const selectedTimeEntries = timeEntries.filter(entry => 
        selectedEntries.includes(entry.id)
      );

      const request: NarrativeGenerationRequest = {
        matterId: selectedMatter?.id || '',
        timeEntries: selectedTimeEntries,
        matterTitle: selectedMatter?.title || '',
        clientName: selectedMatter?.clientName || '',
        totalHours: selectedTimeEntries.reduce((sum, entry) => sum + (entry.duration / 60), 0),
        totalAmount: calculateTotals().totalAmount,
        includeComplexityJustification: true,
        includeValueDelivered: true
      };

      const result = await FeeNarrativeGenerator.generateBarCompliantNarrative(request);
      setPreviewNarrative(result.narrative);
    } catch (error) {
      console.error('Error generating narrative preview:', error);
      toast.error('Failed to generate narrative preview');
    }
  };

  const calculateTotals = () => {
    const selectedTimeEntries = timeEntries.filter(entry => 
      selectedEntries.includes(entry.id)
    );
    
    const selectedExpenseItems = expenses.filter(expense => 
      selectedExpenses.includes(expense.id)
    );
    
    const totalHours = selectedTimeEntries.reduce((sum, entry) => 
      sum + (entry.duration / 60), 0
    );
    
    const totalFees = selectedTimeEntries.reduce((sum, entry) => 
      sum + ((entry.duration / 60) * (feeStructureOverride?.hourlyRate || entry.rate)), 0
    );
    
    const totalExpenses = selectedExpenseItems.reduce((sum, expense) => 
      sum + expense.amount, 0
    );
    
    // Apply discounts
    let discountValue = 0;
    if (discountType === 'percentage') {
      discountValue = totalFees * (discountPercentage / 100);
    } else {
      discountValue = discountAmount;
    }
    
    const discountedFees = Math.max(0, totalFees - discountValue);
    const disbursements = selectedMatter?.disbursements || 0;
    const vatRate = selectedMatter?.bar === 'johannesburg' ? 0.15 : 0.15; // 15% VAT for both bars
    const vatAmount = discountedFees * vatRate;
    const totalAmount = discountedFees + vatAmount + disbursements + totalExpenses;

    return {
      totalHours,
      totalFees,
      totalExpenses,
      discountValue,
      discountedFees,
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
      
      const options: InvoiceGenerationOptions = {
        matterId: selectedMatter?.id || '',
        includeTimeEntries: selectedEntries,
        includeExpenses: selectedExpenses,
        feeStructureOverride,
        narrative: customNarrative.trim() || undefined,
        discountAmount: discountType === 'amount' ? discountAmount : undefined,
        discountPercentage: discountType === 'percentage' ? discountPercentage : undefined
      };

      const request: InvoiceGenerationRequest = {
        matterId: selectedMatter?.id || '',
        timeEntryIds: selectedEntries,
        customNarrative: customNarrative.trim() || undefined,
        includeUnbilledTime,
        isProForma: isProForma,
        options
      };

      const invoice = await InvoiceService.generateInvoice(request);
      
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

  const handleDownloadPDF = async () => {
    if (selectedEntries.length === 0) {
      toast.error('Please select time entries first');
      return;
    }

    try {
      // Create a mock invoice object for PDF generation
      const mockInvoice = {
        id: 'preview',
        invoiceNumber: 'PREVIEW',
        matterId: selectedMatter?.id || '',
        totalAmount: calculateTotals().totalAmount,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        lineItems: [
          ...timeEntries.filter(entry => selectedEntries.includes(entry.id)).map(entry => ({
            description: entry.description,
            quantity: entry.duration / 60,
            rate: feeStructureOverride?.hourlyRate || entry.rate,
            amount: (entry.duration / 60) * (feeStructureOverride?.hourlyRate || entry.rate)
          })),
          ...expenses.filter(expense => selectedExpenses.includes(expense.id)).map(expense => ({
            description: expense.description,
            quantity: 1,
            rate: expense.amount,
            amount: expense.amount
          }))
        ]
      };

      const mockMatter = selectedMatter;
      const mockAdvocate = user;

      const result = isProForma 
        ? await InvoicePDFService.generateProFormaPDF(mockInvoice, mockMatter, mockAdvocate)
        : await InvoicePDFService.generateInvoicePDF(mockInvoice, mockMatter, mockAdvocate);

      if (result.success && result.blob) {
        InvoicePDFService.downloadPDF(result.blob, result.filename);
        toast.success('PDF downloaded successfully');
      } else {
        toast.error(result.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const totals = calculateTotals();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
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
          {/* Main Content */}
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

            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="border-b border-neutral-200">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'time', label: 'Time Entries', icon: Clock },
                    { id: 'expenses', label: 'Expenses', icon: FileText },
                    { id: 'settings', label: 'Settings', icon: Calculator }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as any)}
                      className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === id
                          ? 'border-mpondo-gold-500 text-mpondo-gold-600'
                          : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Time Entries Tab */}
            {activeTab === 'time' && (
              <div>
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
                              <span>R{(feeStructureOverride?.hourlyRate || entry.rate).toFixed(2)}/hour</span>
                              <span className="font-medium text-neutral-700">
                                R{((entry.duration / 60) * (feeStructureOverride?.hourlyRate || entry.rate)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Expenses Tab */}
            {activeTab === 'expenses' && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-neutral-900 mb-2">
                      Expenses & Disbursements
                    </h3>
                    <p className="text-sm text-neutral-600">
                      Select expenses to include in this invoice
                    </p>
                  </div>
                  <button
                    onClick={() => setShowExpenseForm(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Expense
                  </button>
                </div>

                {/* Add Expense Form */}
                {showExpenseForm && (
                  <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    <h4 className="font-medium text-neutral-900 mb-3">Add New Expense</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={newExpense.description}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                          placeholder="Enter expense description"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Amount
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Category
                        </label>
                        <select
                          value={newExpense.category}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value as ExpenseCategory }))}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                        >
                          <option value="court_fees">Court Fees</option>
                          <option value="travel">Travel</option>
                          <option value="printing">Printing</option>
                          <option value="postage">Postage</option>
                          <option value="research">Research</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={newExpense.date?.split('T')[0]}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        onClick={() => setShowExpenseForm(false)}
                        className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddExpense}
                        className="px-4 py-2 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700 transition-colors"
                      >
                        Add Expense
                      </button>
                    </div>
                  </div>
                )}

                {/* Expenses List */}
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        selectedExpenses.includes(expense.id)
                          ? 'border-mpondo-gold-300 bg-mpondo-gold/5'
                          : 'border-neutral-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              checked={selectedExpenses.includes(expense.id)}
                              onChange={() => handleExpenseToggle(expense.id)}
                              className="rounded border-neutral-300 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                            />
                            <span className="text-sm font-medium text-neutral-900">
                              {expense.description}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-neutral-500">
                            <span className="capitalize">{expense.category.replace('_', ' ')}</span>
                            <span>{format(new Date(expense.date), 'dd MMM yyyy')}</span>
                            <span className="font-medium text-neutral-700">
                              R{expense.amount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        {expense.id.startsWith('temp_') && (
                          <button
                            onClick={() => handleRemoveExpense(expense.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                      <p className="text-neutral-600">No expenses found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Invoice Type Selection */}
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-4">Invoice Type</h3>
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
                  
                  {isProForma && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Pro Forma Invoice:</strong> This will create a preliminary invoice for estimation purposes. 
                        Time entries will not be marked as billed and can be included in a final invoice later.
                      </p>
                    </div>
                  )}
                </div>

                {/* Discount Settings */}
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-4">Discount</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="discountType"
                          checked={discountType === 'amount'}
                          onChange={() => setDiscountType('amount')}
                          className="text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                        />
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm text-neutral-700">Fixed Amount</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="discountType"
                          checked={discountType === 'percentage'}
                          onChange={() => setDiscountType('percentage')}
                          className="text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                        />
                        <Percent className="w-4 h-4" />
                        <span className="text-sm text-neutral-700">Percentage</span>
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {discountType === 'amount' ? (
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Discount Amount (R)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={discountAmount}
                            onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                            placeholder="0.00"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Discount Percentage (%)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={discountPercentage}
                            onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                            placeholder="0.0"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fee Structure Override */}
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-4">Fee Structure Override</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Hourly Rate Override (R)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={feeStructureOverride?.hourlyRate || ''}
                        onChange={(e) => setFeeStructureOverride(prev => ({
                          ...prev,
                          hourlyRate: parseFloat(e.target.value) || undefined
                        }))}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                        placeholder="Leave empty to use default rates"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    Override the default hourly rates for this invoice. Leave empty to use matter-specific rates.
                  </p>
                </div>

                {/* Fee Narrative Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-neutral-900">Fee Narrative</h3>
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
                        AI will generate a professional, Bar Council compliant fee narrative based on your time entries, including:
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-mpondo-gold-700">
                        <li>• Categorized work summary</li>
                        <li>• Key activities performed</li>
                        <li>• Complexity justification</li>
                        <li>• Value delivered to client</li>
                        <li>• Professional service standards</li>
                      </ul>
                    </div>
                  )}
                </div>
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

          {/* Invoice Summary Sidebar */}
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

                {totals.totalExpenses > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Expenses:</span>
                    <span className="font-medium">R{totals.totalExpenses.toFixed(2)}</span>
                  </div>
                )}

                {totals.discountValue > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span className="font-medium">-R{totals.discountValue.toFixed(2)}</span>
                  </div>
                )}
                
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
                    Generate {isProForma ? 'Pro Forma' : 'Invoice'}
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={selectedEntries.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                Preview PDF
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