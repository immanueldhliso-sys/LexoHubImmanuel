/**
 * Voice Playback Component
 * Provides text-to-speech playback of transcriptions using ElevenLabs
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Settings, RotateCcw } from 'lucide-react';
import { Button } from '../../design-system/components';
import { getEnhancedSpeechService, type SpeechRequest } from '../../services/enhanced-speech.service';
import { getElevenLabsService } from '../../services/elevenlabs.service';

interface VoicePlaybackComponentProps {
  text: string;
  language?: string;
  className?: string;
  useCase?: 'reading' | 'accessibility' | 'notification';
  autoPlay?: boolean;
  showControls?: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (error: string) => void;
}

export const VoicePlaybackComponent: React.FC<VoicePlaybackComponentProps> = ({
  text,
  language = 'en',
  className = '',
  useCase = 'reading',
  autoPlay = false,
  showControls = true,
  onPlayStart,
  onPlayEnd,
  onError
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);

  const speechServiceRef = useRef(getEnhancedSpeechService());
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadAvailableVoices();
    
    if (autoPlay && text) {
      handlePlay();
    }

    return () => {
      stopPlayback();
    };
  }, [text, autoPlay]);

  const loadAvailableVoices = async () => {
    try {
      const elevenLabs = getElevenLabsService();
      const voices = elevenLabs.getVoicesForLanguage(language);
      setAvailableVoices(voices);
      
      if (voices.length > 0 && !selectedVoice) {
        setSelectedVoice(voices[0].voice_id);
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
    }
  };

  const handlePlay = async () => {
    if (!text.trim()) {
      onError?.('No text to play');
      return;
    }

    if (isPlaying) {
      handlePause();
      return;
    }

    setIsLoading(true);
    setIsPlaying(true);
    onPlayStart?.();

    try {
      const speechRequest: SpeechRequest = {
        text,
        language,
        voiceId: selectedVoice,
        useCase,
        priority: 'normal'
      };

      const result = await speechServiceRef.current.speak(speechRequest);

      if (result.success && result.audioElement) {
        currentAudioRef.current = result.audioElement;
        
        // Set playback rate
        result.audioElement.playbackRate = playbackRate;
        result.audioElement.muted = isMuted;

        result.audioElement.onended = () => {
          setIsPlaying(false);
          setIsLoading(false);
          currentAudioRef.current = null;
          onPlayEnd?.();
        };

        result.audioElement.onerror = () => {
          setIsPlaying(false);
          setIsLoading(false);
          currentAudioRef.current = null;
          onError?.('Playback failed');
        };

        result.audioElement.oncanplay = () => {
          setIsLoading(false);
        };

      } else {
        throw new Error(result.error || 'Speech synthesis failed');
      }

    } catch (error) {
      console.error('Voice playback failed:', error);
      setIsPlaying(false);
      setIsLoading(false);
      onError?.(error instanceof Error ? error.message : 'Playback failed');
    }
  };

  const handlePause = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    speechServiceRef.current.stopSpeech();
    setIsPlaying(false);
    setIsLoading(false);
  };

  const stopPlayback = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    speechServiceRef.current.stopSpeech();
    setIsPlaying(false);
    setIsLoading(false);
  };

  const handleRestart = () => {
    stopPlayback();
    setTimeout(() => handlePlay(), 100);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (currentAudioRef.current) {
      currentAudioRef.current.muted = !isMuted;
    }
  };

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    if (isPlaying) {
      stopPlayback();
      setTimeout(() => handlePlay(), 100);
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (currentAudioRef.current) {
      currentAudioRef.current.playbackRate = rate;
    }
  };

  if (!showControls) {
    // Auto-play mode without visible controls
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Main Play/Pause Button */}
      <Button
        onClick={handlePlay}
        disabled={isLoading || !text.trim()}
        variant="secondary"
        size="sm"
        className="flex items-center gap-2"
      >
        {isLoading ? (
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-3 h-3" />
        ) : (
          <Play className="w-3 h-3" />
        )}
        {isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Listen'}
      </Button>

      {/* Additional Controls */}
      {isPlaying && (
        <>
          <Button
            onClick={handleRestart}
            variant="ghost"
            size="sm"
            className="p-1"
            title="Restart"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>

          <Button
            onClick={toggleMute}
            variant="ghost"
            size="sm"
            className="p-1"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          </Button>
        </>
      )}

      {/* Settings Button */}
      <Button
        onClick={() => setShowSettings(!showSettings)}
        variant="ghost"
        size="sm"
        className="p-1"
        title="Voice Settings"
      >
        <Settings className="w-3 h-3" />
      </Button>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute z-10 mt-2 p-4 bg-white border border-neutral-200 rounded-lg shadow-lg min-w-64">
          <div className="space-y-4">
            <h4 className="font-medium text-neutral-900">Voice Settings</h4>
            
            {/* Voice Selection */}
            {availableVoices.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Voice
                </label>
                <select
                  value={selectedVoice}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-md text-sm"
                >
                  {availableVoices.map((voice) => (
                    <option key={voice.voice_id} value={voice.voice_id}>
                      {voice.name} ({voice.labels?.gender || 'Unknown'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Playback Rate */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Speed: {playbackRate}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={playbackRate}
                onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>0.5x</span>
                <span>1x</span>
                <span>2x</span>
              </div>
            </div>

            {/* Close Settings */}
            <Button
              onClick={() => setShowSettings(false)}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoicePlaybackComponent;