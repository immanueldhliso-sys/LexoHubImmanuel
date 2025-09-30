import React, { useState, useEffect } from 'react';
import { X, Zap, FileText, Clock, DollarSign } from 'lucide-react';
import { DocumentIntelligenceService } from '../../services/api/document-intelligence.service';
import { matterApiService } from '../../services/api/matter-api.service';
import { TimeEntryService } from '../../services/api/time-entries.service';
import { useAuth } from '../../contexts/AuthContext';
import type { Matter, TimeEntry } from '../../types';
import { toast } from 'react-hot-toast';

interface FeeNarrativeGeneratorModalProps {
  onClose: () => void;
}

export const FeeNarrativeGeneratorModal: React.FC<FeeNarrativeGeneratorModalProps> = ({ onClose }) => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [matters, setMatters] = useState<Matter[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [selectedMatter, setSelectedMatter] = useState('');
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [includeValueProps, setIncludeValueProps] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [narrative, setNarrative] = useState('');

  // Load matters for current advocate
  useEffect(() => {
    const loadMatters = async () => {
      try {
        if (authLoading || !isAuthenticated || !user?.id) return;
        const { data } = await matterApiService.getByAdvocate(user.id, {
          filters: { status: ['active', 'pending'] },
        });
        setMatters(data || []);
      } catch (error) {
        console.error('Failed to load matters', error);
        toast.error('Failed to load matters');
      }
    };
    loadMatters();
  }, [authLoading, isAuthenticated, user?.id]);

  // Load unbilled, billable time entries for selected matter
  useEffect(() => {
    const loadEntries = async () => {
      try {
        if (!selectedMatter) {
          setTimeEntries([]);
          setSelectedEntries([]);
          return;
        }
        const entries = await TimeEntryService.getUnbilledTimeEntries(selectedMatter);
        setTimeEntries(entries || []);
        setSelectedEntries([]);
      } catch (error) {
        console.error('Failed to load time entries', error);
        toast.error('Failed to load time entries');
      }
    };
    loadEntries();
  }, [selectedMatter]);
  const totalHours = selectedEntries.reduce((sum, entryId) => {
    const entry = timeEntries.find(e => e.id === entryId);
    return sum + (entry ? (entry.duration_minutes || 0) / 60 : 0);
  }, 0);

  const totalAmount = selectedEntries.reduce((sum, entryId) => {
    const entry = timeEntries.find(e => e.id === entryId);
    return sum + (entry ? (entry.amount || 0) : 0);
  }, 0);

  const handleSelectAll = () => {
    if (selectedEntries.length === timeEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(timeEntries.map(e => e.id));
    }
  };

  const handleEntryToggle = (entryId: string) => {
    setSelectedEntries(prev =>
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleGenerate = async () => {
    if (!selectedMatter) {
      toast.error('Please select a matter');
      return;
    }

    if (selectedEntries.length === 0) {
      toast.error('Please select at least one time entry');
      return;
    }

    setGenerating(true);
    try {
      const result = await DocumentIntelligenceService.generateFeeNarrative({
        matterId: selectedMatter,
        timeEntryIds: selectedEntries,
        includeValuePropositions: includeValueProps
      });

      setNarrative(result.narrativeText);
      toast.success('Fee narrative generated successfully!');
    } catch (error) {
      console.error('Error generating narrative:', error);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(narrative);
    toast.success('Narrative copied to clipboard');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">AI Fee Narrative Generator</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!narrative ? (
            <div className="p-6 space-y-6">
              {/* Matter Selection */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Select Matter
                </label>
                <select
                  value={selectedMatter}
                  onChange={(e) => setSelectedMatter(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                >
                  <option value="">Choose a matter...</option>
                  {matters.map(matter => (
                    <option key={matter.id} value={matter.id}>
                      {matter.title} - {matter.client_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Entries Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-neutral-700">
                    Select Time Entries
                  </label>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-mpondo-gold-600 hover:text-mpondo-gold-700"
                  >
                    {selectedEntries.length === timeEntries.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                <div className="border border-neutral-300 rounded-lg divide-y divide-neutral-200">
                  {timeEntries.map(entry => (
                    <label
                      key={entry.id}
                      className="flex items-center gap-3 p-3 hover:bg-neutral-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEntries.includes(entry.id)}
                        onChange={() => handleEntryToggle(entry.id)}
                        className="rounded border-neutral-300 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">{entry.description}</p>
                        <div className="flex items-center gap-4 text-sm text-neutral-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {((entry.duration_minutes || 0) / 60).toFixed(1)}h
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            R{(entry.amount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Summary */}
              {selectedEntries.length > 0 && (
                <div className="bg-neutral-50 rounded-lg p-4">
                  <h3 className="font-medium text-neutral-900 mb-2">Selection Summary</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-neutral-600">Entries Selected</p>
                      <p className="font-medium text-neutral-900">{selectedEntries.length}</p>
                    </div>
                    <div>
                      <p className="text-neutral-600">Total Hours</p>
                      <p className="font-medium text-neutral-900">{totalHours.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-neutral-600">Total Amount</p>
                      <p className="font-medium text-neutral-900">R{totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Options */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeValueProps}
                    onChange={(e) => setIncludeValueProps(e.target.checked)}
                    className="rounded border-neutral-300 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                  />
                  <span className="text-sm text-neutral-700">
                    Include value propositions and benefits achieved
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900">Generated Fee Narrative</h3>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 text-sm bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200 transition-colors"
                >
                  Copy to Clipboard
                </button>
              </div>
              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                <pre className="whitespace-pre-wrap text-sm text-neutral-900 font-mono">
                  {narrative}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              {narrative ? 'Close' : 'Cancel'}
            </button>
            {!narrative && (
              <button
                onClick={handleGenerate}
                disabled={!selectedMatter || selectedEntries.length === 0 || generating}
                className="flex-1 px-4 py-2 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Generate Narrative
                  </>
                )}
              </button>
            )}
            {narrative && (
              <button
                onClick={() => setNarrative('')}
                className="flex-1 px-4 py-2 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700 transition-colors"
              >
                Generate New
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
