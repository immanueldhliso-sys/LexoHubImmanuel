import React, { useState, useMemo } from 'react';
import { 
  Briefcase, 
  FileText, 
  Plus, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Eye,
  Send,
  Calculator
} from 'lucide-react';
import { Card, CardContent, Button, CardHeader } from '../design-system/components';
import { VoiceRecordingModal, VoiceNotesList, VoiceTimeEntryForm } from '../components/voice';
import { InvoiceGenerationModal } from '../components/invoices/InvoiceGenerationModal';
import { voiceManagementService } from '../services/voice-management.service';
import { InvoiceService } from '../services/api/invoices.service';
import { toast } from 'react-hot-toast';
import type { Matter, VoiceRecording, TimeEntry, Invoice } from '../types';
import { MatterStatus, BarAssociation, FeeType, RiskLevel } from '../types';

const MattersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'all' | 'analytics' | 'voice'>('active');
  const [searchTerm] = useState('');
  const [filterStatus] = useState<MatterStatus | 'all'>('all');
  const [showNewMatterModal, setShowNewMatterModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showVoiceTimeEntryForm, setShowVoiceTimeEntryForm] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedMatter, setSelectedMatter] = useState<Matter | null>(null);
  const [selectedVoiceRecording, setSelectedVoiceRecording] = useState<VoiceRecording | null>(null);
  const [voiceRecordings, setVoiceRecordings] = useState<VoiceRecording[]>([]);
  const [playingRecordingId, setPlayingRecordingId] = useState<string | undefined>(undefined);
  const [matterInvoices, setMatterInvoices] = useState<Record<string, Invoice[]>>({});

  // Mock data - in real app this would come from API
  const mockMatters: Matter[] = useMemo(() => [
    {
      id: '1',
      advocate_id: 'adv-1',
      reference_number: 'MAT-2024-001',
      title: 'Smith v Jones Commercial Dispute',
      description: 'Contract dispute regarding supply agreement breach',
      matter_type: 'Commercial Litigation',
      court_case_number: undefined,
      bar: BarAssociation.JOHANNESBURG,
      client_name: 'ABC Corporation',
      client_email: undefined,
      client_phone: undefined,
      client_address: undefined,
      client_type: undefined,
      instructing_attorney: 'John Smith',
      instructing_attorney_email: undefined,
      instructing_attorney_phone: undefined,
      instructing_firm: 'Smith & Associates',
      instructing_firm_ref: undefined,
      fee_type: FeeType.STANDARD,
      estimated_fee: 200000,
      fee_cap: undefined,
      actual_fee: undefined,
      wip_value: 125000,
      trust_balance: 0,
      disbursements: 0,
      vat_exempt: false,
      status: MatterStatus.ACTIVE,
      risk_level: RiskLevel.MEDIUM,
      settlement_probability: 72,
      expected_completion_date: undefined,
      conflict_check_completed: true,
      conflict_check_date: '2024-01-14T09:00:00Z',
      conflict_check_cleared: true,
      conflict_notes: undefined,
      date_instructed: '2024-01-15T10:00:00Z',
      date_accepted: '2024-01-15T10:00:00Z',
      date_commenced: '2024-01-16T10:00:00Z',
      date_settled: undefined,
      date_closed: undefined,
      next_court_date: undefined,
      prescription_date: undefined,
      tags: ['commercial', 'contract'],
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-02-20T14:30:00Z',
      deleted_at: undefined,
      days_active: 30,
      is_overdue: false
    }
  ], []);

  // Load existing voice recordings and matter invoices on component mount
  React.useEffect(() => {
    setVoiceRecordings(voiceManagementService.getVoiceRecordings());
    loadMatterInvoices();
  }, []);

  const loadMatterInvoices = async () => {
    try {
      // Load invoices for all matters
      const invoicePromises = mockMatters.map(async (matter) => {
        const response = await InvoiceService.getInvoices({ matterId: matter.id });
        return { matterId: matter.id, invoices: response.data };
      });
      
      const results = await Promise.all(invoicePromises);
      const invoiceMap: Record<string, Invoice[]> = {};
      results.forEach(({ matterId, invoices }) => {
        invoiceMap[matterId] = invoices;
      });
      
      setMatterInvoices(invoiceMap);
    } catch (error) {
      console.error('Error loading matter invoices:', error);
    }
  };

  // Voice Recording Event Handlers
  const voiceHandlers = React.useMemo(() => {
    const handleVoiceRecordingComplete = async (recording: VoiceRecording) => {
      try {
        await voiceManagementService.processVoiceRecording(
          recording, 
          mockMatters
        );
        setVoiceRecordings(voiceManagementService.getVoiceRecordings());
        console.log('Voice recording processed successfully');
      } catch (error) {
        console.error('Failed to process voice recording:', error);
      }
    };

    const handleVoicePlayback = async (recordingId: string) => {
      try {
        if (playingRecordingId === recordingId) {
          voiceManagementService.stopPlayback();
          setPlayingRecordingId(undefined);
        } else {
          await voiceManagementService.playVoiceRecording(recordingId);
          setPlayingRecordingId(recordingId);
        }
      } catch (error) {
        console.error('Playback failed:', error);
      }
    };

    const handleVoiceEdit = (recordingId: string) => {
      console.log('Edit recording:', recordingId);
    };

    const handleVoiceDelete = (recordingId: string) => {
      voiceManagementService.deleteVoiceRecording(recordingId);
      setVoiceRecordings(voiceManagementService.getVoiceRecordings());
      if (playingRecordingId === recordingId) {
        setPlayingRecordingId(undefined);
      }
    };

    const handleConvertToTimeEntry = (recordingId: string) => {
      const recording = voiceManagementService.getVoiceRecording(recordingId);
      if (recording) {
        setSelectedVoiceRecording(recording);
        setShowVoiceTimeEntryForm(true);
      }
    };

    const handleTimeEntrySave = (timeEntry: Omit<TimeEntry, 'id' | 'createdAt'>) => {
      console.log('Saving time entry:', timeEntry);
      setShowVoiceTimeEntryForm(false);
      setSelectedVoiceRecording(null);
    };

    return {
      handleVoiceRecordingComplete,
      handleVoicePlayback,
      handleVoiceEdit,
      handleVoiceDelete,
      handleConvertToTimeEntry,
      handleTimeEntrySave
    };
  }, [playingRecordingId, mockMatters]);

  // Invoice Generation Handlers
  const handleGenerateInvoice = (matter: Matter, isProForma: boolean = false) => {
    setSelectedMatter(matter);
    setShowInvoiceModal(true);
  };

  const handleInvoiceGenerated = async () => {
    setShowInvoiceModal(false);
    setSelectedMatter(null);
    await loadMatterInvoices(); // Refresh invoice data
    toast.success('Invoice generated successfully');
  };

  const handleViewMatterInvoices = (matter: Matter) => {
    // Navigate to invoices page with matter filter
    // This would be implemented with proper navigation
    toast.info(`Viewing invoices for ${matter.title}`);
  };

  const getMatterFinancialSummary = (matter: Matter) => {
    const invoices = matterInvoices[matter.id] || [];
    const totalBilled = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
    const unbilledWip = matter.wip_value - totalBilled;
    
    return {
      totalBilled,
      totalPaid,
      unbilledWip,
      invoiceCount: invoices.length,
      hasOverdue: invoices.some(inv => inv.status === 'overdue')
    };
  };

  const filteredMatters = useMemo(() => {
    return mockMatters.filter(matter => {
      const matchesSearch = matter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           matter.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           matter.instructing_attorney.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || matter.status === filterStatus;
      const matchesTab = activeTab === 'all' || 
                        (activeTab === 'active' && matter.status === MatterStatus.ACTIVE);
      return matchesSearch && matchesStatus && matchesTab;
    });
  }, [mockMatters, searchTerm, filterStatus, activeTab]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Matters</h1>
          <p className="text-neutral-600 mt-1">Manage your cases with intelligence and insight</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setShowNewMatterModal(true)}
          className="flex items-center space-x-2"
        >
          <Briefcase className="w-4 h-4" />
          <span>New Matter</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1">
        {(['active', 'all', 'analytics', 'voice'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {tab === 'active' ? 'Active Matters' : 
             tab === 'all' ? 'All Matters' : 
             tab === 'analytics' ? 'Analytics' : 'Voice Notes'}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'voice' ? (
        <VoiceNotesList
          recordings={voiceRecordings}
          onPlayback={voiceHandlers.handleVoicePlayback}
          onEdit={voiceHandlers.handleVoiceEdit}
          onDelete={voiceHandlers.handleVoiceDelete}
          onConvertToTimeEntry={voiceHandlers.handleConvertToTimeEntry}
          playingRecordingId={playingRecordingId}
        />
      ) : (
        <div className="space-y-4">
          {filteredMatters.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Briefcase className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No Matters Found</h3>
                <p className="text-neutral-600 mb-4">
                  {activeTab === 'active' ? 'No active matters' : 'No matters match your criteria'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredMatters.map((matter) => {
              const financialSummary = getMatterFinancialSummary(matter);
              
              return (
                <Card key={matter.id} variant="default" hoverable>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-neutral-900">{matter.title}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            matter.status === MatterStatus.ACTIVE 
                              ? 'bg-status-success-100 text-status-success-800' 
                              : 'bg-neutral-100 text-neutral-800'
                          }`}>
                            {matter.status}
                          </span>
                          {financialSummary.hasOverdue && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-status-error-100 text-status-error-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Overdue
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600">
                          Client: {matter.client_name} • Attorney: {matter.instructing_attorney}
                        </p>
                        <p className="text-sm text-neutral-500 mt-1">
                          {matter.instructing_firm} • Risk: {matter.risk_level}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Financial Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-neutral-50 rounded-lg">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Clock className="w-4 h-4 text-neutral-400" />
                          <span className="text-xs text-neutral-500">Unbilled WIP</span>
                        </div>
                        <p className="font-semibold text-neutral-900">
                          R{financialSummary.unbilledWip.toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <FileText className="w-4 h-4 text-neutral-400" />
                          <span className="text-xs text-neutral-500">Total Billed</span>
                        </div>
                        <p className="font-semibold text-neutral-900">
                          R{financialSummary.totalBilled.toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <DollarSign className="w-4 h-4 text-neutral-400" />
                          <span className="text-xs text-neutral-500">Collected</span>
                        </div>
                        <p className="font-semibold text-status-success-600">
                          R{financialSummary.totalPaid.toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingUp className="w-4 h-4 text-neutral-400" />
                          <span className="text-xs text-neutral-500">Settlement %</span>
                        </div>
                        <p className="font-semibold text-neutral-900">
                          {matter.settlement_probability || 0}%
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-4 border-t border-neutral-100">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleGenerateInvoice(matter, false)}
                        disabled={financialSummary.unbilledWip <= 0}
                        className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Invoice
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateInvoice(matter, true)}
                        disabled={financialSummary.unbilledWip <= 0}
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Pro Forma
                      </Button>
                      
                      {financialSummary.invoiceCount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewMatterInvoices(matter)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Invoices ({financialSummary.invoiceCount})
                        </Button>
                      )}
                      
                      <div className="flex-1"></div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowVoiceModal(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Time
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Voice Recording Modal */}
      <VoiceRecordingModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onRecordingComplete={(recording) => {
          voiceHandlers.handleVoiceRecordingComplete(recording);
          setShowVoiceModal(false);
        }}
      />

      {/* Voice Time Entry Form */}
      {selectedVoiceRecording && selectedVoiceRecording.extractedData && (
        <VoiceTimeEntryForm
          isOpen={showVoiceTimeEntryForm}
          recording={selectedVoiceRecording}
          extractedData={selectedVoiceRecording.extractedData}
          availableMatters={mockMatters}
          onSave={voiceHandlers.handleTimeEntrySave}
          onCancel={() => {
            setShowVoiceTimeEntryForm(false);
            setSelectedVoiceRecording(null);
          }}
        />
      )}

      {/* Invoice Generation Modal */}
      {showInvoiceModal && selectedMatter && (
        <InvoiceGenerationModal
          isOpen={showInvoiceModal}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedMatter(null);
          }}
          matter={selectedMatter}
          onInvoiceGenerated={handleInvoiceGenerated}
          defaultToProForma={false}
        />
      )}

      {/* New Matter Modal Placeholder */}
      {showNewMatterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">New Matter</h3>
            <p className="text-neutral-600 mb-4">New matter modal would be implemented here.</p>
            <Button onClick={() => setShowNewMatterModal(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MattersPage;