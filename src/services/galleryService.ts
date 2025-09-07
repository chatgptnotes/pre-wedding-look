import { getSupabaseClient } from '../lib/supabase';
import type {
  Country,
  CountryModel,
  Style,
  GeneratedImage,
  GenerationQueueItem,
  ModelRole,
  ApplyStyleRequest,
  BatchGenerateRequest,
  GalleryFilters,
  CountryWithModels
} from '../types/gallery';

export class GalleryService {
  // Track created object URLs for cleanup (still needed for file uploads)
  private static objectUrls: Set<string> = new Set();

  // Check database availability and get appropriate client
  private static checkSupabase(requireAdmin: boolean = false) {
    const client = getSupabaseClient(requireAdmin);
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
    
    console.log('🔍 Debug: checkSupabase() -> requireAdmin:', requireAdmin);
    console.log('🔍 Debug: Client available:', !!client);
    console.log('🔍 Debug: Environment variables:', {
      url: url || '[NOT SET]',
      urlLength: url ? url.length : 0,
      anonKey: anonKey ? '[SET]' : '[NOT SET]',
      anonKeyLength: anonKey ? anonKey.length : 0,
      serviceKey: serviceKey ? '[SET]' : '[NOT SET]',
      serviceKeyLength: serviceKey ? serviceKey.length : 0
    });
    
    if (!client || !url || !anonKey) {
      const errorMsg = requireAdmin 
        ? 'Admin database connection required. Please check your Supabase service key configuration.'
        : 'Database connection required. Please check your Supabase configuration.';
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log('✅ Database client is available and ready for operations');
    return client;
  }

  // ==================== Countries ====================
  
  static async getCountries(activeOnly = true): Promise<Country[]> {
    console.log('Debug: getCountries() called with activeOnly:', activeOnly);
    
    const client = this.checkSupabase();
    let query = client.from('countries').select('*');
    
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query.order('name');
    
    if (error) {
      console.error('Error fetching countries from database:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data || [];
  }

  static async getCountryByISO(iso: string): Promise<Country | null> {
    const client = this.checkSupabase();
    const { data, error } = await client
      .from('countries')
      .select('*')
      .eq('iso_code', iso)
      .single();
    
    if (error) {
      console.error('Error fetching country:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }

  // ==================== Country Models ====================
  
  static async getCountryModels(countryId: string): Promise<{ bride?: CountryModel; groom?: CountryModel }> {
    console.log('Debug: getCountryModels called for countryId:', countryId);
    
    const client = this.checkSupabase();
    const { data, error } = await client
      .from('country_models')
      .select('*')
      .eq('country_id', countryId)
      .eq('is_active', true);
    
    if (error) {
      console.error('Error fetching country models from database:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    const models = data || [];
    const brideModel = models.find(m => m.role === 'bride');
    const groomModel = models.find(m => m.role === 'groom');

    console.log('Debug: Found models:', {
      bride: !!brideModel,
      groom: !!groomModel,
      total: models.length
    });
    
    return {
      bride: brideModel,
      groom: groomModel
    };
  }

  static async getCountryModelByRole(iso: string, role: ModelRole): Promise<CountryModel | null> {
    const country = await this.getCountryByISO(iso);
    if (!country) return null;
    
    const models = await this.getCountryModels(country.id);
    return models[role] || null;
  }

  static async createCountryModel(model: Omit<CountryModel, 'id' | 'created_at' | 'updated_at'>): Promise<CountryModel> {
    const client = this.checkSupabase(true);
    const { data, error } = await client
      .from('country_models')
      .insert(model)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating country model:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }

  static async updateCountryModel(id: string, updates: Partial<CountryModel>): Promise<CountryModel> {
    const client = this.checkSupabase(true);
    const { data, error } = await client
      .from('country_models')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating country model:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }

  // ==================== Styles ====================
  
  static async getStyles(filters?: { type?: string; category?: string; activeOnly?: boolean }): Promise<Style[]> {
    const client = this.checkSupabase();
    let query = client.from('styles').select('*');
    
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters?.activeOnly !== false) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query.order('sort_order');
    
    if (error) {
      console.error('Error fetching styles:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data || [];
  }

  static async getStyleById(id: string): Promise<Style | null> {
    const client = this.checkSupabase();
    const { data, error } = await client
      .from('styles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching style by ID:', error);
      return null;
    }
    
    return data;
  }

  static async createStyle(style: Omit<Style, 'id' | 'created_at' | 'updated_at'>): Promise<Style> {
    const client = this.checkSupabase(true);
    const { data, error } = await client
      .from('styles')
      .insert(style)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating style:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }

  // ==================== Generation Queue ====================
  
  static async addToQueue(request: ApplyStyleRequest): Promise<GenerationQueueItem> {
    console.log('Debug: addToQueue called with request:', request);
    
    // Get country and model info
    const country = await this.getCountryByISO(request.countryISO);
    if (!country) {
      throw new Error(`Country not found: ${request.countryISO}`);
    }
    
    const model = await this.getCountryModelByRole(request.countryISO, request.role);
    if (!model) {
      throw new Error(`${request.role} model not found for ${request.countryISO}`);
    }
    
    console.log('Debug: Found country:', country);
    console.log('Debug: Found model:', model);

    const client = this.checkSupabase();
    
    // Add to generation queue
    const { data: queueData, error: queueError } = await client
      .from('generation_queue')
      .insert({
        country_id: country.id,
        model_id: model.id,
        style_id: request.styleId,
        role: request.role,
        status: 'pending',
        priority: request.priority || 0,
        variations: request.variations || 1,
        created_by: (await client.auth.getUser()).data.user?.id
      })
      .select()
      .single();
    
    if (queueError) {
      console.error('Error adding to queue:', queueError);
      throw new Error(`Queue error: ${queueError.message}`);
    }

    // For now, simulate immediate completion and create generated image
    const style = await this.getStyleById(request.styleId);
    const { data: generatedData, error: generatedError } = await client
      .from('generated_images')
      .insert({
        country_id: country.id,
        model_id: model.id,
        style_id: request.styleId,
        queue_id: queueData.id,
        role: request.role,
        image_url: model.source_image_url, // Use model image as placeholder for now
        image_path: `generated/${country.iso_code}/${request.role}/${request.styleId}/${Date.now()}.jpg`,
        thumbnail_url: model.source_image_url,
        generation_params: {
          style_applied: request.styleId,
          generated_at: new Date().toISOString(),
          model_used: model.id
        },
        quality_score: 0.85,
        style_name: style?.name || `Applied Style ${request.styleId}`,
        is_active: true,
        created_by: (await client.auth.getUser()).data.user?.id
      })
      .select()
      .single();
    
    if (generatedError) {
      console.error('Error creating generated image:', generatedError);
    } else {
      console.log('Debug: Created generated image in database:', generatedData);
    }
    
    // Update queue status to completed
    await client
      .from('generation_queue')
      .update({ 
        status: 'completed', 
        progress: 100, 
        completed_at: new Date().toISOString() 
      })
      .eq('id', queueData.id);
    
    return {
      ...queueData,
      status: 'completed',
      progress: 100,
      completed_at: new Date().toISOString()
    };
  }

  static async batchAddToQueue(request: BatchGenerateRequest): Promise<GenerationQueueItem[]> {
    const items = await Promise.all(
      request.styles.map(styleId => 
        this.addToQueue({
          countryISO: request.countryISO,
          styleId,
          role: request.role,
          priority: request.priority
        })
      )
    );
    return items;
  }

  static async getQueueStatus(countryISO: string, role: ModelRole): Promise<GenerationQueueItem[]> {
    const country = await this.getCountryByISO(countryISO);
    if (!country) return [];
    
    const client = this.checkSupabase();
    const { data, error } = await client
      .from('generation_queue')
      .select('*')
      .eq('country_id', country.id)
      .eq('role', role)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching queue status:', error);
      return [];
    }
    
    return data || [];
  }

  // ==================== Generated Images ====================
  
  static async getGeneratedImages(filters?: GalleryFilters): Promise<GeneratedImage[]> {
    console.log('Debug: getGeneratedImages called with filters:', filters);
    
    const client = this.checkSupabase();
    let query = client.from('generated_images').select('*');
    
    // Apply filters
    if (filters?.country) {
      const country = await this.getCountryByISO(filters.country);
      if (country) {
        query = query.eq('country_id', country.id);
      }
    }
    
    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    
    if (filters?.featured) {
      query = query.eq('is_featured', true);
    }
    
    // Always filter active images
    query = query.eq('is_active', true);
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching generated images:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log('Debug: Returning generated images:', {
      total: (data || []).length,
      filters
    });
    
    return data || [];
  }

  static async saveGeneratedImage(imageId: string): Promise<void> {
    console.log('Debug: saveGeneratedImage called for image:', imageId);
    
    const client = this.checkSupabase();
    const { error } = await client
      .from('generated_images')
      .update({ 
        is_saved: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', imageId);
    
    if (error) {
      console.error('Error saving generated image:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log('Debug: Image saved successfully');
  }

  static async deleteGeneratedImage(imageId: string): Promise<void> {
    console.log('Debug: deleteGeneratedImage called for image:', imageId);
    
    const client = this.checkSupabase();
    const { error } = await client
      .from('generated_images')
      .delete()
      .eq('id', imageId);
    
    if (error) {
      console.error('Error deleting generated image:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log('Debug: Image deleted successfully');
  }

  static async clearGeneratedImages(countryIso: string, role: ModelRole): Promise<void> {
    console.log('Debug: clearGeneratedImages called for:', { countryIso, role });
    
    const country = await this.getCountryByISO(countryIso);
    if (!country) return;
    
    const client = this.checkSupabase();
    const { error } = await client
      .from('generated_images')
      .update({ is_active: false })
      .eq('country_id', country.id)
      .eq('role', role);
    
    if (error) {
      console.error('Error clearing generated images:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log('Debug: Generated images cleared successfully');
  }

  // ==================== Countries with Models ====================
  
  static async getCountriesWithModels(): Promise<CountryWithModels[]> {
    console.log('Debug: getCountriesWithModels called');
    
    // Get all active countries
    const countries = await this.getCountries(true);
    
    // Map countries to include models
    const countriesWithModels = await Promise.all(
      countries.map(async (country) => {
        let models: { bride?: CountryModel; groom?: CountryModel } = { bride: undefined, groom: undefined };
        let imageCount = 0;
        
        try {
          models = await this.getCountryModels(country.id);
        } catch (modelError) {
          console.warn(`Failed to get models for country ${country.name}:`, modelError);
          // Continue with empty models
        }
        
        try {
          const images = await this.getGeneratedImages({ country: country.iso_code });
          imageCount = images.length;
        } catch (imageError) {
          console.warn(`Failed to get images for country ${country.name}:`, imageError);
          // Continue with 0 count
        }
        
        return {
          ...country,
          models,
          imageCount
        };
      })
    );
    
    console.log('Debug: Returning countries with models:', {
      total: countriesWithModels.length,
      countries: countriesWithModels.map(c => ({
        name: c.name,
        hasBride: !!c.models.bride,
        hasGroom: !!c.models.groom,
        imageCount: c.imageCount
      }))
    });
    
    return countriesWithModels;
  }

  // ==================== Real-time Subscriptions ====================
  
  static subscribeToQueueUpdates(callback: (payload: any) => void) {
    const client = this.checkSupabase();
    return client
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

  // ==================== Cleanup ====================
  
  static cleanup() {
    // Clean up object URLs
    this.objectUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.objectUrls.clear();
  }
}