/**
 * Speech-to-Text Service
 * Handles transcription of audio recordings using cloud-based services
 */

import type { TranscriptionResult } from '../types';

// Extend Window interface for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

export interface SpeechToTextConfig {
  apiKey?: string;
  region?: string;
  language?: string;
  enableProfanityFilter?: boolean;
  enableWordTimestamps?: boolean;
}

export class SpeechToTextService {
  private config: SpeechToTextConfig;
  private supportedLanguages = ['en-ZA', 'en-US', 'af-ZA'];

  constructor(config: SpeechToTextConfig = {}) {
    this.config = {
      language: 'en-ZA',
      enableProfanityFilter: false,
      enableWordTimestamps: true,
      ...config
    };
  }

  /**
   * Transcribe audio blob to text
   */
  async transcribe(audioBlob: Blob, language?: string): Promise<TranscriptionResult> {
    const startTime = Date.now();
    
    try {
      // Use Web Speech API as fallback for development/testing
      if (this.isWebSpeechAPIAvailable()) {
        return await this.transcribeWithWebSpeechAPI(audioBlob, language);
      }
      
      // In production, this would integrate with Azure Speech Services or Google Cloud Speech-to-Text
      return await this.transcribeWithCloudService(audioBlob, language);
      
    } catch (error) {
      console.error('Transcription failed:', error);
      throw new Error('Failed to transcribe audio. Please try again.');
    }
  }

  /**
   * Detect language from audio
   */
  async detectLanguage(audioBlob: Blob): Promise<string> {
    try {
      // For now, return default language
      // In production, this would use language detection services
      return this.config.language || 'en-ZA';
    } catch (error) {
      console.error('Language detection failed:', error);
      return 'en-ZA';
    }
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): string[] {
    return [...this.supportedLanguages];
  }

  /**
   * Transcribe using Web Speech API (fallback for development)
   */
  private async transcribeWithWebSpeechAPI(audioBlob: Blob, language?: string): Promise<TranscriptionResult> {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        reject(new Error('Speech recognition not supported in this browser'));
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = language || this.config.language || 'en-ZA';

      let finalTranscript = '';
      let confidence = 0;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
            confidence = Math.max(confidence, result[0].confidence || 0.8);
          }
        }
      };

      recognition.onend = () => {
        resolve({
          text: finalTranscript.trim(),
          confidence: confidence,
          language: recognition.lang,
          processingTime: Date.now() - Date.now()
        });
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      // Convert blob to audio and play for recognition
      this.playAudioForRecognition(audioBlob, recognition);
    });
  }

  /**
   * Transcribe using cloud service (Azure/Google)
   */
  private async transcribeWithCloudService(audioBlob: Blob, language?: string): Promise<TranscriptionResult> {
    const startTime = Date.now();
    
    // Mock implementation for development
    // In production, this would make actual API calls to Azure Speech Services or Google Cloud Speech-to-Text
    
    return new Promise((resolve) => {
      // Simulate processing time
      setTimeout(() => {
        // Mock transcription based on audio duration
        const mockTranscriptions = [
          "I worked on the Smith matter for 2 hours reviewing the commercial lease agreement and preparing amendments.",
          "30 minutes client consultation with ABC Corporation regarding employment law compliance issues.",
          "Drafted motion for summary judgment in the Johnson case, approximately 1.5 hours of work.",
          "Research on mining rights legislation for XYZ Mining Ltd, 45 minutes of billable time.",
          "Court appearance in Johannesburg High Court for the Williams matter, 3 hours including travel time."
        ];
        
        const randomTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
        
        resolve({
          text: randomTranscription,
          confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence
          language: language || this.config.language || 'en-ZA',
          processingTime: Date.now() - startTime,
          alternatives: [
            randomTranscription.replace('hours', 'hrs'),
            randomTranscription.replace('minutes', 'mins')
          ]
        });
      }, 1000 + Math.random() * 2000); // 1-3 second processing time
    });
  }

  /**
   * Play audio for Web Speech API recognition
   */
  private async playAudioForRecognition(audioBlob: Blob, recognition: SpeechRecognition): Promise<void> {
    try {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onloadedmetadata = () => {
        recognition.start();
        audio.play();
      };
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setTimeout(() => recognition.stop(), 500);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        recognition.stop();
      };
      
    } catch (error) {
      console.error('Failed to play audio for recognition:', error);
      recognition.stop();
    }
  }

  /**
   * Check if Web Speech API is available
   */
  private isWebSpeechAPIAvailable(): boolean {
    return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
  }

  /**
   * Validate audio format for transcription
   */
  validateAudioFormat(audioBlob: Blob): boolean {
    const supportedTypes = [
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg'
    ];
    
    return supportedTypes.some(type => audioBlob.type.includes(type.split('/')[1]));
  }

  /**
   * Get optimal audio settings for transcription
   */
  getOptimalAudioSettings(): MediaTrackConstraints {
    return {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 16000, // Optimal for speech recognition
      channelCount: 1     // Mono audio
    };
  }

  /**
   * Preprocess audio for better transcription accuracy
   */
  async preprocessAudio(audioBlob: Blob): Promise<Blob> {
    try {
      // In production, this could include:
      // - Noise reduction
      // - Volume normalization
      // - Format conversion
      // - Silence trimming
      
      // For now, return the original blob
      return audioBlob;
    } catch (error) {
      console.error('Audio preprocessing failed:', error);
      return audioBlob;
    }
  }

  /**
   * Estimate transcription cost (for cloud services)
   */
  estimateTranscriptionCost(durationSeconds: number): number {
    // Mock cost calculation - in production this would use actual service pricing
    const costPerMinute = 0.006; // $0.006 per minute (example Azure pricing)
    const minutes = Math.ceil(durationSeconds / 60);
    return minutes * costPerMinute;
  }

  /**
   * Get transcription quality score
   */
  getQualityScore(result: TranscriptionResult): number {
    let score = result.confidence * 100;
    
    // Adjust based on text length (very short or very long might be less reliable)
    const wordCount = result.text.split(' ').length;
    if (wordCount < 5) score *= 0.8;
    if (wordCount > 500) score *= 0.9;
    
    // Adjust based on processing time (very fast might indicate poor quality)
    if (result.processingTime < 500) score *= 0.9;
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Clean up transcription text
   */
  cleanupTranscription(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/([.!?])\s*([a-z])/g, '$1 $2') // Ensure space after punctuation
      .replace(/^[a-z]/, match => match.toUpperCase()); // Capitalize first letter
  }
}

// Export singleton instance
export const speechToTextService = new SpeechToTextService();