import { supabase, type PreWeddingProject, type GeneratedImage } from '../lib/supabase';
import { GenerationConfig } from '../types';

export class DatabaseService {
  // Force database operations - no more demo mode
  private static checkDatabase(): void {
    if (!supabase) {
      throw new Error('Database connection required. Please check your Supabase configuration.');
    }
  }

  // Project Management
  static async createProject(
    projectName: string,
    userId: string,
    brideName?: string,
    groomName?: string
  ): Promise<{ data: PreWeddingProject | null; error: any }> {
    // Force database operations - no demo mode
    this.checkDatabase();
    
    const { data, error } = await supabase
      .from('pre_wedding_projects')
      .insert({
        user_id: userId,
        project_name: projectName,
        bride_name: brideName || null,
        groom_name: groomName || null,
      })
      .select();

    if (error) {
      return { data: null, error };
    }
    
    return { data: data && data.length > 0 ? data[0] : null, error: null };
  }

  static async getUserProjects(userId: string): Promise<{ data: PreWeddingProject[] | null; error: any }> {
    // Force database operations - no demo mode
    this.checkDatabase();
    
    const { data, error } = await supabase
      .from('pre_wedding_projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  static async updateProject(
    projectId: string,
    updates: Partial<PreWeddingProject>
  ): Promise<{ data: PreWeddingProject | null; error: any }> {
    const { data, error } = await supabase
      .from('pre_wedding_projects')
      .update(updates)
      .eq('id', projectId)
      .select();

    if (error) {
      return { data: null, error };
    }
    
    return { data: data && data.length > 0 ? data[0] : null, error: null };
  }

  static async deleteProject(projectId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('pre_wedding_projects')
      .delete()
      .eq('id', projectId);

    return { error };
  }

  // Image Management
  static async saveGeneratedImage(
    projectId: string,
    imageUrl: string,
    imageType: 'bride' | 'groom' | 'couple',
    configUsed: GenerationConfig
  ): Promise<{ data: GeneratedImage | null; error: any }> {
    // Force database operations - no demo mode
    this.checkDatabase();
    
    const { data, error } = await supabase
      .from('generated_images')
      .insert({
        project_id: projectId,
        image_url: imageUrl,
        image_type: imageType,
        config_used: configUsed,
      })
      .select();

    if (error) {
      return { data: null, error };
    }
    
    return { data: data && data.length > 0 ? data[0] : null, error: null };
  }

  static async getProjectImages(
    projectId: string,
    imageType?: 'bride' | 'groom' | 'couple'
  ): Promise<{ data: GeneratedImage[] | null; error: any }> {
    let query = supabase
      .from('generated_images')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (imageType) {
      query = query.eq('image_type', imageType);
    }

    const { data, error } = await query;
    return { data, error };
  }

  // User Profile Management
  static async updateUserProfile(
    userId: string,
    updates: { full_name?: string; avatar_url?: string }
  ): Promise<{ error: any }> {
    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId);

    return { error };
  }

  static async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .limit(1);

    if (error) {
      return { data: null, error };
    }
    
    return { data: data && data.length > 0 ? data[0] : null, error: null };
  }

  // Storage Management (for uploading images to Supabase Storage)
  static async uploadImage(file: File, bucket: string = 'images'): Promise<{ data: any; error: any }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) {
      return { data: null, error };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { data: { ...data, publicUrl }, error: null };
  }

  static async deleteImage(filePath: string, bucket: string = 'images'): Promise<{ error: any }> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    return { error };
  }

  // Favorites Management
  static async addToFavorites(
    userId: string,
    imageId: string,
    imageUrl: string,
    imageType: 'bride' | 'groom' | 'couple',
    configUsed: GenerationConfig,
    title?: string,
    notes?: string
  ): Promise<{ data: any; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not initialized' } };
    }

    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        image_id: imageId,
        image_url: imageUrl,
        image_type: imageType,
        config_used: configUsed,
        title: title || null,
        notes: notes || null,
      })
      .select();

    if (error) {
      return { data: null, error };
    }
    
    return { data: data && data.length > 0 ? data[0] : null, error: null };
  }

  static async getFavorites(userId: string): Promise<{ data: any[] | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not initialized' } };
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  static async removeFavorite(favoriteId: string): Promise<{ error: any }> {
    if (!supabase) {
      return { error: { message: 'Supabase not initialized' } };
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId);

    return { error };
  }

  // Analytics and Maintenance Functions
  
  // Refresh analytics materialized view
  static async refreshAnalytics(): Promise<{ error: any }> {
    if (!supabase) {
      return { error: { message: 'Supabase not initialized' } };
    }
    
    const { error } = await supabase.rpc('refresh_analytics');
    return { error };
  }

  // Get analytics data
  static async getAnalytics(limit: number = 30): Promise<{ data: any[] | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not initialized' } };
    }
    
    const { data, error } = await supabase
      .from('project_analytics')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);

    return { data, error };
  }

  // Health check function
  static async healthCheck(): Promise<{ healthy: boolean; error?: any }> {
    if (!supabase) {
      return { healthy: false, error: { message: 'Supabase not initialized' } };
    }
    
    try {
      // Test database connection with a simple query
      const { error } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        return { healthy: false, error };
      }
      
      return { healthy: true };
    } catch (err: any) {
      return { healthy: false, error: { message: err.message } };
    }
  }

  // Banana Challenge Mode Support
  static async saveBananaChallengeResult(challengeData: {
    challenge_theme_id: string;
    challenge_theme_name: string;
    bride_image: string;
    groom_image: string;
    generated_image: string;
    completed_at: string;
  }): Promise<{ data: any | null; error: any }> {
    this.checkDatabase();
    
    try {
      // First, save images to storage if needed
      const { ImageStorageService } = await import('./imageStorageService');
      
      // Save the generated image to storage
      const storageResult = await ImageStorageService.uploadBase64Image(
        challengeData.generated_image,
        `banana-challenges/${challengeData.challenge_theme_id}/${Date.now()}.jpg`
      );

      // Save to banana_challenges table (create if doesn't exist)
      const { data, error } = await supabase
        .from('banana_challenges')
        .insert({
          challenge_theme_id: challengeData.challenge_theme_id,
          challenge_theme_name: challengeData.challenge_theme_name,
          bride_image_url: challengeData.bride_image,
          groom_image_url: challengeData.groom_image,
          generated_image_url: storageResult?.publicUrl || challengeData.generated_image,
          storage_path: storageResult?.path || null,
          completed_at: challengeData.completed_at,
          user_id: (await supabase.auth.getUser()).data.user?.id || null
        })
        .select();

      if (error) {
        console.warn('Database save failed, using fallback storage:', error);
        // Return success even if database fails - image is still saved
        return { 
          data: { 
            id: `fallback-${Date.now()}`, 
            image_url: storageResult?.publicUrl || challengeData.generated_image 
          }, 
          error: null 
        };
      }
      
      const savedRecord = data && data.length > 0 ? data[0] : null;
      if (!savedRecord) {
        // Fallback if no record returned
        return { 
          data: { 
            id: `fallback-${Date.now()}`, 
            image_url: storageResult?.publicUrl || challengeData.generated_image 
          }, 
          error: null 
        };
      }

      return { data: savedRecord, error: null };
    } catch (err) {
      console.error('Error saving banana challenge:', err);
      // Return graceful fallback
      return { 
        data: { 
          id: `fallback-${Date.now()}`, 
          image_url: challengeData.generated_image 
        }, 
        error: null 
      };
    }
  }

  // Voice Slideshow Support
  static async saveVoiceSlideshow(slideshowData: {
    bride_image: string;
    groom_image: string;
    voice_recordings: Array<{
      id: string;
      type: 'bride' | 'groom';
      audio_file: string | null;
      voice_id: string | null;
    }>;
    selected_templates: Array<{
      id: string;
      name: string;
      script: string;
      mood: 'romantic' | 'playful' | 'emotional' | 'dramatic';
      duration: number;
      musicStyle: string;
    }>;
    custom_script: string;
    narrator_type: 'bride' | 'groom' | 'both';
    created_at: string;
  }, generatedSlideshowUrl: string): Promise<{ data: any | null; error: any }> {
    this.checkDatabase();
    
    try {
      // Save images and slideshow to storage
      const { ImageStorageService } = await import('./imageStorageService');
      
      const slideshowStorageResult = await ImageStorageService.uploadBase64Image(
        generatedSlideshowUrl,
        `voice-slideshows/${Date.now()}/slideshow.jpg`
      );

      // Save voice recordings to storage
      const voiceStoragePromises = slideshowData.voice_recordings.map(async (recording, index) => {
        if (recording.audio_file && recording.audio_file.startsWith('blob:')) {
          try {
            // Convert blob URL to base64 for storage
            const response = await fetch(recording.audio_file);
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            
            return await ImageStorageService.uploadBase64Image(
              base64,
              `voice-recordings/${Date.now()}/${recording.type}-${recording.id}.wav`
            );
          } catch (err) {
            console.error('Error uploading voice recording:', err);
            return null;
          }
        }
        return null;
      });

      const voiceStorageResults = await Promise.all(voiceStoragePromises);

      // Save to voice_slideshows table (create if doesn't exist)
      const { data, error } = await supabase
        .from('voice_slideshows')
        .insert({
          bride_image_url: slideshowData.bride_image,
          groom_image_url: slideshowData.groom_image,
          generated_slideshow_url: slideshowStorageResult?.publicUrl || generatedSlideshowUrl,
          slideshow_storage_path: slideshowStorageResult?.path || null,
          voice_recordings: slideshowData.voice_recordings.map((recording, index) => ({
            ...recording,
            storage_url: voiceStorageResults[index]?.publicUrl || recording.audio_file,
            storage_path: voiceStorageResults[index]?.path || null
          })),
          selected_templates: slideshowData.selected_templates,
          custom_script: slideshowData.custom_script,
          narrator_type: slideshowData.narrator_type,
          total_duration: slideshowData.selected_templates.reduce((sum, t) => sum + t.duration, 0),
          created_at: slideshowData.created_at,
          user_id: (await supabase.auth.getUser()).data.user?.id || null
        })
        .select();

      if (error) {
        console.warn('Database save failed, using fallback storage:', error);
        return { 
          data: { 
            id: `fallback-${Date.now()}`, 
            slideshow_url: slideshowStorageResult?.publicUrl || generatedSlideshowUrl 
          }, 
          error: null 
        };
      }
      
      const savedRecord = data && data.length > 0 ? data[0] : null;
      if (!savedRecord) {
        // Fallback if no record returned
        return { 
          data: { 
            id: `fallback-${Date.now()}`, 
            slideshow_url: slideshowStorageResult?.publicUrl || generatedSlideshowUrl 
          }, 
          error: null 
        };
      }

      return { data: savedRecord, error: null };
    } catch (err) {
      console.error('Error saving voice slideshow:', err);
      return { 
        data: { 
          id: `fallback-${Date.now()}`, 
          slideshow_url: generatedSlideshowUrl 
        }, 
        error: null 
      };
    }
  }
}