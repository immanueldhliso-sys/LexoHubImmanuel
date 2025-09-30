# Voice-First Time Capture - Implementation Guide

## Overview

This document provides detailed implementation guidance for LEXO's Voice-First Time Capture feature, bridging the product requirements with technical implementation. This killer feature enables South African legal professionals to capture billable time through natural voice commands with >90% accuracy and <3 second response time.

## Implementation Phases

### Phase 1: Global Voice Access Integration (Week 1-2)

**1.1 Enhanced App.tsx Integration**
```typescript
// Add to App.tsx imports
import { VoiceCaptureFAB } from './components/voice/VoiceCaptureFAB';
import { GlobalVoiceModal } from './components/voice/GlobalVoiceModal';
import { useVoiceCapture } from './hooks/useVoiceCapture';

// Add to MainLayout component
const MainLayout: React.FC = ({ children, activePage, sidebarOpen, onPageChange, onToggleSidebar }) => {
  const { isVoiceModalOpen, openVoiceModal, closeVoiceModal } = useVoiceCapture();

  // Global keyboard shortcut: Cmd/Ctrl + Shift + V
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        openVoiceModal();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [openVoiceModal]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation
        activePage={activePage}
        sidebarOpen={sidebarOpen}
        onPageChange={onPageChange}
        onToggleSidebar={onToggleSidebar}
        onVoiceCapture={openVoiceModal} // Add voice button to navigation
      />
      
      <div className="lg:pl-[257px]">
        {/* Existing layout content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Floating Action Button */}
      <VoiceCaptureFAB 
        onClick={openVoiceModal}
        className="lg:hidden" // Only show on mobile
      />

      {/* Global Voice Modal */}
      <GlobalVoiceModal 
        isOpen={isVoiceModalOpen}
        onClose={closeVoiceModal}
      />
    </div>
  );
};
```

**1.2 Navigation Component Enhancement**
```typescript
// Update Navigation component to include voice button
const Navigation: React.FC = ({ activePage, sidebarOpen, onPageChange, onToggleSidebar, onVoiceCapture }) => {
  return (
    <nav className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200">
      <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Scale className="w-8 h-8 text-mpondo-gold-600" />
          <span className="text-xl font-bold text-neutral-900">LexoHub</span>
        </div>
        
        {/* Voice Capture Button */}
        <button
          onClick={onVoiceCapture}
          className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm font-medium text-mpondo-gold-700 bg-mpondo-gold-50 hover:bg-mpondo-gold-100 rounded-lg transition-colors"
          aria-label="Voice time capture (Ctrl+Shift+V)"
          title="Quick Capture (Ctrl+Shift+V)"
        >
          <Mic className="w-4 h-4" />
          <span className="hidden xl:inline">Quick Capture</span>
        </button>
      </div>
      
      {/* Rest of navigation */}
    </nav>
  );
};
```

### Phase 2: Enhanced Speech-to-Text Service (Week 2-3)

**2.1 Multi-Provider Speech Service**
```typescript
// Enhanced speech-to-text.service.ts
export class EnhancedSpeechToTextService {
  private providers = {
    whisper: {
      endpoint: 'https://api.openai.com/v1/audio/transcriptions',
      priority: 1,
      supportsStreaming: false,
      accuracy: 0.95
    },
    google: {
      endpoint: 'https://speech.googleapis.com/v1/speech:recognize',
      priority: 2,
      supportsStreaming: true,
      accuracy: 0.90
    },
    deepgram: {
      endpoint: 'https://api.deepgram.com/v1/listen',
      priority: 3,
      supportsStreaming: true,
      accuracy: 0.88
    }
  };

  async transcribeWithFallback(audioBlob: Blob): Promise<TranscriptionResult> {
    const providers = Object.entries(this.providers)
      .sort(([,a], [,b]) => a.priority - b.priority);

    for (const [name, config] of providers) {
      try {
        console.log(`Attempting transcription with ${name}...`);
        const result = await this.transcribeWithProvider(name, audioBlob, config);
        
        if (result.confidence > 0.7) {
          return { ...result, provider: name };
        }
      } catch (error) {
        console.warn(`${name} transcription failed:`, error);
        continue;
      }
    }

    throw new Error('All transcription providers failed');
  }

  private async transcribeWithProvider(
    provider: string, 
    audioBlob: Blob, 
    config: any
  ): Promise<TranscriptionResult> {
    switch (provider) {
      case 'whisper':
        return this.transcribeWithWhisper(audioBlob);
      case 'google':
        return this.transcribeWithGoogle(audioBlob);
      case 'deepgram':
        return this.transcribeWithDeepgram(audioBlob);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async transcribeWithWhisper(audioBlob: Blob): Promise<TranscriptionResult> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('prompt', 'Legal time entry for matter. Include details about case work, client name, hours spent.');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      text: data.text,
      confidence: 0.95, // Whisper doesn't provide confidence
      language: data.language || 'en',
      processingTime: Date.now() - Date.now()
    };
  }
}
```

### Phase 3: Advanced NLP Data Extraction (Week 3-4)

**3.1 Enhanced NLP Processor with GPT-4**
```typescript
// Enhanced nlp-processor.service.ts
export class AdvancedNLPProcessor {
  private static readonly LEGAL_ACTIVITY_TYPES = [
    'research', 'drafting', 'client_consultation', 'court_appearance',
    'telephone_conference', 'email_correspondence', 'travel', 
    'case_preparation', 'negotiations', 'document_review',
    'contract_analysis', 'due_diligence', 'compliance_review'
  ];

  static async extractTimeEntryData(
    transcription: string,
    availableMatters?: Matter[]
  ): Promise<ExtractedTimeEntry> {
    try {
      // Use GPT-4 for structured extraction
      const prompt = this.buildExtractionPrompt(transcription, availableMatters);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 500
        })
      });

      const data = await response.json();
      const extracted = JSON.parse(data.choices[0].message.content);
      
      // Fuzzy match matter/client names to existing records
      const matchedMatter = await this.fuzzyMatchMatter(
        extracted.matter_name,
        extracted.client_name,
        availableMatters
      );
      
      return {
        matterId: matchedMatter?.id,
        matterName: extracted.matter_name,
        clientName: extracted.client_name,
        durationMinutes: this.parseDuration(extracted.duration_minutes),
        activityType: extracted.activity_type,
        description: extracted.description,
        isBillable: extracted.is_billable !== false,
        date: extracted.date ? new Date(extracted.date) : new Date(),
        confidence: this.calculateOverallConfidence(extracted, matchedMatter)
      };
    } catch (error) {
      console.error('NLP extraction failed:', error);
      throw new Error('Failed to extract time entry data');
    }
  }

  private static buildExtractionPrompt(
    transcription: string,
    availableMatters?: Matter[]
  ): string {
    const matterContext = availableMatters?.length 
      ? `\n\nAvailable matters for this user:\n${availableMatters.map(m => 
          `- ${m.client_name}: ${m.matter_description} (ID: ${m.id})`
        ).join('\n')}`
      : '';

    return `Extract time entry details from this South African legal professional's voice note.
Return JSON with: matter_name, client_name, duration_minutes, activity_type, description, is_billable, date.

Transcription: "${transcription}"

Common activity types: ${this.LEGAL_ACTIVITY_TYPES.join(', ')}

Duration parsing examples:
- "2 hours" = 120
- "30 minutes" = 30  
- "half an hour" = 30
- "quarter hour" = 15
- "1.5 hours" = 90

South African legal context:
- Common client types: Pty Ltd, Corporation, Holdings, Trust
- Court references: High Court, Magistrate Court, Labour Court
- Legal work: pleadings, heads of argument, affidavits, opinions

${matterContext}

Return valid JSON only with all fields, using null for unknown values.`;
  }

  private static async fuzzyMatchMatter(
    matterName?: string,
    clientName?: string,
    availableMatters?: Matter[]
  ): Promise<Matter | null> {
    if (!availableMatters?.length || (!matterName && !clientName)) {
      return null;
    }

    const searchTerm = (clientName || matterName || '').toLowerCase();
    let bestMatch: Matter | null = null;
    let highestScore = 0;

    for (const matter of availableMatters) {
      const clientScore = this.calculateSimilarity(
        searchTerm, 
        matter.client_name.toLowerCase()
      );
      const matterScore = this.calculateSimilarity(
        searchTerm, 
        matter.matter_description.toLowerCase()
      );
      
      const score = Math.max(clientScore, matterScore);
      
      if (score > highestScore && score > 0.6) { // 60% similarity threshold
        highestScore = score;
        bestMatch = matter;
      }
    }

    return bestMatch;
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    // Implement Levenshtein distance or similar algorithm
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1, // deletion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}
```

### Phase 4: Global Voice Modal Component (Week 4-5)

**4.1 Complete Voice Modal Implementation**
```typescript
// components/voice/GlobalVoiceModal.tsx
export const GlobalVoiceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'processing' | 'complete'>('idle');
  const [transcription, setTranscription] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedTimeEntry | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [confidence, setConfidence] = useState(0);

  const { startRecording, stopRecording, isRecording } = useAudioRecording({
    onRecordingComplete: handleRecordingComplete
  });

  const handleRecordingComplete = async (blob: Blob) => {
    setAudioBlob(blob);
    setRecordingState('processing');
    
    try {
      // Transcribe audio
      const speechService = new EnhancedSpeechToTextService();
      const transcriptionResult = await speechService.transcribeWithFallback(blob);
      setTranscription(transcriptionResult.text);
      
      // Extract structured data
      const nlpProcessor = new AdvancedNLPProcessor();
      const extracted = await nlpProcessor.extractTimeEntryData(
        transcriptionResult.text,
        await getAvailableMatters() // Fetch user's matters
      );
      
      setExtractedData(extracted);
      setConfidence(extracted.confidence);
      setRecordingState('complete');
      
    } catch (error) {
      console.error('Voice processing failed:', error);
      toast.error('Failed to process voice recording. Please try again.');
      setRecordingState('idle');
    }
  };

  const handleSaveTimeEntry = async () => {
    if (!extractedData) return;
    
    try {
      await timeEntryService.createTimeEntry({
        matter_id: extractedData.matterId,
        description: extractedData.description,
        duration_minutes: extractedData.durationMinutes,
        activity_type: extractedData.activityType,
        is_billable: extractedData.isBillable,
        entry_date: extractedData.date
      });
      
      toast.success('Time entry saved successfully!');
      onClose();
      
    } catch (error) {
      console.error('Failed to save time entry:', error);
      toast.error('Failed to save time entry. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <h2 className="text-xl font-semibold text-neutral-900">Voice Time Capture</h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6">
            {recordingState === 'idle' && (
              <VoiceRecordingInterface
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                isRecording={isRecording}
              />
            )}

            {recordingState === 'processing' && (
              <ProcessingIndicator message="Processing your voice recording..." />
            )}

            {recordingState === 'complete' && extractedData && (
              <VoiceResultsReview
                transcription={transcription}
                extractedData={extractedData}
                confidence={confidence}
                onSave={handleSaveTimeEntry}
                onRetry={() => setRecordingState('idle')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Success Metrics & Testing

### Performance Targets
- **Transcription Accuracy**: >90% for South African accents
- **Response Time**: <3 seconds from recording stop to data extraction
- **Matter Matching**: >80% accuracy for fuzzy matching
- **User Adoption**: 70% of advocates using voice capture within 30 days

### Testing Strategy
1. **Accent Testing**: Test with 10+ different South African accents (English, Afrikaans, other)
2. **Environment Testing**: Office background noise, court environments, mobile scenarios
3. **Legal Terminology**: Test with complex legal terms and case references
4. **Performance Testing**: Measure end-to-end processing times under load
5. **Accessibility Testing**: Keyboard navigation, screen reader compatibility
6. **Mobile Testing**: Touch interactions, haptic feedback, offline scenarios

### Monitoring & Analytics
- Track transcription accuracy by provider
- Monitor processing times and failure rates
- Measure user engagement and adoption rates
- Collect feedback on extracted data accuracy
- Monitor API costs and usage patterns

This implementation guide provides the technical foundation for LEXO's killer Voice-First Time Capture feature, ensuring it meets the demanding requirements of South African legal professionals while maintaining the highest standards of accuracy and performance.