import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  X, 
  AlertCircle, 
  Clock, 
  Volume2, 
  Brain,
  CheckCircle,
  Loader2,
  Zap,
  Navigation,
  Search,
  Command
} from 'lucide-react';
import { Modal, ModalBody, ModalFooter, Button } from '../../design-system/components';
import { AudioRecordingService } from '../../services/audio-recording.service';
import { speechToTextService } from '../../services/speech-to-text.service';
import { nlpProcessor } from '../../services/nlp-processor.service';
import { voiceNavigationService } from '../../services/voice-navigation.service';
import type { VoiceNavigationResult } from '../../services/voice-navigation.service';
import type { 
  VoiceRecording, 
  VoiceRecordingState, 
  ExtractedTimeEntryData,
  Matter 
} from '../../types';

interface GlobalVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTimeEntryExtracted: (data: ExtractedTimeEntryData) => void;
  availableMatters?: Matter[];
  className?: string;
  onNavigationCommand?: (result: VoiceNavigationResult) => void;
  mode?: 'time-capture' | 'navigation' | 'auto';
}

interface ProcessingState {
  stage: 'idle' | 'transcribing' | 'extracting' | 'complete' | 'error';
  progress: number;
  message: string;
}

export const GlobalVoiceModal: React.FC<GlobalVoiceModalProps> = ({
  isOpen,
  onClose,
  onTimeEntryExtracted,
  availableMatters = [],
  className = '',
  onNavigationCommand,
  mode = 'auto'
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
  const [transcription, setTranscription] = useState<string>('');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [navigationResult, setNavigationResult] = useState<VoiceNavigationResult | null>(null);
  const [detectedMode, setDetectedMode] = useState<'time-capture' | 'navigation'>('time-capture');
  const [processingState, setProcessingState] = useState<ProcessingState>({
    stage: 'idle',
    progress: 0
  });

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
    
    setRecordingState({ isRecording: false, isPaused: false, duration: 0, audioLevel: 0 });
    setAudioBlob(null);
    setIsPlaying(false);
    setError(null);
    setTranscription('');
    setExtractedData(null);
    setNavigationResult(null);
    setDetectedMode('time-capture');
    setProcessingState({ stage: 'idle', progress: 0, message: '' });
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscription('');
      setExtractedData(null);
      setProcessingState({ stage: 'idle', progress: 0, message: '' });
      
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

      // Start processing immediately
      await processRecording(blob);
      
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setError('Failed to stop recording');
    }
  }, []);

  const processRecording = useCallback(async (blob: Blob) => {
    try {
      // Stage 1: Transcription
      setProcessingState({
        stage: 'transcribing',
        progress: 25,
        message: 'Converting speech to text...'
      });

      const transcriptionResult = await speechToTextService.transcribeAudio(blob);
      setTranscription(transcriptionResult.text);

      // Stage 2: Determine intent (navigation vs time capture)
      setProcessingState({
        stage: 'extracting',
        progress: 50,
        message: 'Analyzing intent...'
      });
      
      if (mode === 'auto') {
        // Try navigation first
        const navResult = await voiceNavigationService.processVoiceInput(transcriptionResult.text);
        
        if (navResult.success && navResult.confidence > 0.7) {
          setNavigationResult(navResult);
          setDetectedMode('navigation');
          setProcessingState({
            stage: 'complete',
            progress: 100,
            message: 'Navigation command detected!'
          });
          return;
        }
      }

      if (mode === 'navigation') {
        // Process as navigation command
        setProcessingState({
          stage: 'extracting',
          progress: 75,
          message: 'Processing navigation command...'
        });
        const navResult = await voiceNavigationService.processVoiceInput(transcriptionResult.text);
        setNavigationResult(navResult);
        setDetectedMode('navigation');
        setProcessingState({
          stage: 'complete',
          progress: 100,
          message: 'Navigation processing complete!'
        });
      } else {
        // Process as time entry (default or fallback)
        setProcessingState({
          stage: 'extracting',
          progress: 75,
          message: 'Extracting time entry data with AI...'
        });
        const extractedData = await nlpProcessor.extractTimeEntryData(
          transcriptionResult.text,
          availableMatters
        );
        setExtractedData(extractedData);
        setDetectedMode('time-capture');
        setProcessingState({
          stage: 'complete',
          progress: 100,
          message: 'Processing complete!'
        });
      }

    } catch (err) {
      console.error('Failed to process recording:', err);
      setProcessingState({
        stage: 'error',
        progress: 0,
        message: err instanceof Error ? err.message : 'Processing failed'
      });
      setError('Failed to process recording');
    }
  }, [availableMatters, mode]);

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

  const createTimeEntry = useCallback(async () => {
    if (!extractedData) return;

    try {
      // Here you would typically call your time entry API
      console.log('Creating time entry:', extractedData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the callback if provided
      if (onTimeEntryExtracted) {
        onTimeEntryExtracted(extractedData);
      }
      
      // Close modal
      handleClose();
    } catch (error) {
      console.error('Failed to create time entry:', error);
      setError('Failed to create time entry');
    }
  }, [extractedData, onTimeEntryExtracted]);

  const executeNavigationCommand = useCallback(async () => {
    if (!navigationResult) return;

    try {
      console.log('Executing navigation command:', navigationResult);
      
      // Call the navigation callback if provided
      if (onNavigationCommand) {
        onNavigationCommand(navigationResult);
      }
      
      // Close modal
      handleClose();
    } catch (error) {
      console.error('Failed to execute navigation command:', error);
      setError('Failed to execute navigation command');
    }
  }, [navigationResult, onNavigationCommand]);

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
    setTranscription('');
    setExtractedData(null);
    setProcessingState({ stage: 'idle', progress: 0, message: '' });
    onClose();
  }, [cleanup, onClose]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecordingStatusText = (): string => {
    if (processingState.stage !== 'idle') {
      return processingState.message;
    }
    
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

  const canStartRecording = !recordingState.isRecording && !audioBlob && !error && processingState.stage === 'idle';
  const canPauseResume = recordingState.isRecording && processingState.stage === 'idle';
  const canStop = recordingState.isRecording;
  const canPlay = audioBlob && !isPlaying && !recordingState.isRecording && processingState.stage !== 'transcribing' && processingState.stage !== 'extracting';
  const canCreateEntry = extractedData && processingState.stage === 'complete' && detectedMode === 'time-capture';
  const canExecuteNavigation = navigationResult && processingState.stage === 'complete' && detectedMode === 'navigation';
  const isProcessing = processingState.stage === 'transcribing' || processingState.stage === 'extracting';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" className={className}>
      <ModalBody>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-mpondo-gold-100 rounded-lg">
                {mode === 'navigation' || detectedMode === 'navigation' ? (
                  <Navigation className="w-6 h-6 text-mpondo-gold-600" />
                ) : mode === 'time-capture' || detectedMode === 'time-capture' ? (
                  <Zap className="w-6 h-6 text-mpondo-gold-600" />
                ) : (
                  <Command className="w-6 h-6 text-mpondo-gold-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  {mode === 'navigation' || detectedMode === 'navigation' 
                    ? 'Voice Navigation' 
                    : mode === 'time-capture' || detectedMode === 'time-capture'
                    ? 'Voice Time Capture'
                    : 'Voice Assistant'
                  }
                </h2>
                <p className="text-sm text-neutral-600">
                  {mode === 'navigation' || detectedMode === 'navigation'
                    ? 'Navigate with voice commands'
                    : mode === 'time-capture' || detectedMode === 'time-capture'
                    ? 'AI-powered voice-to-time-entry'
                    : 'Voice commands for navigation and time capture'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Close"
              disabled={recordingState.isRecording || isProcessing}
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

            {/* Processing Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Brain className="w-4 h-4 text-mpondo-gold-600" />
                  <span className="text-sm text-neutral-600">AI Processing</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-mpondo-gold-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${processingState.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-4">
            {/* Start Recording */}
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

          {/* Transcription Display */}
          {transcription && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Transcription
              </h3>
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                <p className="text-sm text-neutral-700">{transcription}</p>
              </div>
            </div>
          )}

          {/* Navigation Result Display */}
          {navigationResult && processingState.stage === 'complete' && detectedMode === 'navigation' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                Navigation Command Detected
                <span className="text-xs bg-mpondo-gold-100 text-mpondo-gold-700 px-2 py-1 rounded-full">
                  {Math.round(navigationResult.confidence * 100)}% confidence
                </span>
              </h3>
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg space-y-3">
                <div>
                  <label className="text-xs font-medium text-neutral-600">Command Type</label>
                  <p className="text-sm text-neutral-900 capitalize">{navigationResult.type}</p>
                </div>
                {navigationResult.page && (
                  <div>
                    <label className="text-xs font-medium text-neutral-600">Target Page</label>
                    <p className="text-sm text-neutral-900 capitalize">{navigationResult.page.replace('-', ' ')}</p>
                  </div>
                )}
                {navigationResult.action && (
                  <div>
                    <label className="text-xs font-medium text-neutral-600">Action</label>
                    <p className="text-sm text-neutral-900">{navigationResult.action}</p>
                  </div>
                )}
                {navigationResult.query && (
                  <div>
                    <label className="text-xs font-medium text-neutral-600">Search Query</label>
                    <p className="text-sm text-neutral-900">{navigationResult.query}</p>
                  </div>
                )}
                {navigationResult.originalInput && (
                  <div>
                    <label className="text-xs font-medium text-neutral-600">Original Command</label>
                    <p className="text-sm text-neutral-900 italic">"{navigationResult.originalInput}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Extracted Data Display */}
          {extractedData && processingState.stage === 'complete' && detectedMode === 'time-capture' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Extracted Time Entry Data
                <span className="text-xs bg-mpondo-gold-100 text-mpondo-gold-700 px-2 py-1 rounded-full">
                  {Math.round(extractedData.confidence * 100)}% confidence
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                <div>
                  <label className="text-xs font-medium text-neutral-600">Duration</label>
                  <p className="text-sm text-neutral-900">
                    {extractedData.duration ? `${Math.round(extractedData.duration / 60 * 100) / 100} hours` : 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600">Work Type</label>
                  <p className="text-sm text-neutral-900">{extractedData.workType || 'General'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600">Client/Matter</label>
                  <p className="text-sm text-neutral-900">{extractedData.clientName || extractedData.matterId || 'Not identified'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600">Date</label>
                  <p className="text-sm text-neutral-900">{extractedData.date || 'Today'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-neutral-600">Description</label>
                  <p className="text-sm text-neutral-900">{extractedData.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!recordingState.isRecording && !audioBlob && !error && processingState.stage === 'idle' && (
            <div className="text-center space-y-2">
              <p className="text-sm text-neutral-600">
                {mode === 'navigation' 
                  ? 'Click "Start Recording" and speak your navigation command:'
                  : mode === 'time-capture'
                  ? 'Click "Start Recording" and describe your work:'
                  : 'Click "Start Recording" and speak your command:'
                }
              </p>
              <div className="text-xs text-neutral-500 space-y-1">
                {mode === 'navigation' ? (
                  <>
                    <p>"Open matters page"</p>
                    <p>"Show dashboard"</p>
                    <p>"Search for Smith case"</p>
                    <p>"Create new invoice"</p>
                  </>
                ) : mode === 'time-capture' ? (
                  <>
                    <p>"I worked on the Smith matter for 2 hours reviewing contracts"</p>
                    <p>"30 minutes on client call for ABC Corporation case"</p>
                    <p>"Research on employment law for Johnson case, 1.5 hours"</p>
                  </>
                ) : (
                  <>
                    <p><strong>Navigation:</strong> "Open matters page", "Show dashboard"</p>
                    <p><strong>Time Entry:</strong> "2 hours on Smith matter reviewing contracts"</p>
                    <p><strong>Search:</strong> "Search for ABC Corporation case"</p>
                  </>
                )}
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
          
          {canCreateEntry && (
            <Button
              onClick={createTimeEntry}
              variant="primary"
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Create Time Entry
            </Button>
          )}

          {canExecuteNavigation && (
            <Button
              onClick={executeNavigationCommand}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Execute Command
            </Button>
          )}

          {isProcessing && (
            <Button
              variant="primary"
              disabled
              className="flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </Button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
};