/**
 * Enhanced Speech Service
 * Integrates ElevenLabs for natural voice synthesis with browser fallback
 */

import { getElevenLabsService, type SpeechOptions, type VoiceSettings } from './elevenlabs.service';

export interface EnhancedSpeechConfig {
  preferElevenLabs: boolean;
  fallbackToBrowser: boolean;
  defaultLanguage: string;
  cacheEnabled: boolean;
}

export interface SpeechRequest {
  text: string;
  language?: string;
  voiceId?: string;
  useCase?: 'assistant' | 'reading' | 'notification' | 'accessibility';
  priority?: 'high' | 'normal' | 'low';
}

export interface SpeechResult {
  success: boolean;
  audioUrl?: string;
  audioElement?: HTMLAudioElement;
  provider: 'elevenlabs' | 'browser';
  error?: string;
}

export class EnhancedSpeechService {
  private config: EnhancedSpeechConfig;
  private speechQueue: SpeechRequest[] = [];
  private isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;

  constructor(config: Partial<EnhancedSpeechConfig> = {}) {
    this.config = {
      preferElevenLabs: true,
      fallbackToBrowser: true,
      defaultLanguage: 'en-ZA',
      cacheEnabled: true,
      ...config
    };
  }

  /**
   * Convert text to speech with intelligent provider selection
   */
  async textToSpeech(request: SpeechRequest): Promise<SpeechResult> {
    try {
      // Try ElevenLabs first if preferred and configured
      if (this.config.preferElevenLabs && this.isElevenLabsAvailable()) {
        const result = await this.useElevenLabs(request);
        if (result.success) {
          return result;
        }
      }

      // Fallback to browser speech synthesis
      if (this.config.fallbackToBrowser && this.isBrowserSpeechAvailable()) {
        return await this.useBrowserSpeech(request);
      }

      return {
        success: false,
        provider: 'elevenlabs',
        error: 'No speech synthesis provider available'
      };

    } catch (error) {
      console.error('Speech synthesis failed:', error);
      return {
        success: false,
        provider: 'elevenlabs',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Speak text immediately with queue management
   */
  async speak(request: SpeechRequest): Promise<SpeechResult> {
    // Add to queue if high priority or queue is empty
    if (request.priority === 'high' || this.speechQueue.length === 0) {
      return await this.speakImmediate(request);
    }

    // Add to queue for normal/low priority
    this.speechQueue.push(request);
    this.processQueue();
    
    return {
      success: true,
      provider: 'elevenlabs',
      error: 'Added to speech queue'
    };
  }

  /**
   * Speak text immediately, interrupting current speech
   */
  async speakImmediate(request: SpeechRequest): Promise<SpeechResult> {
    // Stop current speech
    this.stopSpeech();

    const result = await this.textToSpeech(request);
    
    if (result.success && result.audioElement) {
      this.currentAudio = result.audioElement;
      this.isPlaying = true;

      result.audioElement.onended = () => {
        this.isPlaying = false;
        this.currentAudio = null;
        this.processQueue();
      };

      result.audioElement.onerror = () => {
        this.isPlaying = false;
        this.currentAudio = null;
        this.processQueue();
      };
    }

    return result;
  }

  /**
   * Stop current speech
   */
  stopSpeech(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    // Stop browser speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    this.isPlaying = false;
  }

  /**
   * Clear speech queue
   */
  clearQueue(): void {
    this.speechQueue = [];
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { length: number; isPlaying: boolean } {
    return {
      length: this.speechQueue.length,
      isPlaying: this.isPlaying
    };
  }

  /**
   * Use ElevenLabs for speech synthesis
   */
  private async useElevenLabs(request: SpeechRequest): Promise<SpeechResult> {
    try {
      const elevenLabs = getElevenLabsService();
      
      const options: SpeechOptions = {
        voiceId: request.voiceId,
        voice_settings: elevenLabs.getVoiceSettingsForUseCase(request.useCase || 'assistant')
      };

      const audioElement = await elevenLabs.speak(request.text, options);
      
      return {
        success: true,
        audioElement,
        provider: 'elevenlabs'
      };
    } catch (error) {
      console.error('ElevenLabs speech failed:', error);
      return {
        success: false,
        provider: 'elevenlabs',
        error: error instanceof Error ? error.message : 'ElevenLabs error'
      };
    }
  }

  /**
   * Use browser speech synthesis as fallback
   */
  private async useBrowserSpeech(request: SpeechRequest): Promise<SpeechResult> {
    return new Promise((resolve) => {
      try {
        const utterance = new SpeechSynthesisUtterance(request.text);
        
        // Configure utterance based on request
        utterance.lang = this.mapLanguageCode(request.language || this.config.defaultLanguage);
        utterance.rate = this.getRateForUseCase(request.useCase || 'assistant');
        utterance.pitch = this.getPitchForUseCase(request.useCase || 'assistant');
        utterance.volume = 0.8;

        // Select appropriate voice
        const voices = speechSynthesis.getVoices();
        const preferredVoice = this.selectBrowserVoice(voices, utterance.lang);
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onstart = () => {
          resolve({
            success: true,
            provider: 'browser'
          });
        };

        utterance.onerror = (event) => {
          resolve({
            success: false,
            provider: 'browser',
            error: `Browser speech error: ${event.error}`
          });
        };

        speechSynthesis.speak(utterance);
      } catch (error) {
        resolve({
          success: false,
          provider: 'browser',
          error: error instanceof Error ? error.message : 'Browser speech error'
        });
      }
    });
  }

  /**
   * Process speech queue
   */
  private async processQueue(): void {
    if (this.isPlaying || this.speechQueue.length === 0) {
      return;
    }

    const nextRequest = this.speechQueue.shift()!;
    await this.speakImmediate(nextRequest);
  }

  /**
   * Check if ElevenLabs is available
   */
  private isElevenLabsAvailable(): boolean {
    try {
      const elevenLabs = getElevenLabsService();
      return elevenLabs.isConfigured();
    } catch {
      return false;
    }
  }

  /**
   * Check if browser speech synthesis is available
   */
  private isBrowserSpeechAvailable(): boolean {
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  /**
   * Map language codes to browser speech synthesis format
   */
  private mapLanguageCode(languageCode: string): string {
    const languageMap: Record<string, string> = {
      'en': 'en-ZA',
      'af': 'af-ZA',
      'zu': 'zu-ZA',
      'xh': 'xh-ZA',
      'st': 'st-ZA',
      'tn': 'tn-ZA'
    };

    return languageMap[languageCode] || languageCode;
  }

  /**
   * Get speech rate based on use case
   */
  private getRateForUseCase(useCase: string): number {
    switch (useCase) {
      case 'reading':
        return 0.8;
      case 'notification':
        return 1.1;
      case 'accessibility':
        return 0.7;
      default:
        return 0.9;
    }
  }

  /**
   * Get speech pitch based on use case
   */
  private getPitchForUseCase(useCase: string): number {
    switch (useCase) {
      case 'notification':
        return 1.2;
      case 'accessibility':
        return 1.0;
      default:
        return 1.0;
    }
  }

  /**
   * Select best browser voice for language
   */
  private selectBrowserVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
    // Try to find exact language match
    let voice = voices.find(v => v.lang === lang);
    if (voice) return voice;

    // Try to find language family match (e.g., 'en' for 'en-ZA')
    const langFamily = lang.split('-')[0];
    voice = voices.find(v => v.lang.startsWith(langFamily));
    if (voice) return voice;

    // Fallback to default voice
    return voices.find(v => v.default) || voices[0] || null;
  }
}

// Create singleton instance
let enhancedSpeechService: EnhancedSpeechService | null = null;

export const getEnhancedSpeechService = (): EnhancedSpeechService => {
  if (!enhancedSpeechService) {
    enhancedSpeechService = new EnhancedSpeechService();
  }
  return enhancedSpeechService;
};

export default EnhancedSpeechService;