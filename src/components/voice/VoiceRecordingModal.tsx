import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Play, Pause, Square, X, AlertCircle, Clock, Volume2 } from 'lucide-react';
import { Modal, ModalBody, ModalFooter, Button } from '../../design-system/components';
import { AudioRecordingService } from '../../services/audio-recording.service';
import type { VoiceRecording, VoiceRecordingState, ExtractedTimeEntryData } from '../../types';

interface VoiceRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordingComplete: (recording: VoiceRecording) => void;
  matterId?: string;
  className?: string;
}

export const VoiceRecordingModal: React.FC<VoiceRecordingModalProps> = ({
  isOpen,
  onClose,
  onRecordingComplete,
  matterId,
  className = ''
}) => {
  const [recordingState, setRecordingState] = useState<VoiceRecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0
  });
  
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const audioServiceRef = useRef<AudioRecordingService | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio service
  useEffect(() => {
    if (isOpen && !audioServiceRef.current) {
      audioServiceRef.current = new AudioRecordingService();
    }
    
    return () => {
      cleanup();
    };
  }, [isOpen]);

  // Check browser support
  useEffect(() => {
    if (isOpen && !AudioRecordingService.isSupported()) {
      setError('Voice recording is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari.');
    }
  }, [isOpen]);

  const cleanup = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
    
    if (audioServiceRef.current) {
      audioServiceRef.current.cleanup();
      audioServiceRef.current = null;
    }
    
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      if (!audioServiceRef.current) {
        audioServiceRef.current = new AudioRecordingService();
      }
      
      await audioServiceRef.current.startRecording();
      
      setRecordingState(prev => ({ ...prev, isRecording: true, isPaused: false }));
      
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        if (audioServiceRef.current) {
          const duration = audioServiceRef.current.getRecordingDuration();
          setRecordingState(prev => ({ ...prev, duration }));
        }
      }, 100);
      
      // Start audio level monitoring
      audioLevelIntervalRef.current = setInterval(() => {
        if (audioServiceRef.current) {
          const audioLevel = audioServiceRef.current.getAudioLevel();
          setRecordingState(prev => ({ ...prev, audioLevel }));
        }
      }, 50);
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (audioServiceRef.current) {
      audioServiceRef.current.pauseRecording();
      setRecordingState(prev => ({ ...prev, isPaused: true }));
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (audioServiceRef.current) {
      audioServiceRef.current.resumeRecording();
      setRecordingState(prev => ({ ...prev, isPaused: false }));
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      if (!audioServiceRef.current) return;
      
      const blob = await audioServiceRef.current.stopRecording();
      setAudioBlob(blob);
      
      // Clear intervals
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
        audioLevelIntervalRef.current = null;
      }
      
      setRecordingState(prev => ({ 
        ...prev, 
        isRecording: false, 
        isPaused: false,
        audioLevel: 0
      }));
      
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setError('Failed to stop recording');
    }
  }, []);

  const playRecording = useCallback(() => {
    if (!audioBlob) return;
    
    try {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        setError('Failed to play recording');
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
      setIsPlaying(true);
      
    } catch (err) {
      console.error('Failed to play recording:', err);
      setError('Failed to play recording');
    }
  }, [audioBlob]);

  const stopPlayback = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const saveRecording = useCallback(async () => {
    if (!audioBlob) return;
    
    try {
      setIsProcessing(true);
      
      // Create voice recording object
      const recording: VoiceRecording = {
        id: crypto.randomUUID(),
        userId: 'current-user', // This should come from auth context
        matterId,
        audioBlob,
        duration: recordingState.duration,
        processingStatus: 'pending',
        createdAt: new Date().toISOString()
      };
      
      onRecordingComplete(recording);
      handleClose();
      
    } catch (err) {
      console.error('Failed to save recording:', err);
      setError('Failed to save recording');
    } finally {
      setIsProcessing(false);
    }
  }, [audioBlob, recordingState.duration, matterId, onRecordingComplete]);

  const handleClose = useCallback(() => {
    cleanup();
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioLevel: 0
    });
    setAudioBlob(null);
    setIsPlaying(false);
    setError(null);
    setIsProcessing(false);
    onClose();
  }, [cleanup, onClose]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecordingStatusText = (): string => {
    if (recordingState.isRecording && recordingState.isPaused) {
      return 'Recording paused';
    } else if (recordingState.isRecording) {
      return 'Recording...';
    } else if (audioBlob) {
      return 'Recording complete';
    } else {
      return 'Ready to record';
    }
  };

  const canStartRecording = !recordingState.isRecording && !audioBlob && !error;
  const canPauseResume = recordingState.isRecording;
  const canStop = recordingState.isRecording;
  const canPlay = audioBlob && !isPlaying && !recordingState.isRecording;
  const canSave = audioBlob && !recordingState.isRecording && !isProcessing;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" className={className}>
      <ModalBody>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900">Voice Time Entry</h2>
            <button
              onClick={handleClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-status-error-50 border border-status-error-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-status-error-600 flex-shrink-0" />
              <p className="text-sm text-status-error-700">{error}</p>
            </div>
          )}

          {/* Recording Status */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-lg font-medium text-neutral-900">
              <Clock className="w-5 h-5" />
              {formatDuration(recordingState.duration)}
            </div>
            
            <p className="text-sm text-neutral-600">{getRecordingStatusText()}</p>
            
            {/* Audio Level Visualization */}
            {recordingState.isRecording && (
              <div className="flex items-center justify-center gap-2">
                <Volume2 className="w-4 h-4 text-neutral-500" />
                <div className="w-32 h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-mpondo-gold-500 transition-all duration-100"
                    style={{ width: `${Math.min(100, recordingState.audioLevel)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-4">
            {/* Start/Stop Recording */}
            {canStartRecording && (
              <Button
                onClick={startRecording}
                variant="primary"
                size="lg"
                className="flex items-center gap-2"
                disabled={!!error}
              >
                <Mic className="w-5 h-5" />
                Start Recording
              </Button>
            )}

            {/* Pause/Resume */}
            {canPauseResume && (
              <Button
                onClick={recordingState.isPaused ? resumeRecording : pauseRecording}
                variant="secondary"
                size="lg"
                className="flex items-center gap-2"
              >
                {recordingState.isPaused ? (
                  <>
                    <Play className="w-5 h-5" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5" />
                    Pause
                  </>
                )}
              </Button>
            )}

            {/* Stop Recording */}
            {canStop && (
              <Button
                onClick={stopRecording}
                variant="destructive"
                size="lg"
                className="flex items-center gap-2"
              >
                <Square className="w-5 h-5" />
                Stop
              </Button>
            )}

            {/* Play Recording */}
            {canPlay && (
              <Button
                onClick={playRecording}
                variant="secondary"
                size="lg"
                className="flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Play
              </Button>
            )}

            {/* Stop Playback */}
            {isPlaying && (
              <Button
                onClick={stopPlayback}
                variant="secondary"
                size="lg"
                className="flex items-center gap-2"
              >
                <Square className="w-5 h-5" />
                Stop
              </Button>
            )}
          </div>

          {/* Instructions */}
          {!recordingState.isRecording && !audioBlob && !error && (
            <div className="text-center space-y-2">
              <p className="text-sm text-neutral-600">
                Click "Start Recording" and describe your work:
              </p>
              <div className="text-xs text-neutral-500 space-y-1">
                <p>"I worked on the Smith matter for 2 hours reviewing contracts"</p>
                <p>"30 minutes on client call for ABC Corporation case"</p>
              </div>
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex items-center justify-between w-full">
          <Button
            onClick={handleClose}
            variant="secondary"
            disabled={recordingState.isRecording || isProcessing}
          >
            Cancel
          </Button>
          
          <Button
            onClick={saveRecording}
            variant="primary"
            disabled={!canSave}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              'Save & Process'
            )}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};