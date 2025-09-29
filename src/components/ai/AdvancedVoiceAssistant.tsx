/**
 * Advanced Voice Assistant Component
 * Phase 3 implementation with enhanced NLP and AI capabilities
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Brain, 
  Sparkles, 
  MessageSquare,
  Play,
  Square,
  RotateCcw,
  Settings,
  Zap,
  FileText,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../../design-system/components';
import { toast } from 'react-hot-toast';
import { AdvancedNLPService, type VoiceCommandResult, type NLPIntent } from '../../services/ai/nlp-processor.service';
import { PredictiveAnalyticsService } from '../../services/ai/predictive-analytics.service';

interface AdvancedVoiceAssistantProps {
  onCommandExecuted?: (command: VoiceCommandResult) => void;
  onNavigate?: (page: string, params?: any) => void;
  className?: string;
}

interface VoiceSession {
  id: string;
  timestamp: string;
  transcript: string;
  intent: NLPIntent;
  response: string;
  executed: boolean;
  confidence: number;
}

interface AIInsight {
  type: 'prediction' | 'recommendation' | 'alert' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export const AdvancedVoiceAssistant: React.FC<AdvancedVoiceAssistantProps> = ({
  onCommandExecuted,
  onNavigate,
  className
}) => {
  // Voice recording state
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [voiceSessions, setVoiceSessions] = useState<VoiceSession[]>([]);
  
  // AI insights state
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [showInsights, setShowInsights] = useState(false);
  
  // Settings state
  const [voiceSettings, setVoiceSettings] = useState({
    language: 'en-ZA',
    autoExecute: true,
    confidenceThreshold: 0.7,
    enableInsights: true,
    voiceResponseEnabled: true
  });

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    initializeSpeechServices();
    loadAIInsights();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeSpeechServices = () => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = voiceSettings.language;
      
      recognitionRef.current.onresult = handleSpeechResult;
      recognitionRef.current.onerror = handleSpeechError;
      recognitionRef.current.onend = handleSpeechEnd;
    }

    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  };

  const cleanup = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  };

  const handleSpeechResult = (event: SpeechRecognitionEvent) => {
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

    setCurrentTranscript(finalTranscript || interimTranscript);

    if (finalTranscript) {
      processVoiceCommand(finalTranscript);
    }
  };

  const handleSpeechError = (event: SpeechRecognitionErrorEvent) => {
    console.error('Speech recognition error:', event.error);
    toast.error(`Voice recognition error: ${event.error}`);
    setIsListening(false);
  };

  const handleSpeechEnd = () => {
    setIsListening(false);
  };

  const startListening = async () => {
    try {
      if (!recognitionRef.current) {
        throw new Error('Speech recognition not supported');
      }

      setIsListening(true);
      setCurrentTranscript('');
      recognitionRef.current.start();
      
      toast.success('Listening... Speak your command');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      toast.error('Failed to start voice recognition');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const processVoiceCommand = async (transcript: string) => {
    if (!transcript.trim()) return;

    setIsProcessing(true);
    
    try {
      // Process with advanced NLP
      const result = await AdvancedNLPService.processVoiceCommand(transcript, voiceSettings.language);
      
      // Create voice session record
      const session: VoiceSession = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        transcript,
        intent: result.intent,
        response: result.response,
        executed: false,
        confidence: result.intent.confidence
      };

      // Check confidence threshold
      if (result.intent.confidence < voiceSettings.confidenceThreshold) {
        session.response = `I'm not sure I understood that correctly. Could you please rephrase? (Confidence: ${Math.round(result.intent.confidence * 100)}%)`;
        speakResponse(session.response);
        setVoiceSessions(prev => [session, ...prev]);
        return;
      }

      // Execute command if auto-execute is enabled
      if (voiceSettings.autoExecute && result.actions && result.actions.length > 0) {
        await executeVoiceActions(result);
        session.executed = true;
      }

      // Speak response if enabled
      if (voiceSettings.voiceResponseEnabled) {
        speakResponse(result.response);
      }

      // Add to session history
      setVoiceSessions(prev => [session, ...prev.slice(0, 9)]); // Keep last 10 sessions

      // Notify parent component
      if (onCommandExecuted) {
        onCommandExecuted(result);
      }

      // Generate AI insights if enabled
      if (voiceSettings.enableInsights) {
        generateContextualInsights(result);
      }

    } catch (error) {
      console.error('Error processing voice command:', error);
      const errorMessage = 'Sorry, I encountered an error processing your request.';
      speakResponse(errorMessage);
      toast.error('Voice command processing failed');
    } finally {
      setIsProcessing(false);
      setCurrentTranscript('');
    }
  };

  const executeVoiceActions = async (result: VoiceCommandResult) => {
    if (!result.actions) return;

    for (const action of result.actions) {
      try {
        switch (action.type) {
          case 'navigate':
            if (onNavigate) {
              onNavigate(action.target, action.parameters);
            }
            toast.success(`Navigating to ${action.target}`);
            break;

          case 'create':
            toast.success(`Opening ${action.target} creation form`);
            // In real implementation, would trigger actual creation modals
            break;

          case 'search':
            toast.success(`Searching for ${action.parameters.query || action.target}`);
            // In real implementation, would trigger search functionality
            break;

          case 'update':
            toast.success(`Updating ${action.target}`);
            // In real implementation, would trigger update operations
            break;

          case 'reminder':
            toast.success(`Setting reminder for ${action.target}`);
            // In real implementation, would create calendar reminders
            break;
        }
      } catch (error) {
        console.error(`Error executing action ${action.type}:`, error);
      }
    }
  };

  const speakResponse = (text: string) => {
    if (!synthRef.current || !voiceSettings.voiceResponseEnabled) return;

    // Cancel any current speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceSettings.language;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    synthRef.current.speak(utterance);
  };

  const generateContextualInsights = async (result: VoiceCommandResult) => {
    // Generate AI insights based on the command and current context
    const insights: AIInsight[] = [];

    // Example insights based on intent
    switch (result.intent.intent) {
      case 'view_matters':
        insights.push({
          type: 'recommendation',
          title: 'Matter Optimization Opportunity',
          description: 'Consider prioritizing high-value matters for better ROI',
          confidence: 0.85,
          actionable: true,
          priority: 'medium'
        });
        break;

      case 'create_invoice':
        insights.push({
          type: 'prediction',
          title: 'Payment Probability Forecast',
          description: 'Based on client history, payment expected within 30 days',
          confidence: 0.78,
          actionable: false,
          priority: 'low'
        });
        break;

      case 'analyze_settlement_probability':
        insights.push({
          type: 'optimization',
          title: 'Settlement Strategy Recommendation',
          description: 'Consider mediation approach for faster resolution',
          confidence: 0.82,
          actionable: true,
          priority: 'high'
        });
        break;
    }

    if (insights.length > 0) {
      setAiInsights(prev => [...insights, ...prev.slice(0, 4)]); // Keep last 5 insights
      setShowInsights(true);
    }
  };

  const loadAIInsights = async () => {
    // Load initial AI insights
    try {
      const initialInsights: AIInsight[] = [
        {
          type: 'alert',
          title: 'High-Value Matter Alert',
          description: 'Matter ABC-2024-001 approaching settlement probability threshold',
          confidence: 0.91,
          actionable: true,
          priority: 'high'
        },
        {
          type: 'optimization',
          title: 'Fee Structure Optimization',
          description: 'Performance-based pricing could increase revenue by 15%',
          confidence: 0.76,
          actionable: true,
          priority: 'medium'
        }
      ];

      setAiInsights(initialInsights);
    } catch (error) {
      console.error('Error loading AI insights:', error);
    }
  };

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'view_matters':
      case 'create_matter':
        return <FileText className="w-4 h-4" />;
      case 'create_invoice':
      case 'view_invoices':
        return <DollarSign className="w-4 h-4" />;
      case 'view_court_diary':
        return <Calendar className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction':
        return <Brain className="w-4 h-4" />;
      case 'recommendation':
        return <Sparkles className="w-4 h-4" />;
      case 'alert':
        return <Zap className="w-4 h-4" />;
      case 'optimization':
        return <RotateCcw className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const clearSessions = () => {
    setVoiceSessions([]);
    setCurrentTranscript('');
    toast.success('Voice session history cleared');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Voice Interface */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-mpondo-gold-500" />
              <h3 className="text-lg font-semibold text-neutral-900">Advanced Voice Assistant</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInsights(!showInsights)}
                className={showInsights ? 'bg-mpondo-gold-100' : ''}
              >
                <Sparkles className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Voice Control */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              size="lg"
              variant={isListening ? "destructive" : "primary"}
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className="h-16 w-16 rounded-full"
            >
              {isListening ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>
            
            {isPlaying && (
              <Button
                variant="outline"
                onClick={() => synthRef.current?.cancel()}
                className="h-12 w-12 rounded-full"
              >
                <Square className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Current Transcript */}
          {(currentTranscript || isListening) && (
            <div className="p-4 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-300">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-4 h-4 text-neutral-500" />
                <span className="text-sm font-medium text-neutral-700">
                  {isListening ? 'Listening...' : 'Processing...'}
                </span>
              </div>
              <p className="text-neutral-900">
                {currentTranscript || 'Speak your command...'}
              </p>
              {isProcessing && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-mpondo-gold-500"></div>
                  <span className="text-sm text-neutral-600">Processing with AI...</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Commands */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { text: 'Show my matters', icon: FileText },
              { text: 'Generate invoice', icon: DollarSign },
              { text: 'Court diary today', icon: Calendar },
              { text: 'Settlement analysis', icon: Brain }
            ].map((command, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => processVoiceCommand(command.text)}
                disabled={isProcessing || isListening}
                className="h-auto py-2 px-3 flex flex-col items-center gap-1"
              >
                <command.icon className="w-4 h-4" />
                <span className="text-xs">{command.text}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights Panel */}
      {showInsights && aiInsights.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-mpondo-gold-500" />
                <h3 className="text-lg font-semibold text-neutral-900">AI Insights</h3>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiInsights.map((insight, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  insight.priority === 'critical' ? 'border-status-error-500 bg-status-error-50' :
                  insight.priority === 'high' ? 'border-status-warning-500 bg-status-warning-50' :
                  insight.priority === 'medium' ? 'border-mpondo-gold-500 bg-mpondo-gold-50' :
                  'border-neutral-300 bg-neutral-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-900 mb-1">{insight.title}</h4>
                    <p className="text-sm text-neutral-600 mb-2">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">
                        Confidence: {Math.round(insight.confidence * 100)}%
                      </span>
                      {insight.actionable && (
                        <Button size="sm" variant="ghost" className="text-xs">
                          Take Action
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      {voiceSessions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">Recent Commands</h3>
              <Button variant="ghost" size="sm" onClick={clearSessions}>
                Clear History
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {voiceSessions.slice(0, 5).map((session) => (
              <div key={session.id} className="p-3 bg-neutral-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getIntentIcon(session.intent.intent)}
                    <span className="text-sm font-medium capitalize">
                      {session.intent.intent.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      session.confidence > 0.8 ? 'bg-status-success-100 text-status-success-700' :
                      session.confidence > 0.6 ? 'bg-status-warning-100 text-status-warning-700' :
                      'bg-status-error-100 text-status-error-700'
                    }`}>
                      {Math.round(session.confidence * 100)}%
                    </span>
                    {session.executed && (
                      <span className="text-xs bg-mpondo-gold-100 text-mpondo-gold-700 px-2 py-1 rounded-full">
                        Executed
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-neutral-600 mb-1">"{session.transcript}"</p>
                <p className="text-sm text-neutral-800">{session.response}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
