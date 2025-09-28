import React, { useState } from 'react';
import { Briefcase, DollarSign, TrendingUp, AlertTriangle, X, Mic } from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../design-system/components';
import { VoiceRecordingModal, VoiceNotesList, VoiceTimeEntryForm } from '../components/voice';
import { voiceManagementService } from '../services/voice-management.service';
import type { Matter, VoiceRecording, TimeEntry } from '../types';
import { MatterStatus, Bar } from '../types';

const MattersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'all' | 'analytics' | 'voice'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<MatterStatus | 'all'>('all');
  const [showNewMatterModal, setShowNewMatterModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showVoiceTimeEntryForm, setShowVoiceTimeEntryForm] = useState(false);
  const [selectedVoiceRecording, setSelectedVoiceRecording] = useState<VoiceRecording | null>(null);
  const [voiceRecordings, setVoiceRecordings] = useState<VoiceRecording[]>([]);
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);

  // Mock data - in real app this would come from API
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
      status: MatterStatus.ACTIVE,
      dateCreated: '2024-01-15T10:00:00Z',
      dateModified: '2024-01-20T14:30:00Z',
      bar: Bar.JOHANNESBURG,
      briefType: 'Commercial Litigation',
      description: 'Contract dispute regarding supply agreement breach',
      conflictCheckCompleted: true,
      conflictCheckDate: '2024-01-14T09:00:00Z',
      riskLevel: 'Medium',
      settlementProbability: 72
    },
    {
      id: '2',
      title: 'XYZ Mining Rights Appeal',
      clientName: 'XYZ Mining Ltd',
      instructingAttorney: 'Sarah Johnson',
      instructingFirm: 'Johnson Legal',
      wipValue: 85000,
      estimatedFee: 150000,
      actualFee: 0,
      status: MatterStatus.ACTIVE,
      dateCreated: '2024-01-10T08:00:00Z',
      dateModified: '2024-01-18T16:45:00Z',
      bar: Bar.CAPE_TOWN,
      briefType: 'Mining Law',
      description: 'Appeal against mining rights decision',
      conflictCheckCompleted: true,
      conflictCheckDate: '2024-01-09T11:00:00Z',
      riskLevel: 'High',
      settlementProbability: 45
    },
    {
      id: '3',
      title: 'Employment Dispute - Unfair Dismissal',
      clientName: 'Tech Solutions Inc',
      instructingAttorney: 'Michael Brown',
      instructingFirm: 'Brown & Partners',
      wipValue: 45000,
      estimatedFee: 80000,
      actualFee: 75000,
      status: MatterStatus.SETTLED,
      dateCreated: '2023-11-20T09:30:00Z',
      dateModified: '2024-01-05T12:00:00Z',
      dateClosed: '2024-01-05T12:00:00Z',
      bar: Bar.JOHANNESBURG,
      briefType: 'Employment Law',
      description: 'Unfair dismissal claim by senior executive',
      conflictCheckCompleted: true,
      conflictCheckDate: '2023-11-19T14:00:00Z',
      riskLevel: 'Low',
      settlementProbability: 85
    }
  ];

  const filteredMatters = mockMatters.filter(matter => {
    const matchesSearch = matter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         matter.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         matter.instructingAttorney.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || matter.status === filterStatus;
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'active' && matter.status === MatterStatus.ACTIVE);
    return matchesSearch && matchesStatus && matchesTab;
  });

  const totalWIP = mockMatters.reduce((sum, matter) => sum + matter.wipValue, 0);
  const activeMatters = mockMatters.filter(m => m.status === MatterStatus.ACTIVE).length;
  const avgSettlementProb = mockMatters.reduce((sum, matter) => sum + (matter.settlementProbability || 0), 0) / mockMatters.length;

  const MatterCard: React.FC<{ matter: Matter }> = ({ matter }) => (
    <Card hoverable className="mb-4">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">{matter.title}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-600">Client:</span>
                <span className="ml-2 font-medium text-neutral-900">{matter.clientName}</span>
              </div>
              <div>
                <span className="text-neutral-600">Attorney:</span>
                <span className="ml-2 font-medium text-neutral-900">{matter.instructingAttorney}</span>
              </div>
              <div>
                <span className="text-neutral-600">Type:</span>
                <span className="ml-2 font-medium text-neutral-900">{matter.briefType}</span>
              </div>
              <div>
                <span className="text-neutral-600">Bar:</span>
                <span className="ml-2 font-medium text-neutral-900">{matter.bar}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`badge ${
              matter.status === MatterStatus.ACTIVE ? 'badge-success' :
              matter.status === MatterStatus.PENDING ? 'badge-warning' :
              matter.status === MatterStatus.SETTLED ? 'badge-success' :
              'badge-error'
            }`}>
              {matter.status}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${
              matter.riskLevel === 'Low' ? 'bg-status-success-100 text-status-success-700' :
              matter.riskLevel === 'Medium' ? 'bg-status-warning-100 text-status-warning-700' :
              'bg-status-error-100 text-status-error-700'
            }`}>
              {matter.riskLevel} Risk
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-neutral-50 rounded-lg">
            <div className="text-lg font-bold text-neutral-900">
              R{(matter.wipValue / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-neutral-600">WIP Value</div>
          </div>
          <div className="text-center p-3 bg-neutral-50 rounded-lg">
            <div className="text-lg font-bold text-neutral-900">
              R{((matter.estimatedFee || 0) / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-neutral-600">Est. Fee</div>
          </div>
          <div className="text-center p-3 bg-neutral-50 rounded-lg">
            <div className="text-lg font-bold text-neutral-900">
              {matter.settlementProbability || 0}%
            </div>
            <div className="text-xs text-neutral-600">Settlement Prob.</div>
          </div>
        </div>

        {matter.description && (
          <p className="text-sm text-neutral-600 mb-4">{matter.description}</p>
        )}

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4 text-xs text-neutral-500">
            <span>Created: {new Date(matter.dateCreated).toLocaleDateString()}</span>
            <span>Modified: {new Date(matter.dateModified).toLocaleDateString()}</span>
            {matter.conflictCheckCompleted && (
              <span className="text-status-success-600">✓ Conflict Check</span>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              View Details
            </Button>
            <Button variant="primary" size="sm">
              Add Time
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-mpondo-gold-500 mb-2">
              <Briefcase className="w-8 h-8 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900">{activeMatters}</h3>
            <p className="text-sm text-neutral-600">Active Matters</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-judicial-blue-500 mb-2">
              <DollarSign className="w-8 h-8 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900">
              R{(totalWIP / 1000000).toFixed(1)}M
            </h3>
            <p className="text-sm text-neutral-600">Total WIP</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-status-success-500 mb-2">
              <TrendingUp className="w-8 h-8 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900">{avgSettlementProb.toFixed(0)}%</h3>
            <p className="text-sm text-neutral-600">Avg Settlement Prob.</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-status-warning-500 mb-2">
              <AlertTriangle className="w-8 h-8 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900">
              {mockMatters.filter(m => m.riskLevel === 'High').length}
            </h3>
            <p className="text-sm text-neutral-600">High Risk Matters</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
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

        <div className="flex space-x-4">
          {activeTab !== 'voice' && (
            <>
              <input
                type="text"
                placeholder="Search matters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as MatterStatus | 'all')}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value={MatterStatus.ACTIVE}>Active</option>
                <option value={MatterStatus.PENDING}>Pending</option>
                <option value={MatterStatus.SETTLED}>Settled</option>
                <option value={MatterStatus.CLOSED}>Closed</option>
              </select>
            </>
          )}
          
          {/* Voice Recording Button */}
          <Button
            onClick={() => setShowVoiceModal(true)}
            variant="primary"
            className="flex items-center space-x-2"
          >
            <Mic className="w-4 h-4" />
            <span>Voice Note</span>
          </Button>
        </div>
      </div>

      {/* Voice Recording Handlers */}
      {React.useEffect(() => {
        // Load existing voice recordings
        setVoiceRecordings(voiceManagementService.getVoiceRecordings());
      }, [])}

      {/* Voice Recording Event Handlers */}
      {React.useMemo(() => {
        const handleVoiceRecordingComplete = async (recording: VoiceRecording) => {
          try {
            // Process the recording
            const processedRecording = await voiceManagementService.processVoiceRecording(
              recording, 
              mockMatters
            );
            
            // Update the recordings list
            setVoiceRecordings(voiceManagementService.getVoiceRecordings());
            
            // Show success message
            console.log('Voice recording processed successfully');
          } catch (error) {
            console.error('Failed to process voice recording:', error);
          }
        };

        const handleVoicePlayback = async (recordingId: string) => {
          try {
            if (playingRecordingId === recordingId) {
              voiceManagementService.stopPlayback();
              setPlayingRecordingId(null);
            } else {
              await voiceManagementService.playVoiceRecording(recordingId);
              setPlayingRecordingId(recordingId);
            }
          } catch (error) {
            console.error('Playback failed:', error);
          }
        };

        const handleVoiceEdit = (recordingId: string) => {
          // For now, just log - in full implementation this would open an edit modal
          console.log('Edit recording:', recordingId);
        };

        const handleVoiceDelete = (recordingId: string) => {
          voiceManagementService.deleteVoiceRecording(recordingId);
          setVoiceRecordings(voiceManagementService.getVoiceRecordings());
          if (playingRecordingId === recordingId) {
            setPlayingRecordingId(null);
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
          // In full implementation, this would save to the database
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
      }, [playingRecordingId, mockMatters])}

      {/* Content */}
      {activeTab === 'voice' ? (
        <VoiceNotesList
          recordings={voiceRecordings}
          onPlayback={(recordingId) => {
            if (playingRecordingId === recordingId) {
              voiceManagementService.stopPlayback();
              setPlayingRecordingId(null);
            } else {
              voiceManagementService.playVoiceRecording(recordingId).then(() => {
                setPlayingRecordingId(recordingId);
              }).catch(console.error);
            }
          }}
          onEdit={(recordingId) => console.log('Edit recording:', recordingId)}
          onDelete={(recordingId) => {
            voiceManagementService.deleteVoiceRecording(recordingId);
            setVoiceRecordings(voiceManagementService.getVoiceRecordings());
            if (playingRecordingId === recordingId) {
              setPlayingRecordingId(null);
            }
          }}
          onConvertToTimeEntry={(recordingId) => {
            const recording = voiceManagementService.getVoiceRecording(recordingId);
            if (recording) {
              setSelectedVoiceRecording(recording);
              setShowVoiceTimeEntryForm(true);
            }
          }}
          playingRecordingId={playingRecordingId}
        />
      ) : activeTab === 'analytics' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-neutral-900">Settlement Probability Analysis</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockMatters.filter(m => m.status === MatterStatus.ACTIVE).map(matter => (
                  <div key={matter.id} className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-neutral-900">{matter.title}</h4>
                      <p className="text-sm text-neutral-600">{matter.briefType}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-neutral-900">
                        {matter.settlementProbability}%
                      </div>
                      <div className={`text-xs ${
                        (matter.settlementProbability || 0) > 70 ? 'text-status-success-600' :
                        (matter.settlementProbability || 0) > 40 ? 'text-status-warning-600' :
                        'text-status-error-600'
                      }`}>
                        {(matter.settlementProbability || 0) > 70 ? 'High' :
                         (matter.settlementProbability || 0) > 40 ? 'Medium' : 'Low'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-neutral-900">WIP vs Estimated Fees</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockMatters.filter(m => m.status === MatterStatus.ACTIVE).map(matter => {
                  const wipPercentage = ((matter.wipValue / (matter.estimatedFee || 1)) * 100);
                  return (
                    <div key={matter.id} className="p-3 bg-neutral-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-neutral-900">{matter.title}</h4>
                        <span className="text-sm text-neutral-600">{wipPercentage.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            wipPercentage > 80 ? 'bg-status-error-500' :
                            wipPercentage > 60 ? 'bg-status-warning-500' :
                            'bg-status-success-500'
                          }`}
                          style={{ width: `${Math.min(wipPercentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-neutral-600 mt-1">
                        <span>WIP: R{(matter.wipValue / 1000).toFixed(0)}k</span>
                        <span>Est: R{((matter.estimatedFee || 0) / 1000).toFixed(0)}k</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div>
          {filteredMatters.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Briefcase className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No matters found</h3>
                <p className="text-neutral-600 mb-4">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first matter'
                  }
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <Button variant="primary" onClick={() => setShowNewMatterModal(true)}>
                    Create New Matter
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div>
              {filteredMatters.map(matter => (
                <MatterCard key={matter.id} matter={matter} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Matter Modal Placeholder */}
      {showNewMatterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-neutral-900">New Matter</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowNewMatterModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 text-center py-8">
                New matter creation form coming soon...
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Voice Recording Modal */}
      <VoiceRecordingModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onRecordingComplete={async (recording) => {
          try {
            const processedRecording = await voiceManagementService.processVoiceRecording(
              recording, 
              mockMatters
            );
            setVoiceRecordings(voiceManagementService.getVoiceRecordings());
          } catch (error) {
            console.error('Failed to process voice recording:', error);
          }
        }}
      />

      {/* Voice Time Entry Form */}
      {selectedVoiceRecording && selectedVoiceRecording.extractedData && (
        <VoiceTimeEntryForm
          isOpen={showVoiceTimeEntryForm}
          recording={selectedVoiceRecording}
          extractedData={selectedVoiceRecording.extractedData}
          availableMatters={mockMatters}
          onSave={(timeEntry) => {
            console.log('Saving time entry:', timeEntry);
            setShowVoiceTimeEntryForm(false);
            setSelectedVoiceRecording(null);
          }}
          onCancel={() => {
            setShowVoiceTimeEntryForm(false);
            setSelectedVoiceRecording(null);
          }}
        />
      )}
    </div>
  );
};

export default MattersPage;