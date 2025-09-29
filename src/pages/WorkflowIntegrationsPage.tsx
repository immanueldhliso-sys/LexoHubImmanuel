import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Gavel, 
  Mic, 
  Settings, 
  RefreshCw, 
  Plus,
  Search,
  Filter,
  Globe,
  Sync,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Button, Card, CardHeader, CardContent } from '../design-system/components';
import { WorkflowIntegrationsService } from '../services/api/workflow-integrations.service';
import type { 
  WorkflowPage, 
  CourtDiaryEntry, 
  CourtRegistry, 
  Judge, 
  JudgeAnalytics,
  VoiceQuery,
  CourtIntegrationLog 
} from '../types';
import { toast } from 'react-hot-toast';
import { format, isToday, isTomorrow, addDays } from 'date-fns';

// Component imports will be created below
import { CourtDiaryCard } from '../components/workflow/CourtDiaryCard';
import { JudgeAnalyticsCard } from '../components/workflow/JudgeAnalyticsCard';
import { VoiceAssistantPanel } from '../components/workflow/VoiceAssistantPanel';
import { IntegrationsPanel } from '../components/workflow/IntegrationsPanel';
import { useAuth } from '@/contexts/AuthContext';

const WorkflowIntegrationsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<WorkflowPage>('court-diary');
  const [loading, setLoading] = useState(false);
  
  // Court Diary State
  const [diaryEntries, setDiaryEntries] = useState<CourtDiaryEntry[]>([]);
  const [courtRegistries, setCourtRegistries] = useState<CourtRegistry[]>([]);
  
  // Judge Analytics State
  const [judges, setJudges] = useState<Judge[]>([]);
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);
  const [judgeAnalytics, setJudgeAnalytics] = useState<JudgeAnalytics | null>(null);
  
  // Voice Assistant State
  const [voiceQueries, setVoiceQueries] = useState<VoiceQuery[]>([]);
  const [isListening, setIsListening] = useState(false);
  
  // Integrations State
  const [integrationLogs, setIntegrationLogs] = useState<CourtIntegrationLog[]>([]);
  
  // Load data based on active tab
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'court-diary':
          await loadCourtDiary();
          break;
        case 'judge-analytics':
          await loadJudgeAnalytics();
          break;
        case 'voice-assistant':
          await loadVoiceQueries();
          break;
        case 'integrations':
          await loadIntegrations();
          break;
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCourtDiary = async () => {
    if (!user?.id) {
      toast.error('You must be signed in to load court diary');
      return;
    }
    const [entries, registries] = await Promise.all([
      WorkflowIntegrationsService.getCourtDiary(user?.id || ''),
      WorkflowIntegrationsService.getCourtRegistries()
    ]);
    setDiaryEntries(entries);
    setCourtRegistries(registries);
  };

  const loadJudgeAnalytics = async () => {
    const judgesData = await WorkflowIntegrationsService.getJudges();
    setJudges(judgesData);
    if (judgesData.length > 0 && !selectedJudge) {
      setSelectedJudge(judgesData[0]);
    }
  };

  const loadVoiceQueries = async () => {
    if (!user?.id) {
      toast.error('You must be signed in to load voice history');
      return;
    }
    const queries = await WorkflowIntegrationsService.getVoiceQueryHistory(user.id);
    setVoiceQueries(queries);
  };

  const loadIntegrations = async () => {
    const logs = await WorkflowIntegrationsService.getIntegrationLogs();
    setIntegrationLogs(logs);
  };

  const syncCourtDiary = async (registryId: string) => {
    try {
      setLoading(true);
      if (!user?.id) {
        toast.error('You must be signed in to sync court diary');
        return;
      }
      await WorkflowIntegrationsService.syncCourtDiary(registryId, user?.id || '');
      toast.success('Court diary synced successfully');
      await loadCourtDiary();
    } catch (error) {
      toast.error('Failed to sync court diary');
    } finally {
      setLoading(false);
    }
  };

  const processVoiceQuery = async (queryText: string, languageCode: string = 'en') => {
    try {
      if (!user?.id) {
        toast.error('You must be signed in to use voice assistant');
        return;
      }
      const result = await WorkflowIntegrationsService.processVoiceQuery(
        user?.id || '',
        queryText,
        languageCode
      );
      
      toast.success(result.response);
      await loadVoiceQueries();
      
      // Execute actions based on response
      if (result.actions?.action) {
        handleVoiceAction(result.actions);
      }
    } catch (error) {
      toast.error('Failed to process voice query');
    }
  };

  const handleVoiceAction = (actions: any) => {
    switch (actions.action) {
      case 'show_court_diary':
        setActiveTab('court-diary');
        break;
      case 'show_matters':
        // Navigate to matters page (would need to be implemented in parent)
        break;
      case 'show_invoices':
        // Navigate to invoices page
        break;
      case 'show_help':
        // Show help modal
        break;
    }
  };

  const tabs = [
    { id: 'court-diary' as WorkflowPage, label: 'Court Diary', icon: Calendar },
    { id: 'judge-analytics' as WorkflowPage, label: 'Judge Analytics', icon: Gavel },
    { id: 'voice-assistant' as WorkflowPage, label: 'Voice Assistant', icon: Mic },
    { id: 'integrations' as WorkflowPage, label: 'Integrations', icon: Settings }
  ];

  const getUpcomingHearings = () => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    
    return diaryEntries.filter(entry => {
      const hearingDate = new Date(entry.hearingDate);
      return hearingDate >= today && hearingDate <= nextWeek;
    }).sort((a, b) => new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime());
  };

  const getHearingDateLabel = (date: string) => {
    const hearingDate = new Date(date);
    if (isToday(hearingDate)) return 'Today';
    if (isTomorrow(hearingDate)) return 'Tomorrow';
    return format(hearingDate, 'EEE, dd MMM');
  };

  const renderCourtDiary = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">Court Diary</h2>
          <p className="text-neutral-600">Manage your court appearances and hearings</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => syncCourtDiary(courtRegistries[0]?.id)}
            disabled={loading || courtRegistries.length === 0}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync Diary
          </Button>
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Today</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {diaryEntries.filter(e => isToday(new Date(e.hearingDate))).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-mpondo-gold-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">This Week</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {getUpcomingHearings().length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-judicial-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Synced</p>
                <p className="text-2xl font-bold text-success-600">
                  {diaryEntries.filter(e => e.syncStatus === 'synced').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-success-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Pending</p>
                <p className="text-2xl font-bold text-warning-600">
                  {diaryEntries.filter(e => e.syncStatus === 'pending').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-warning-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Hearings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-900">Upcoming Hearings</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getUpcomingHearings().length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-600">No upcoming hearings</p>
              </div>
            ) : (
              getUpcomingHearings().map(entry => (
                <CourtDiaryCard key={entry.id} entry={entry} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderJudgeAnalytics = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">Judge Analytics</h2>
          <p className="text-neutral-600">Insights into judicial patterns and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedJudge?.id || ''}
            onChange={(e) => {
              const judge = judges.find(j => j.id === e.target.value);
              setSelectedJudge(judge || null);
            }}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500"
          >
            <option value="">Select Judge</option>
            {judges.map(judge => (
              <option key={judge.id} value={judge.id}>
                {judge.name} - {judge.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedJudge && (
        <JudgeAnalyticsCard 
          judge={selectedJudge} 
          analytics={judgeAnalytics}
          onLoadAnalytics={async (judgeId, periodMonths) => {
            const analytics = await WorkflowIntegrationsService.getJudgeAnalytics(judgeId, periodMonths);
            setJudgeAnalytics(analytics);
          }}
        />
      )}
    </div>
  );

  const renderVoiceAssistant = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900">Voice Assistant</h2>
        <p className="text-neutral-600">Query your practice data using natural language</p>
      </div>

      <VoiceAssistantPanel
        isListening={isListening}
        onStartListening={() => setIsListening(true)}
        onStopListening={() => setIsListening(false)}
        onProcessQuery={processVoiceQuery}
        queryHistory={voiceQueries}
      />
    </div>
  );

  const renderIntegrations = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">Integrations</h2>
          <p className="text-neutral-600">Manage external system connections</p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </Button>
      </div>

      <IntegrationsPanel
        courtRegistries={courtRegistries}
        integrationLogs={integrationLogs}
        onSync={syncCourtDiary}
        loading={loading}
      />
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'court-diary':
        return renderCourtDiary();
      case 'judge-analytics':
        return renderJudgeAnalytics();
      case 'voice-assistant':
        return renderVoiceAssistant();
      case 'integrations':
        return renderIntegrations();
      default:
        return renderCourtDiary();
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-mpondo-gold-500 text-mpondo-gold-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default WorkflowIntegrationsPage;