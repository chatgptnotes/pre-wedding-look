import { supabase, type PreWeddingProject, type GeneratedImage } from '../lib/supabase';
import { GenerationConfig } from '../types';

export class DatabaseService {
  // Project Management
  static async createProject(
    projectName: string,
    userId: string,
    brideName?: string,
    groomName?: string
  ): Promise<{ data: PreWeddingProject | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not initialized' } };
    }
    
    const { data, error } = await supabase
      .from('pre_wedding_projects')
      .insert({
        user_id: userId,
        project_name: projectName,
        bride_name: brideName || null,
        groom_name: groomName || null,
      })
      .select()
      .single();

    return { data, error };
  }

  static async getUserProjects(userId: string): Promise<{ data: PreWeddingProject[] | null; error: any }> {
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
      .select()
      .single();

    return { data, error };
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
    const { data, error } = await supabase
      .from('generated_images')
      .insert({
        project_id: projectId,
        image_url: imageUrl,
        image_type: imageType,
        config_used: configUsed,
      })
      .select()
      .single();

    return { data, error };
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
      .single();

    return { data, error };
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
      .select()
      .single();

    return { data, error };
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
}