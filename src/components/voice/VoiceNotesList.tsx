import React, { useState, useCallback } from 'react';
import { Play, Pause, Trash2, Edit3, FileText, Clock, Mic, AlertCircle } from 'lucide-react';
import { Card, CardContent, Button } from '../../design-system/components';
import type { VoiceRecording } from '../../types';

interface VoiceNotesListProps {
  recordings: VoiceRecording[];
  onPlayback: (recordingId: string) => void;
  onEdit: (recordingId: string) => void;
  onDelete: (recordingId: string) => void;
  onConvertToTimeEntry: (recordingId: string) => void;
  playingRecordingId?: string;
  className?: string;
}

export const VoiceNotesList: React.FC<VoiceNotesListProps> = ({
  recordings,
  onPlayback,
  onEdit,
  onDelete,
  onConvertToTimeEntry,
  playingRecordingId,
  className = ''
}) => {
  const [expandedRecording, setExpandedRecording] = useState<string | null>(null);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getStatusColor = (status: VoiceRecording['processingStatus']): string => {
    switch (status) {
      case 'completed':
        return 'text-status-success-600 bg-status-success-100';
      case 'processing':
        return 'text-status-warning-600 bg-status-warning-100';
      case 'error':
        return 'text-status-error-600 bg-status-error-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getStatusText = (status: VoiceRecording['processingStatus']): string => {
    switch (status) {
      case 'completed':
        return 'Processed';
      case 'processing':
        return 'Processing...';
      case 'error':
        return 'Error';
      default:
        return 'Pending';
    }
  };

  const toggleExpanded = useCallback((recordingId: string) => {
    setExpandedRecording(prev => prev === recordingId ? null : recordingId);
  }, []);

  const handleDelete = useCallback((recordingId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this voice recording?')) {
      onDelete(recordingId);
    }
  }, [onDelete]);

  if (recordings.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Mic className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">No voice recordings yet</h3>
        <p className="text-neutral-600">
          Start recording voice notes to capture your time entries on the go.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">
          Voice Recordings ({recordings.length})
        </h3>
      </div>

      <div className="space-y-3">
        {recordings.map((recording) => {
          const isExpanded = expandedRecording === recording.id;
          const isPlaying = playingRecordingId === recording.id;
          const canConvert = recording.processingStatus === 'completed' && recording.extractedData;

          return (
            <Card key={recording.id} hoverable className="transition-all duration-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header Row */}
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleExpanded(recording.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-neutral-500" />
                        <span className="font-medium text-neutral-900">
                          Voice Note
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Clock className="w-3 h-3" />
                        {formatDuration(recording.duration)}
                      </div>
                      
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(recording.processingStatus)}`}>
                        {getStatusText(recording.processingStatus)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      {formatDate(recording.createdAt)}
                    </div>
                  </div>

                  {/* Matter Association */}
                  {recording.matterId && (
                    <div className="text-sm text-neutral-600">
                      <span className="font-medium">Matter:</span> {recording.matterId}
                    </div>
                  )}

                  {/* Transcription Preview */}
                  {recording.transcription && (
                    <div className="text-sm text-neutral-700 bg-neutral-50 p-3 rounded-lg">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                        <p className={`${!isExpanded ? 'line-clamp-2' : ''}`}>
                          {recording.transcription}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Extracted Data Preview */}
                  {isExpanded && recording.extractedData && (
                    <div className="space-y-2 text-sm">
                      <h4 className="font-medium text-neutral-900">Extracted Information:</h4>
                      <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-3 rounded-lg">
                        {recording.extractedData.duration && (
                          <div>
                            <span className="text-neutral-600">Duration:</span>
                            <span className="ml-2 font-medium">{recording.extractedData.duration} minutes</span>
                          </div>
                        )}
                        {recording.extractedData.workType && (
                          <div>
                            <span className="text-neutral-600">Work Type:</span>
                            <span className="ml-2 font-medium">{recording.extractedData.workType}</span>
                          </div>
                        )}
                        {recording.extractedData.clientName && (
                          <div>
                            <span className="text-neutral-600">Client:</span>
                            <span className="ml-2 font-medium">{recording.extractedData.clientName}</span>
                          </div>
                        )}
                        {recording.extractedData.date && (
                          <div>
                            <span className="text-neutral-600">Date:</span>
                            <span className="ml-2 font-medium">
                              {new Date(recording.extractedData.date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {recording.extractedData.confidence && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-600">Confidence:</span>
                          <div className="flex-1 bg-neutral-200 rounded-full h-2">
                            <div 
                              className="bg-mpondo-gold-500 h-2 rounded-full"
                              style={{ width: `${recording.extractedData.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-neutral-600">
                            {Math.round(recording.extractedData.confidence * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Display */}
                  {recording.processingStatus === 'error' && (
                    <div className="flex items-center gap-2 text-sm text-status-error-600 bg-status-error-50 p-3 rounded-lg">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Failed to process recording. Please try again or contact support.</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                    <div className="flex items-center gap-2">
                      {/* Play/Pause Button */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayback(recording.id);
                        }}
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-3 h-3" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            Play
                          </>
                        )}
                      </Button>

                      {/* Edit Button */}
                      {recording.transcription && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(recording.id);
                          }}
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Convert to Time Entry */}
                      {canConvert && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onConvertToTimeEntry(recording.id);
                          }}
                          variant="primary"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <FileText className="w-3 h-3" />
                          Create Time Entry
                        </Button>
                      )}

                      {/* Delete Button */}
                      <Button
                        onClick={(e) => handleDelete(recording.id, e)}
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};