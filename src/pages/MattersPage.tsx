import React, { useState, useMemo } from 'react';
import { Briefcase } from 'lucide-react';
import { Card, CardContent, Button } from '../design-system/components';
import { VoiceRecordingModal, VoiceNotesList, VoiceTimeEntryForm } from '../components/voice';
import { voiceManagementService } from '../services/voice-management.service';
import type { Matter, VoiceRecording, TimeEntry } from '../types';
import { MatterStatus, BarAssociation, FeeType, RiskLevel } from '../types';

const MattersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'all' | 'analytics' | 'voice'>('active');
  const [searchTerm] = useState('');
  const [filterStatus] = useState<MatterStatus | 'all'>('all');
  const [showNewMatterModal, setShowNewMatterModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showVoiceTimeEntryForm, setShowVoiceTimeEntryForm] = useState(false);
  const [selectedVoiceRecording, setSelectedVoiceRecording] = useState<VoiceRecording | null>(null);
  const [voiceRecordings, setVoiceRecordings] = useState<VoiceRecording[]>([]);
  const [playingRecordingId, setPlayingRecordingId] = useState<string | undefined>(undefined);

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

  // Load existing voice recordings on component mount
  React.useEffect(() => {
    setVoiceRecordings(voiceManagementService.getVoiceRecordings());
  }, []);

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
            filteredMatters.map((matter) => (
              <Card key={matter.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900">{matter.title}</h3>
                      <p className="text-sm text-neutral-600">
                        Client: {matter.client_name} • Attorney: {matter.instructing_attorney}
                      </p>
                      <p className="text-sm text-neutral-500 mt-1">
                        WIP: R{matter.wip_value.toLocaleString()} • Risk: {matter.risk_level}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        matter.status === MatterStatus.ACTIVE 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {matter.status}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
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