/**
 * Voice Management Service
 * Orchestrates the complete voice-to-time-entry workflow
 */

import { speechToTextService } from './speech-to-text.service';
import { nlpProcessor } from './nlp-processor.service';
import type { VoiceRecording, Matter, TimeEntry, TranscriptionResult } from '../types';

export class VoiceManagementService {
  private recordings: Map<string, VoiceRecording> = new Map();
  private playingAudio: HTMLAudioElement | null = null;

  /**
   * Process a voice recording through the complete pipeline
   */
  async processVoiceRecording(
    recording: VoiceRecording, 
    availableMatters?: Matter[]
  ): Promise<VoiceRecording> {
    try {
      // Update status to processing
      const updatedRecording = { ...recording, processingStatus: 'processing' as const };
      this.recordings.set(recording.id, updatedRecording);

      // Step 1: Transcribe audio
      let transcriptionResult: TranscriptionResult;
      
      if (recording.audioBlob) {
        transcriptionResult = await speechToTextService.transcribe(recording.audioBlob);
      } else {
        throw new Error('No audio data available for transcription');
      }

      // Step 2: Extract structured data using NLP
      const extractedData = await nlpProcessor.extractTimeEntryData(
        transcriptionResult.text,
        availableMatters
      );

      // Step 3: Update recording with results
      const processedRecording: VoiceRecording = {
        ...updatedRecording,
        transcription: speechToTextService.cleanupTranscription(transcriptionResult.text),
        extractedData,
        confidence: extractedData.confidence,
        language: transcriptionResult.language,
        processingStatus: 'completed',
        processedAt: new Date().toISOString()
      };

      this.recordings.set(recording.id, processedRecording);
      return processedRecording;

    } catch (error) {
      console.error('Voice processing failed:', error);
      
      const errorRecording: VoiceRecording = {
        ...recording,
        processingStatus: 'error',
        processedAt: new Date().toISOString()
      };
      
      this.recordings.set(recording.id, errorRecording);
      throw error;
    }
  }

  /**
   * Create a new voice recording
   */
  async createVoiceRecording(audioBlob: Blob, matterId?: string): Promise<VoiceRecording> {
    const recording: VoiceRecording = {
      id: crypto.randomUUID(),
      userId: 'current-user', // Should come from auth context
      matterId,
      audioBlob,
      duration: await this.calculateAudioDuration(audioBlob),
      processingStatus: 'pending',
      createdAt: new Date().toISOString()
    };

    this.recordings.set(recording.id, recording);
    return recording;
  }

  /**
   * Get all voice recordings for current user
   */
  getVoiceRecordings(): VoiceRecording[] {
    return Array.from(this.recordings.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get a specific voice recording
   */
  getVoiceRecording(id: string): VoiceRecording | null {
    return this.recordings.get(id) || null;
  }

  /**
   * Update a voice recording
   */
  updateVoiceRecording(id: string, updates: Partial<VoiceRecording>): VoiceRecording | null {
    const existing = this.recordings.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    this.recordings.set(id, updated);
    return updated;
  }

  /**
   * Delete a voice recording
   */
  deleteVoiceRecording(id: string): boolean {
    const recording = this.recordings.get(id);
    if (!recording) return false;

    // Stop playback if this recording is playing
    if (this.playingAudio) {
      this.playingAudio.pause();
      this.playingAudio = null;
    }

    // Clean up audio blob URL if it exists
    if (recording.audioUrl) {
      URL.revokeObjectURL(recording.audioUrl);
    }

    return this.recordings.delete(id);
  }

  /**
   * Play a voice recording
   */
  async playVoiceRecording(id: string): Promise<void> {
    const recording = this.recordings.get(id);
    if (!recording || !recording.audioBlob) {
      throw new Error('Recording not found or no audio data available');
    }

    // Stop any currently playing audio
    if (this.playingAudio) {
      this.playingAudio.pause();
    }

    try {
      const audioUrl = URL.createObjectURL(recording.audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.playingAudio = null;
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        this.playingAudio = null;
        throw new Error('Failed to play audio');
      };

      this.playingAudio = audio;
      await audio.play();

    } catch (error) {
      console.error('Playback failed:', error);
      throw new Error('Failed to play recording');
    }
  }

  /**
   * Stop audio playback
   */
  stopPlayback(): void {
    if (this.playingAudio) {
      this.playingAudio.pause();
      this.playingAudio.currentTime = 0;
      this.playingAudio = null;
    }
  }

  /**
   * Convert voice recording to time entry
   */
  convertToTimeEntry(recording: VoiceRecording, overrides?: Partial<TimeEntry>): Omit<TimeEntry, 'id' | 'createdAt'> {
    if (!recording.extractedData) {
      throw new Error('Recording has not been processed yet');
    }

    const extractedData = recording.extractedData;
    const defaultRate = 2500; // Should come from user settings

    const timeEntry: Omit<TimeEntry, 'id' | 'createdAt'> = {
      matterId: extractedData.matterId || '',
      date: extractedData.date || new Date().toISOString().split('T')[0],
      duration: extractedData.duration || 0,
      description: extractedData.description,
      rate: defaultRate,
      amount: ((extractedData.duration || 0) / 60) * defaultRate,
      billed: false,
      recordedBy: recording.userId,
      recordingMethod: 'Voice',
      modifiedAt: new Date().toISOString(),
      ...overrides
    };

    return timeEntry;
  }

  /**
   * Batch process multiple recordings
   */
  async batchProcessRecordings(
    recordingIds: string[], 
    availableMatters?: Matter[]
  ): Promise<{ processed: VoiceRecording[]; failed: string[] }> {
    const processed: VoiceRecording[] = [];
    const failed: string[] = [];

    for (const id of recordingIds) {
      try {
        const recording = this.recordings.get(id);
        if (!recording) {
          failed.push(id);
          continue;
        }

        const processedRecording = await this.processVoiceRecording(recording, availableMatters);
        processed.push(processedRecording);
      } catch (error) {
        console.error(`Failed to process recording ${id}:`, error);
        failed.push(id);
      }
    }

    return { processed, failed };
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    const recordings = Array.from(this.recordings.values());
    
    return {
      total: recordings.length,
      pending: recordings.filter(r => r.processingStatus === 'pending').length,
      processing: recordings.filter(r => r.processingStatus === 'processing').length,
      completed: recordings.filter(r => r.processingStatus === 'completed').length,
      failed: recordings.filter(r => r.processingStatus === 'error').length
    };
  }

  /**
   * Export recordings data
   */
  exportRecordings(): {
    recordings: Omit<VoiceRecording, 'audioBlob'>[];
    exportDate: string;
  } {
    const recordings = Array.from(this.recordings.values()).map(recording => {
      const { audioBlob: __omit, ...recordingData } = recording;
      void __omit;
      return recordingData;
    });

    return {
      recordings,
      exportDate: new Date().toISOString()
    };
  }

  /**
   * Clear all recordings (with confirmation)
   */
  clearAllRecordings(): void {
    // Stop any playing audio
    this.stopPlayback();

    // Clean up audio URLs
    for (const recording of this.recordings.values()) {
      if (recording.audioUrl) {
        URL.revokeObjectURL(recording.audioUrl);
      }
    }

    this.recordings.clear();
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): {
    recordingCount: number;
    estimatedSize: number; // in bytes
    oldestRecording?: Date;
    newestRecording?: Date;
  } {
    const recordings = Array.from(this.recordings.values());
    
    if (recordings.length === 0) {
      return { recordingCount: 0, estimatedSize: 0 };
    }

    // Estimate size based on duration (rough calculation)
    const estimatedSize = recordings.reduce((total, recording) => {
      // Estimate ~1KB per second of audio (compressed)
      return total + (recording.duration * 1024);
    }, 0);

    const dates = recordings.map(r => new Date(r.createdAt));
    const oldestRecording = new Date(Math.min(...dates.map(d => d.getTime())));
    const newestRecording = new Date(Math.max(...dates.map(d => d.getTime())));

    return {
      recordingCount: recordings.length,
      estimatedSize,
      oldestRecording,
      newestRecording
    };
  }

  /**
   * Calculate audio duration from blob
   */
  private async calculateAudioDuration(audioBlob: Blob): Promise<number> {
    return new Promise((resolve) => {
      try {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onloadedmetadata = () => {
          const duration = audio.duration || 0;
          URL.revokeObjectURL(audioUrl);
          resolve(duration);
        };
        
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          resolve(0);
        };
        
        // Fallback timeout
        setTimeout(() => {
          URL.revokeObjectURL(audioUrl);
          resolve(0);
        }, 5000);
        
      } catch (error) {
        console.error('Failed to calculate audio duration:', error);
        resolve(0);
      }
    });
  }

  /**
   * Validate recording data
   */
  validateRecording(recording: VoiceRecording): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!recording.id) errors.push('Recording ID is missing');
    if (!recording.userId) errors.push('User ID is missing');
    if (!recording.audioBlob && !recording.audioUrl) errors.push('No audio data available');
    if (recording.duration <= 0) errors.push('Invalid duration');
    if (!recording.createdAt) errors.push('Creation date is missing');

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const voiceManagementService = new VoiceManagementService();