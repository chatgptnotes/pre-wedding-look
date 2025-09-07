import { supabase } from '../lib/supabase';
import type {
  Country,
  CountryModel,
  Style,
  GeneratedImage,
  GenerationQueueItem,
  ModelRole,
  StyleType,
  GalleryFilters,
  ApplyStyleRequest,
  BatchGenerateRequest,
  CountryWithModels
} from '../types/gallery';

export class GalleryService {
  // ==================== Countries ====================
  
  static async getCountries(activeOnly = true): Promise<Country[]> {
    let query = supabase.from('countries').select('*');
    
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query.order('name');
    
    if (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
    
    return data || [];
  }

  static async getCountryByISO(iso: string): Promise<Country | null> {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('iso_code', iso)
      .single();
    
    if (error) {
      console.error('Error fetching country:', error);
      return null;
    }
    
    return data;
  }

  // ==================== Country Models ====================
  
  static async getCountryModels(countryId: string): Promise<{ bride?: CountryModel; groom?: CountryModel }> {
    const { data, error } = await supabase
      .from('country_models')
      .select('*')
      .eq('country_id', countryId)
      .eq('is_active', true);
    
    if (error) {
      console.error('Error fetching country models:', error);
      throw error;
    }
    
    const models: { bride?: CountryModel; groom?: CountryModel } = {};
    
    data?.forEach(model => {
      models[model.role] = model;
    });
    
    return models;
  }

  static async getCountryModelByRole(iso: string, role: ModelRole): Promise<CountryModel | null> {
    const { data, error } = await supabase
      .rpc('get_country_model', { 
        p_country_iso: iso, 
        p_role: role 
      });
    
    if (error) {
      console.error('Error fetching country model:', error);
      return null;
    }
    
    return data?.[0] || null;
  }

  static async createOrUpdateModel(
    countryId: string,
    role: ModelRole,
    imageUrl: string,
    imagePath: string,
    sha256: string,
    metadata?: any
  ): Promise<CountryModel> {
    // Deactivate existing model for this country/role
    await supabase
      .from('country_models')
      .update({ is_active: false })
      .eq('country_id', countryId)
      .eq('role', role);
    
    // Create new active model
    const { data, error } = await supabase
      .from('country_models')
      .insert({
        country_id: countryId,
        role,
        source_image_url: imageUrl,
        source_image_path: imagePath,
        source_image_sha256: sha256,
        metadata,
        is_active: true,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating country model:', error);
      throw error;
    }
    
    return data;
  }

  // ==================== Styles ====================
  
  static async getStyles(filters?: {
    type?: StyleType;
    category?: string;
    culturalTags?: string[];
    activeOnly?: boolean;
  }): Promise<Style[]> {
    let query = supabase.from('styles').select('*');
    
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters?.culturalTags?.length) {
      query = query.contains('cultural_tags', filters.culturalTags);
    }
    
    if (filters?.activeOnly !== false) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query.order('sort_order').order('name');
    
    if (error) {
      console.error('Error fetching styles:', error);
      throw error;
    }
    
    return data || [];
  }

  static async getStyleById(id: string): Promise<Style | null> {
    const { data, error } = await supabase
      .from('styles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching style:', error);
      return null;
    }
    
    return data;
  }

  // ==================== Generated Images ====================
  
  static async getGeneratedImages(filters?: GalleryFilters): Promise<GeneratedImage[]> {
    let query = supabase
      .from('generated_images')
      .select(`
        *,
        country:countries(*),
        style:styles(*),
        model:country_models(*)
      `)
      .eq('is_active', true);
    
    if (filters?.country) {
      const country = await this.getCountryByISO(filters.country);
      if (country) {
        query = query.eq('country_id', country.id);
      }
    }
    
    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    
    if (filters?.styleType) {
      query = query.eq('style.type', filters.styleType);
    }
    
    if (filters?.featured) {
      query = query.eq('is_featured', true);
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching generated images:', error);
      throw error;
    }
    
    return data || [];
  }

  static async getFeaturedImages(limit = 20): Promise<GeneratedImage[]> {
    const { data, error } = await supabase
      .rpc('get_featured_gallery', { p_limit: limit });
    
    if (error) {
      console.error('Error fetching featured images:', error);
      throw error;
    }
    
    return data || [];
  }

  static async incrementViewCount(imageId: string): Promise<void> {
    await supabase.rpc('increment', {
      table_name: 'generated_images',
      row_id: imageId,
      column_name: 'view_count'
    });
  }

  // ==================== Generation Queue ====================
  
  static async addToQueue(request: ApplyStyleRequest): Promise<GenerationQueueItem> {
    const country = await this.getCountryByISO(request.iso);
    if (!country) {
      throw new Error(`Country not found: ${request.iso}`);
    }
    
    const model = await this.getCountryModelByRole(request.iso, request.role);
    if (!model) {
      throw new Error(`No model found for ${request.iso} ${request.role}`);
    }
    
    const { data, error } = await supabase
      .from('generation_queue')
      .insert({
        country_id: country.id,
        model_id: model.id,
        style_id: request.styleId,
        role: request.role,
        variations: request.variations || 1,
        priority: request.priority || 0,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
    
    return data;
  }

  static async batchAddToQueue(request: BatchGenerateRequest): Promise<GenerationQueueItem[]> {
    const items = await Promise.all(
      request.styleIds.map(styleId =>
        this.addToQueue({
          iso: request.iso,
          role: request.role,
          styleId,
          priority: request.priority
        })
      )
    );
    
    return items;
  }

  static async getQueueStatus(): Promise<GenerationQueueItem[]> {
    const { data, error } = await supabase
      .from('generation_queue')
      .select(`
        *,
        country:countries(*),
        style:styles(*),
        model:country_models(*)
      `)
      .in('status', ['pending', 'processing'])
      .order('priority', { ascending: false })
      .order('created_at');
    
    if (error) {
      console.error('Error fetching queue status:', error);
      throw error;
    }
    
    return data || [];
  }

  static async updateQueueStatus(
    queueId: string,
    status: GenerationQueueItem['status'],
    progress?: number,
    errorMessage?: string
  ): Promise<void> {
    const updates: any = { status, progress };
    
    if (status === 'processing' && !updates.started_at) {
      updates.started_at = new Date().toISOString();
    }
    
    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }
    
    if (errorMessage) {
      updates.error_message = errorMessage;
    }
    
    const { error } = await supabase
      .from('generation_queue')
      .update(updates)
      .eq('id', queueId);
    
    if (error) {
      console.error('Error updating queue status:', error);
      throw error;
    }
  }

  // ==================== Storage ====================
  
  static async uploadModelImage(
    file: File,
    iso: string,
    role: ModelRole
  ): Promise<{ url: string; path: string; sha256: string }> {
    // Generate SHA256 hash of file
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Upload to storage
    const path = `countries/${iso}/${role}/source-${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('faces')
      .upload(path, file, {
        contentType: file.type,
        upsert: true
      });
    
    if (uploadError) {
      console.error('Error uploading model image:', uploadError);
      throw uploadError;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('faces')
      .getPublicUrl(path);
    
    return {
      url: publicUrl,
      path,
      sha256
    };
  }

  static async uploadGeneratedImage(
    imageBlob: Blob,
    iso: string,
    role: ModelRole,
    styleId: string
  ): Promise<{ url: string; path: string }> {
    const path = `countries/${iso}/${role}/${styleId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
    
    const { error: uploadError } = await supabase.storage
      .from('galleries')
      .upload(path, imageBlob, {
        contentType: 'image/jpeg',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading generated image:', uploadError);
      throw uploadError;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('galleries')
      .getPublicUrl(path);
    
    return {
      url: publicUrl,
      path
    };
  }

  // ==================== Combined Operations ====================
  
  static async getCountriesWithModels(): Promise<CountryWithModels[]> {
    const countries = await this.getCountries();
    
    const countriesWithModels = await Promise.all(
      countries.map(async (country) => {
        const models = await this.getCountryModels(country.id);
        
        // Get image count for this country
        const { count } = await supabase
          .from('generated_images')
          .select('id', { count: 'exact', head: true })
          .eq('country_id', country.id);
        
        return {
          ...country,
          models,
          imageCount: count || 0
        };
      })
    );
    
    return countriesWithModels;
  }

  // ==================== Real-time Subscriptions ====================
  
  static subscribeToGalleryUpdates(
    callback: (payload: any) => void
  ) {
    return supabase
      .channel('gallery-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'generated_images'
        },
        callback
      )
      .subscribe();
  }

  static subscribeToQueueUpdates(
    callback: (payload: any) => void
  ) {
    return supabase
      .channel('queue-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generation_queue'
        },
        callback
      )
      .subscribe();
  }
}