const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

export interface VoiceModel {
  voice_id: string;
  name: string;
  preview_url: string;
  category: string;
}

export interface VoiceCloneResponse {
  voice_id: string;
  name: string;
  status: 'ready' | 'processing' | 'error';
}

export interface TextToSpeechRequest {
  text: string;
  voice_id: string;
  model_id?: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
}

class ElevenLabsService {
  private apiKey: string;

  constructor() {
    this.apiKey = ELEVENLABS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not found in environment variables');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${ELEVENLABS_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorData.detail || 'Unknown error'}`);
    }

    return response;
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<VoiceModel[]> {
    try {
      const response = await this.makeRequest('/voices');
      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  /**
   * Clone a voice from audio sample
   */
  async cloneVoice(audioBlob: Blob, name: string, description?: string): Promise<VoiceCloneResponse> {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('files', audioBlob, 'voice_sample.wav');
      
      if (description) {
        formData.append('description', description);
      }

      const response = await fetch(`${ELEVENLABS_API_BASE}/voices/add`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Voice cloning failed: ${response.status} - ${errorData.detail || 'Unknown error'}`);
      }

      const data = await response.json();
      return {
        voice_id: data.voice_id,
        name: name,
        status: 'ready'
      };
    } catch (error) {
      console.error('Error cloning voice:', error);
      throw error;
    }
  }

  /**
   * Generate speech from text
   */
  async textToSpeech(request: TextToSpeechRequest): Promise<Blob> {
    try {
      const body = {
        text: request.text,
        model_id: request.model_id || 'eleven_monolingual_v1',
        voice_settings: request.voice_settings || {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true
        }
      };

      const response = await fetch(`${ELEVENLABS_API_BASE}/text-to-speech/${request.voice_id}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Text-to-speech failed: ${response.status} - ${errorText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  }

  /**
   * Create a romantic slideshow script
   */
  async createRomanticSlideshow(
    slides: Array<{ title: string; script: string; duration: number }>,
    voiceIds: { bride: string; groom: string },
    narratorType: 'bride' | 'groom' | 'both' = 'both'
  ): Promise<{ audioBlob: Blob; totalDuration: number }> {
    try {
      const audioSegments: Blob[] = [];
      let totalDuration = 0;

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const voiceId = narratorType === 'both' 
          ? (i % 2 === 0 ? voiceIds.bride : voiceIds.groom)
          : narratorType === 'bride' 
            ? voiceIds.bride 
            : voiceIds.groom;

        const audioBlob = await this.textToSpeech({
          text: slide.script,
          voice_id: voiceId,
          voice_settings: {
            stability: 0.7,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true
          }
        });

        audioSegments.push(audioBlob);
        totalDuration += slide.duration;
      }

      // Combine audio segments (simplified - in production, you'd use audio processing)
      const combinedBlob = new Blob(audioSegments, { type: 'audio/mpeg' });

      return {
        audioBlob: combinedBlob,
        totalDuration
      };
    } catch (error) {
      console.error('Error creating slideshow:', error);
      throw error;
    }
  }

  /**
   * Get voice details
   */
  async getVoiceDetails(voiceId: string): Promise<VoiceModel> {
    try {
      const response = await this.makeRequest(`/voices/${voiceId}`);
      return await response.json();
    } catch (error) {
      console.error('Error getting voice details:', error);
      throw error;
    }
  }

  /**
   * Delete a cloned voice
   */
  async deleteVoice(voiceId: string): Promise<void> {
    try {
      await this.makeRequest(`/voices/${voiceId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting voice:', error);
      throw error;
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/models');
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  /**
   * Check API quota/usage
   */
  async getSubscriptionInfo(): Promise<any> {
    try {
      const response = await this.makeRequest('/user/subscription');
      return await response.json();
    } catch (error) {
      console.error('Error fetching subscription info:', error);
      throw error;
    }
  }

  /**
   * Generate sample romantic scripts
   */
  generateRomanticScripts(): Array<{ title: string; script: string; mood: string; duration: number }> {
    return [
      {
        title: "First Meeting",
        script: "The moment I first saw you, time seemed to stand still. Your smile lit up the room and my heart knew it had found its home. Every day since then has been a beautiful adventure with you by my side.",
        mood: "romantic",
        duration: 15
      },
      {
        title: "Our Journey",
        script: "From strangers to best friends, from friends to lovers, from lovers to soulmates. Our love story has been written with laughter, tears, dreams, and countless precious moments that I treasure in my heart forever.",
        mood: "emotional",
        duration: 18
      },
      {
        title: "Promise of Forever",
        script: "Today we promise to love each other through all of life's adventures. Through sunny days and stormy weather, through laughter and tears, our love will be the constant that guides us home to each other, always and forever.",
        mood: "dramatic",
        duration: 16
      },
      {
        title: "Funny Memories",
        script: "Remember when you tried to cook for me and almost burned the kitchen down? Or when I got lost on our first date and you found me wandering around confused? These silly moments make our love story uniquely ours!",
        mood: "playful",
        duration: 14
      }
    ];
  }
}

export default new ElevenLabsService();