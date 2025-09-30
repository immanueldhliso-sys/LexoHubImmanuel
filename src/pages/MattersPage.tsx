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
  Calculator
} from 'lucide-react';
import { Card, CardContent, Button, CardHeader } from '../design-system/components';
import { VoiceRecordingModal, VoiceNotesList, VoiceTimeEntryForm } from '../components/voice';
import { InvoiceGenerationModal } from '../components/invoices/InvoiceGenerationModal';
import { NewMatterModal } from '../components/matters/NewMatterModal';
import { voiceManagementService } from '../services/voice-management.service';
import { InvoiceService } from '../services/api/invoices.service';
import { matterApiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import type { Matter, VoiceRecording, TimeEntry, Invoice } from '../types';
import { MatterStatus } from '../types';

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
  const [matters, setMatters] = useState<Matter[]>([]);
  const [loadingMatters, setLoadingMatters] = useState<boolean>(false);
  const { user, loading, isAuthenticated } = useAuth();

  // Load matters from API based on current user
  React.useEffect(() => {
    const fetchMatters = async () => {
      if (loading || !isAuthenticated || !user?.id) return;
      setLoadingMatters(true);
      try {
        const { data, error } = await matterApiService.getByAdvocate(user.id);
        if (error) {
          toast.error('Failed to load matters');
          setMatters([]);
        } else {
          setMatters(data || []);
        }
      } catch (err) {
        toast.error('Unexpected error loading matters');
        setMatters([]);
      } finally {
        setLoadingMatters(false);
      }
    };
    fetchMatters();
  }, [loading, isAuthenticated, user?.id]);

  // Load existing voice recordings and matter invoices when matters are available
  React.useEffect(() => {
    setVoiceRecordings(voiceManagementService.getVoiceRecordings());
    if (matters.length > 0) {
      loadMatterInvoices();
    }
  }, [matters.length]);

  const loadMatterInvoices = async () => {
    try {
      const invoicePromises = matters.map(async (matter) => {
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
      toast.error('Failed to load invoices');
    }
  };

  // Voice Recording Event Handlers
  const voiceHandlers = React.useMemo(() => {
    const handleVoiceRecordingComplete = async (recording: VoiceRecording) => {
      try {
        await voiceManagementService.processVoiceRecording(recording, matters);
        setVoiceRecordings(voiceManagementService.getVoiceRecordings());
        toast.success('Voice recording processed successfully');
      } catch (error) {
        toast.error('Failed to process voice recording');
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
        toast.error('Playback failed');
      }
    };

    const handleVoiceEdit = (recordingId: string) => {
      // Implement edit functionality
    };

    const handleVoiceDelete = (recordingId: string) => {
      voiceManagementService.deleteVoiceRecording(recordingId);
      setVoiceRecordings(voiceManagementService.getVoiceRecordings());
      if (playingRecordingId === recordingId) {
        setPlayingRecordingId(undefined);
      }
      toast.success('Recording deleted');
    };

    const handleConvertToTimeEntry = (recordingId: string) => {
      const recording = voiceManagementService.getVoiceRecording(recordingId);
      if (recording) {
        setSelectedVoiceRecording(recording);
        setShowVoiceTimeEntryForm(true);
      }
    };

    const handleTimeEntrySave = (timeEntry: Omit<TimeEntry, 'id' | 'createdAt'>) => {
      setShowVoiceTimeEntryForm(false);
      setSelectedVoiceRecording(null);
      toast.success('Time entry saved successfully');
    };

    return {
      handleVoiceRecordingComplete,
      handleVoicePlayback,
      handleVoiceEdit,
      handleVoiceDelete,
      handleConvertToTimeEntry,
      handleTimeEntrySave
    };
  }, [playingRecordingId, matters]);

  // Invoice Generation Handlers
  const handleGenerateInvoice = (matter: Matter, isProForma: boolean = false) => {
    setSelectedMatter(matter);
    setShowInvoiceModal(true);
  };

  const handleInvoiceGenerated = async () => {
    setShowInvoiceModal(false);
    setSelectedMatter(null);
    await loadMatterInvoices();
    toast.success('Invoice generated successfully');
  };

  const handleViewMatterInvoices = (matter: Matter) => {
    toast(`Viewing invoices for ${matter.title}`, { icon: 'ℹ️' });
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
    return matters.filter(matter => {
      const matchesSearch = matter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           matter.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           matter.instructing_attorney.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || matter.status === filterStatus;
      const matchesTab = activeTab === 'all' || 
                        (activeTab === 'active' && matter.status === MatterStatus.ACTIVE);
      return matchesSearch && matchesStatus && matchesTab;
    });
  }, [matters, searchTerm, filterStatus, activeTab]);

  const handleNewMatterClick = () => {
    setShowVoiceModal(false);
    setShowVoiceTimeEntryForm(false);
    setShowInvoiceModal(false);
    setShowNewMatterModal(true);
  };

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
          onClick={handleNewMatterClick}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
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
          availableMatters={matters}
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

      {/* New Matter Modal */}
      <NewMatterModal
        isOpen={showNewMatterModal}
        onClose={() => setShowNewMatterModal(false)}
        onMatterCreated={(newMatter) => {
          setMatters(prev => [newMatter, ...prev]);
          setShowNewMatterModal(false);
          toast.success(`Matter "${newMatter.title}" created successfully`);
        }}
      />
    </div>
  );
};

export default MattersPage;