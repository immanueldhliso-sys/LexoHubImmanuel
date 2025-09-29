/**
 * ElevenLabs Text-to-Speech Service
 * Provides natural voice synthesis using ElevenLabs API
 */

export interface ElevenLabsConfig {
  apiKey: string;
  baseUrl?: string;
  defaultVoiceId?: string;
  defaultModel?: string;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  preview_url?: string;
  available_for_tiers: string[];
  settings?: VoiceSettings;
  labels: Record<string, string>;
}

export interface SpeechOptions {
  voiceId?: string;
  model?: string;
  voice_settings?: VoiceSettings;
  output_format?: string;
  optimize_streaming_latency?: number;
}

export class ElevenLabsService {
  private config: ElevenLabsConfig;
  private audioCache = new Map<string, string>();
  private voices: ElevenLabsVoice[] = [];

  constructor(config: ElevenLabsConfig) {
    this.config = {
      baseUrl: 'https://api.elevenlabs.io/v1',
      defaultVoiceId: 'pNInz6obpgDQGcFmaJgB', // Adam voice
      defaultModel: 'eleven_multilingual_v2',
      ...config
    };
  }

  /**
   * Initialize the service and load available voices
   */
  async initialize(): Promise<void> {
    try {
      await this.loadVoices();
    } catch (error) {
      console.error('Failed to initialize ElevenLabs service:', error);
      throw new Error('ElevenLabs service initialization failed');
    }
  }

  /**
   * Convert text to speech and return audio URL
   */
  async textToSpeech(
    text: string, 
    options: SpeechOptions = {}
  ): Promise<string> {
    const cacheKey = this.getCacheKey(text, options);
    
    // Check cache first
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    try {
      const voiceId = options.voiceId || this.config.defaultVoiceId!;
      const model = options.model || this.config.defaultModel!;
      
      const requestBody = {
        text,
        model_id: model,
        voice_settings: options.voice_settings || {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      };

      const response = await fetch(
        `${this.config.baseUrl}/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.config.apiKey
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Cache the result
      this.audioCache.set(cacheKey, audioUrl);
      
      return audioUrl;
    } catch (error) {
      console.error('Text-to-speech conversion failed:', error);
      throw new Error('Failed to convert text to speech');
    }
  }

  /**
   * Play text as speech directly
   */
  async speak(
    text: string, 
    options: SpeechOptions = {}
  ): Promise<HTMLAudioElement> {
    try {
      const audioUrl = await this.textToSpeech(text, options);
      const audio = new Audio(audioUrl);
      
      return new Promise((resolve, reject) => {
        audio.oncanplaythrough = () => {
          audio.play()
            .then(() => resolve(audio))
            .catch(reject);
        };
        audio.onerror = reject;
        audio.load();
      });
    } catch (error) {
      console.error('Speech playback failed:', error);
      throw error;
    }
  }

  /**
   * Load available voices from ElevenLabs
   */
  async loadVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.config.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load voices: ${response.status}`);
      }

      const data = await response.json();
      this.voices = data.voices || [];
      
      return this.voices;
    } catch (error) {
      console.error('Failed to load voices:', error);
      // Return default voices if API fails
      this.voices = this.getDefaultVoices();
      return this.voices;
    }
  }

  /**
   * Get available voices
   */
  getVoices(): ElevenLabsVoice[] {
    return this.voices;
  }

  /**
   * Get voices suitable for specific languages
   */
  getVoicesForLanguage(languageCode: string): ElevenLabsVoice[] {
    // Map language codes to voice preferences
    const languageVoiceMap: Record<string, string[]> = {
      'en': ['pNInz6obpgDQGcFmaJgB', 'EXAVITQu4vr4xnSDxMaL'], // Adam, Bella
      'af': ['pNInz6obpgDQGcFmaJgB'], // Adam (multilingual)
      'zu': ['pNInz6obpgDQGcFmaJgB'], // Adam (multilingual)
      'xh': ['pNInz6obpgDQGcFmaJgB'], // Adam (multilingual)
    };

    const preferredVoiceIds = languageVoiceMap[languageCode] || languageVoiceMap['en'];
    
    return this.voices.filter(voice => 
      preferredVoiceIds.includes(voice.voice_id) ||
      voice.labels?.language?.includes(languageCode) ||
      voice.category === 'premade'
    );
  }

  /**
   * Get voice settings optimized for different use cases
   */
  getVoiceSettingsForUseCase(useCase: 'assistant' | 'reading' | 'notification' | 'accessibility'): VoiceSettings {
    switch (useCase) {
      case 'assistant':
        return {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.2,
          use_speaker_boost: true
        };
      case 'reading':
        return {
          stability: 0.7,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: false
        };
      case 'notification':
        return {
          stability: 0.3,
          similarity_boost: 0.6,
          style: 0.4,
          use_speaker_boost: true
        };
      case 'accessibility':
        return {
          stability: 0.8,
          similarity_boost: 0.9,
          style: 0.0,
          use_speaker_boost: false
        };
      default:
        return {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        };
    }
  }

  /**
   * Clear audio cache
   */
  clearCache(): void {
    // Revoke object URLs to free memory
    this.audioCache.forEach(url => URL.revokeObjectURL(url));
    this.audioCache.clear();
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Generate cache key for text and options
   */
  private getCacheKey(text: string, options: SpeechOptions): string {
    return `${text}_${JSON.stringify(options)}`;
  }

  /**
   * Get default voices when API is unavailable
   */
  private getDefaultVoices(): ElevenLabsVoice[] {
    return [
      {
        voice_id: 'pNInz6obpgDQGcFmaJgB',
        name: 'Adam',
        category: 'premade',
        description: 'Deep, authoritative voice suitable for professional content',
        labels: { language: 'en', accent: 'american', age: 'middle_aged', gender: 'male' },
        available_for_tiers: ['free', 'starter', 'creator', 'pro']
      },
      {
        voice_id: 'EXAVITQu4vr4xnSDxMaL',
        name: 'Bella',
        category: 'premade',
        description: 'Warm, friendly female voice perfect for assistants',
        labels: { language: 'en', accent: 'american', age: 'young', gender: 'female' },
        available_for_tiers: ['free', 'starter', 'creator', 'pro']
      }
    ];
  }
}

// Create singleton instance
let elevenLabsService: ElevenLabsService | null = null;

export const getElevenLabsService = (): ElevenLabsService => {
  if (!elevenLabsService) {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || 
                   import.meta.env.VITE_elevenlabs_api || 
                   process.env.ELEVENLABS_API || 
                   process.env.elevenlabs_api;
    
    if (!apiKey) {
      console.warn('ElevenLabs API key not found. Falling back to browser speech synthesis.');
      // Return a mock service that will trigger fallback
      return new ElevenLabsService({ apiKey: '' });
    }

    elevenLabsService = new ElevenLabsService({ apiKey });
  }
  
  return elevenLabsService;
};

export default ElevenLabsService;