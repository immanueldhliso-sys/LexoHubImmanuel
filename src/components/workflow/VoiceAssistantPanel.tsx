import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Square, 
  Send, 
  Volume2, 
  VolumeX,
  Globe,
  MessageCircle,
  Sparkles,
  Clock,
  Settings,
  Loader
} from 'lucide-react';
import { Button, Card, CardHeader, CardContent } from '../../design-system/components';
import { getEnhancedSpeechService, type SpeechRequest } from '../../services/enhanced-speech.service';
import type { VoiceQuery } from '../../types';
import { format } from 'date-fns';

interface VoiceAssistantPanelProps {
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onProcessQuery: (queryText: string, languageCode?: string) => Promise<void>;
  queryHistory: VoiceQuery[];
}

export const VoiceAssistantPanel: React.FC<VoiceAssistantPanelProps> = ({
  isListening,
  onStartListening,
  onStopListening,
  onProcessQuery,
  queryHistory
}) => {
  const [textQuery, setTextQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const enhancedSpeechRef = useRef(getEnhancedSpeechService());

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
    { code: 'zu', name: 'Zulu', nativeName: 'isiZulu' },
    { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa' },
    { code: 'st', name: 'Sotho', nativeName: 'Sesotho' },
    { code: 'tn', name: 'Tswana', nativeName: 'Setswana' }
  ];

  useEffect(() => {
    // Initialize Speech Recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = selectedLanguage === 'en' ? 'en-ZA' : selectedLanguage;

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        onStopListening();
      };

      recognitionRef.current.onend = () => {
        onStopListening();
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [selectedLanguage, onStopListening]);

  const startListening = async () => {
    try {
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      // Start audio level monitoring
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const updateAudioLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          
          if (isListening) {
            animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
          }
        }
      };

      updateAudioLevel();
      onStartListening();
    } catch (error) {
      console.error('Error starting voice recognition:', error);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setAudioLevel(0);
    onStopListening();
  };

  const processQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    setIsProcessing(true);
    try {
      const response = await onProcessQuery(queryText, selectedLanguage);
      setTextQuery('');
      setTranscript('');
      
      // Store response for potential speech synthesis
      if (response && typeof response === 'string') {
        setLastResponse(response);
        // Automatically speak the response
        await speakResponse(response);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = async (text: string) => {
    if (!text.trim() || isSpeaking) return;

    setIsSpeaking(true);
    try {
      const speechRequest: SpeechRequest = {
        text,
        language: selectedLanguage,
        useCase: 'notification',
        priority: 'normal'
      };

      const result = await enhancedSpeechRef.current.speak(speechRequest);
      
      if (result.success && result.audioElement) {
        result.audioElement.onended = () => {
          setIsSpeaking(false);
        };
        
        result.audioElement.onerror = () => {
          setIsSpeaking(false);
        };
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    enhancedSpeechRef.current.stopSpeech();
    setIsSpeaking(false);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processQuery(textQuery);
  };

  const handleVoiceSubmit = () => {
    if (transcript) {
      processQuery(transcript);
    }
  };

  const getIntentIcon = (intent?: string) => {
    switch (intent) {
      case 'court_diary':
        return '📅';
      case 'matter_inquiry':
        return '⚖️';
      case 'billing_inquiry':
        return '💰';
      default:
        return '💬';
    }
  };

  const getConfidenceColor = (score?: number) => {
    if (!score) return 'text-neutral-500';
    if (score >= 0.8) return 'text-success-600';
    if (score >= 0.6) return 'text-warning-600';
    return 'text-error-600';
  };

  return (
    <div className="space-y-6">
      {/* Voice Interface */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">Voice Interface</h3>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-neutral-500" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-2 py-1 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-mpondo-gold-500"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Voice Controls */}
            <div className="flex items-center justify-center gap-4">
              {/* Main Microphone Button */}
              <div className="relative">
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={isProcessing}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isListening
                      ? 'bg-error-500 hover:bg-error-600 shadow-lg scale-105'
                      : 'bg-mpondo-gold-500 hover:bg-mpondo-gold-600 shadow-md'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isListening ? (
                    <Square className="w-8 h-8 text-white" />
                  ) : (
                    <Mic className="w-8 h-8 text-white" />
                  )}
                </button>
                
                {/* Audio level indicator */}
                {isListening && (
                  <div className="absolute -inset-2 rounded-full border-4 border-mpondo-gold-200 animate-pulse">
                    <div 
                      className="absolute inset-0 rounded-full bg-mpondo-gold-200"
                      style={{ 
                        opacity: audioLevel,
                        transform: `scale(${1 + audioLevel * 0.3})`
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Speaker Control Button */}
              {lastResponse && (
                <button
                  onClick={isSpeaking ? stopSpeaking : () => speakResponse(lastResponse)}
                  disabled={isProcessing}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isSpeaking
                      ? 'bg-blue-500 hover:bg-blue-600 shadow-lg scale-105'
                      : 'bg-neutral-500 hover:bg-neutral-600 shadow-md'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isSpeaking ? 'Stop speaking' : 'Repeat last response'}
                >
                  {isSpeaking ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-neutral-600">
                {isListening ? 'Listening... Click to stop' : 'Click to start voice query'}
              </p>
              {isProcessing && (
                <p className="text-xs text-mpondo-gold-600 mt-1">Processing your query...</p>
              )}
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="p-3 bg-neutral-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-neutral-600">Transcript:</p>
                  <Button
                    size="sm"
                    onClick={handleVoiceSubmit}
                    disabled={isProcessing}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Send
                  </Button>
                </div>
                <p className="text-sm text-neutral-900">{transcript}</p>
              </div>
            )}

            {/* Text Input Alternative */}
            <div className="border-t border-neutral-200 pt-4">
              <form onSubmit={handleTextSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  placeholder="Or type your query here..."
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                  disabled={isProcessing}
                />
                <Button type="submit" disabled={isProcessing || !textQuery.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Query History */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-900">Recent Queries</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {queryHistory.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-600">No queries yet</p>
                <p className="text-sm text-neutral-500">Try asking about your court diary or recent matters</p>
              </div>
            ) : (
              queryHistory.slice(0, 5).map(query => (
                <div key={query.id} className="p-3 border border-neutral-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getIntentIcon(query.intent)}</span>
                      <span className="text-xs text-neutral-500">
                        {format(new Date(query.createdAt), 'dd MMM, HH:mm')}
                      </span>
                      {query.confidenceScore && (
                        <span className={`text-xs font-medium ${getConfidenceColor(query.confidenceScore)}`}>
                          {(query.confidenceScore * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      <span className="text-xs text-neutral-500">
                        {query.processingTimeMs || 0}ms
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-neutral-600 mb-1">Query:</p>
                      <p className="text-sm text-neutral-900 bg-neutral-50 p-2 rounded">
                        {query.queryText}
                      </p>
                    </div>
                    
                    {query.responseText && (
                      <div>
                        <p className="text-xs text-neutral-600 mb-1">Response:</p>
                        <p className="text-sm text-mpondo-gold-900 bg-mpondo-gold-50 p-2 rounded">
                          {query.responseText}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-900">Quick Voice Commands</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { text: 'Show my court diary for today', intent: 'court_diary' },
              { text: 'What matters are active?', intent: 'matter_inquiry' },
              { text: 'Show my recent invoices', intent: 'billing_inquiry' },
              { text: 'What hearings do I have this week?', intent: 'court_diary' }
            ].map((command, index) => (
              <button
                key={index}
                onClick={() => processQuery(command.text)}
                disabled={isProcessing}
                className="p-3 text-left border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-mpondo-gold-500" />
                  <span className="text-xs text-neutral-600">Try saying:</span>
                </div>
                <p className="text-sm text-neutral-900">"{command.text}"</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
