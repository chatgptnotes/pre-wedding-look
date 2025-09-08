import { supabase, type FavoriteItem } from '../lib/supabase';
import { GenerationConfig } from '../types';

export class FavoritesService {
  // Add to favorites
  static async addToFavorites(
    userId: string,
    imageId: string,
    imageUrl: string,
    imageType: 'bride' | 'groom' | 'couple',
    config: GenerationConfig,
    title?: string,
    notes?: string
  ): Promise<{ data: FavoriteItem | null; error: any }> {
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
        config_used: config,
        title: title || null,
        notes: notes || null,
      })
      .select();

    if (error) {
      return { data: null, error };
    }
    
    return { data: data && data.length > 0 ? data[0] : null, error: null };
  }

  // Remove from favorites
  static async removeFromFavorites(favoriteId: string): Promise<{ error: any }> {
    if (!supabase) {
      return { error: { message: 'Supabase not initialized' } };
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId);

    return { error };
  }

  // Get user's favorites
  static async getUserFavorites(userId: string): Promise<{ data: FavoriteItem[] | null; error: any }> {
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

  // Update favorite
  static async updateFavorite(
    favoriteId: string,
    updates: { title?: string; notes?: string }
  ): Promise<{ data: FavoriteItem | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not initialized' } };
    }

    const { data, error } = await supabase
      .from('favorites')
      .update(updates)
      .eq('id', favoriteId)
      .select();

    if (error) {
      return { data: null, error };
    }
    
    return { data: data && data.length > 0 ? data[0] : null, error: null };
  }

  // Check if image is favorited
  static async isFavorited(userId: string, imageId: string): Promise<{ data: boolean; error: any }> {
    if (!supabase) {
      return { data: false, error: { message: 'Supabase not initialized' } };
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('image_id', imageId)
      .limit(1);

    // PGRST116 means "No rows found" which is expected for non-favorites
    if (error && error.code !== 'PGRST116') {
      return { data: false, error };
    }
    
    return { data: !!(data && data.length > 0), error: null };
  }

  // Get favorites by type
  static async getFavoritesByType(
    userId: string,
    imageType: 'bride' | 'groom' | 'couple'
  ): Promise<{ data: FavoriteItem[] | null; error: any }> {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not initialized' } };
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('image_type', imageType)
      .order('created_at', { ascending: false });

    return { data, error };
  }
}