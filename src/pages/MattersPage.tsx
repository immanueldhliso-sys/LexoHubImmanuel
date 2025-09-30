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
  Calculator,
  Mic,
  Play,
  Square,
  Timer,
  HelpCircle,
  Zap,
  Search
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
  const [searchTerm, setSearchTerm] = useState('');
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
  const [isRecording, setIsRecording] = useState(false);
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
        setIsRecording(false);
        await voiceManagementService.processVoiceRecording(recording, matters);
        setVoiceRecordings(voiceManagementService.getVoiceRecordings());
        toast.success('Voice recording processed successfully');
      } catch (error) {
        toast.error('Failed to process voice recording');
      }
    };

    const handleVoicePlayback = (recordingId: string) => {
      if (playingRecordingId === recordingId) {
        setPlayingRecordingId(undefined);
      } else {
        setPlayingRecordingId(recordingId);
      }
    };

    const handleVoiceEdit = (recording: VoiceRecording) => {
      setSelectedVoiceRecording(recording);
      setShowVoiceTimeEntryForm(true);
    };

    const handleVoiceDelete = async (recordingId: string) => {
      try {
        await voiceManagementService.deleteVoiceRecording(recordingId);
        setVoiceRecordings(voiceManagementService.getVoiceRecordings());
        toast.success('Voice recording deleted');
      } catch (error) {
        toast.error('Failed to delete voice recording');
      }
    };

    const handleConvertToTimeEntry = (recording: VoiceRecording) => {
      setSelectedVoiceRecording(recording);
      setShowVoiceTimeEntryForm(true);
    };

    const handleTimeEntrySave = async (timeEntry: TimeEntry) => {
      try {
        // Save time entry logic here
        setShowVoiceTimeEntryForm(false);
        setSelectedVoiceRecording(null);
        toast.success('Time entry saved successfully');
      } catch (error) {
        toast.error('Failed to save time entry');
      }
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

  const handleInvoiceGenerated = (invoice: Invoice) => {
    if (selectedMatter) {
      setMatterInvoices(prev => ({
        ...prev,
        [selectedMatter.id]: [...(prev[selectedMatter.id] || []), invoice]
      }));
    }
    setShowInvoiceModal(false);
    setSelectedMatter(null);
    toast.success('Invoice generated successfully');
  };

  const getMatterFinancialSummary = (matter: Matter) => {
    const invoices = matterInvoices[matter.id] || [];
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const totalWIP = matter.wip_value || 0;
    
    return {
      totalInvoiced,
      totalWIP,
      totalValue: totalInvoiced + totalWIP
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

  const handleQuickVoiceRecord = () => {
    setIsRecording(true);
    setShowVoiceModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Matters</h1>
          <p className="text-neutral-600 mt-1">Manage your cases with intelligence and insight</p>
        </div>
        
        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="primary" 
            onClick={handleQuickVoiceRecord}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
            title="Start voice recording for time entry"
          >
            <Mic className="w-4 h-4" />
            <span>Quick Record</span>
            {isRecording && <div className="w-2 h-2 bg-white rounded-full animate-pulse ml-1" />}
          </Button>
          
          <Button 
            variant="secondary" 
            onClick={handleNewMatterClick}
            className="flex items-center space-x-2"
            title="Create a new matter"
          >
            <Plus className="w-4 h-4" />
            <span>New Matter</span>
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('voice')}
            className="flex items-center space-x-2"
            title="View all voice recordings"
          >
            <Timer className="w-4 h-4" />
            <span>Voice Notes ({voiceRecordings.length})</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      {activeTab !== 'voice' && (
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search matters, clients, or attorneys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
            />
          </div>
          
          {/* Help Tooltip */}
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <HelpCircle className="w-4 h-4" />
            <span>Tip: Use Quick Record for fast time entries</span>
          </div>
        </div>
      )}

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
        <div className="space-y-4">
          {/* Voice Notes Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900">Voice Recordings</h2>
            <Button 
              onClick={handleQuickVoiceRecord}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Record New
            </Button>
          </div>
          
          <VoiceNotesList
            recordings={voiceRecordings}
            onPlayback={voiceHandlers.handleVoicePlayback}
            onEdit={voiceHandlers.handleVoiceEdit}
            onDelete={voiceHandlers.handleVoiceDelete}
            onConvertToTimeEntry={voiceHandlers.handleConvertToTimeEntry}
            playingRecordingId={playingRecordingId}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {loadingMatters ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mpondo-gold-500 mx-auto mb-4"></div>
                <p className="text-neutral-600">Loading matters...</p>
              </CardContent>
            </Card>
          ) : filteredMatters.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Briefcase className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No Matters Found</h3>
                <p className="text-neutral-600 mb-4">
                  {activeTab === 'active' ? 'No active matters' : 'No matters match your criteria'}
                </p>
                <Button onClick={handleNewMatterClick} variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Matter
                </Button>
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
                            matter.status === MatterStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                            matter.status === MatterStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                            matter.status === MatterStatus.SETTLED ? 'bg-blue-100 text-blue-800' :
                            'bg-neutral-100 text-neutral-800'
                          }`}>
                            {matter.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-neutral-600">Client:</span>
                            <span className="ml-2 font-medium text-neutral-900">{matter.client_name}</span>
                          </div>
                          <div>
                            <span className="text-neutral-600">Attorney:</span>
                            <span className="ml-2 font-medium text-neutral-900">{matter.instructing_attorney}</span>
                          </div>
                          <div>
                            <span className="text-neutral-600">Type:</span>
                            <span className="ml-2 font-medium text-neutral-900">{matter.brief_type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Financial Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-neutral-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-neutral-900">
                          R{financialSummary.totalWIP.toLocaleString()}
                        </div>
                        <div className="text-xs text-neutral-600">WIP Value</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-neutral-900">
                          R{financialSummary.totalInvoiced.toLocaleString()}
                        </div>
                        <div className="text-xs text-neutral-600">Invoiced</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-mpondo-gold-600">
                          R{financialSummary.totalValue.toLocaleString()}
                        </div>
                        <div className="text-xs text-neutral-600">Total Value</div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedMatter(matter);
                          setShowVoiceModal(true);
                        }}
                        className="flex items-center gap-2"
                        title="Record time for this matter"
                      >
                        <Mic className="w-4 h-4" />
                        Record Time
                      </Button>
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleGenerateInvoice(matter)}
                        className="flex items-center gap-2"
                        title="Generate invoice for this matter"
                      >
                        <Calculator className="w-4 h-4" />
                        Invoice
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Navigate to matter details
                          toast.info('Matter details view coming soon');
                        }}
                        className="flex items-center gap-2"
                        title="View matter details"
                      >
                        <Eye className="w-4 h-4" />
                        Details
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
        onClose={() => {
          setShowVoiceModal(false);
          setIsRecording(false);
          setSelectedMatter(null);
        }}
        onRecordingComplete={(recording) => {
          voiceHandlers.handleVoiceRecordingComplete(recording);
          setShowVoiceModal(false);
          setSelectedMatter(null);
        }}
        selectedMatter={selectedMatter}
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