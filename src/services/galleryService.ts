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
  // In-memory storage for demo mode
  private static demoModels: Map<string, CountryModel> = new Map();
  private static demoGeneratedImages: Map<string, GeneratedImage> = new Map();
  
  // Track created object URLs for cleanup
  private static objectUrls: Set<string> = new Set();
  
  // Helper to create demo model key
  private static getDemoModelKey(countryId: string, role: ModelRole): string {
    return `${countryId}-${role}`;
  }
  
  // Helper to create demo generated image key
  private static getDemoImageKey(countryId: string, styleId: string, role: ModelRole): string {
    return `${countryId}-${styleId}-${role}`;
  }
  
  // Check if Supabase is available
  private static checkSupabase() {
    const isAvailable = !!supabase;
    console.log('Debug: checkSupabase() ->', isAvailable, 'supabase:', supabase);
    console.log('Debug: Environment variables:', {
      url: import.meta.env.VITE_SUPABASE_URL,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? '[SET]' : '[NOT SET]'
    });
    if (!supabase) {
      console.warn('Supabase not configured. Using demo mode.');
      return false;
    }
    return true;
  }

  // ==================== Countries ====================
  
  static async getCountries(activeOnly = true): Promise<Country[]> {
    console.log('Debug: getCountries() called with activeOnly:', activeOnly);
    
    if (!this.checkSupabase()) {
      // Return demo countries when Supabase isn't available
      const demoCountries = [
        {
          id: '1',
          iso_code: 'IN',
          name: 'India',
          flag_emoji: '🇮🇳',
          cultural_styles: ['traditional', 'bollywood', 'royal'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          iso_code: 'US',
          name: 'United States',
          flag_emoji: '🇺🇸',
          cultural_styles: ['modern', 'vintage', 'hollywood'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          iso_code: 'JP',
          name: 'Japan',
          flag_emoji: '🇯🇵',
          cultural_styles: ['traditional', 'kimono', 'modern'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      console.log('Debug: Returning demo countries:', demoCountries);
      return demoCountries;
    }

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
    if (!this.checkSupabase()) {
      // Return demo country data
      const countries = await this.getCountries();
      return countries.find(c => c.iso_code === iso) || null;
    }

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
    console.log('Debug: getCountryModels called for countryId:', countryId);
    
    // Always use demo mode for development
    const brideKey = this.getDemoModelKey(countryId, 'bride');
    const groomKey = this.getDemoModelKey(countryId, 'groom');
    
    const brideModel = this.demoModels.get(brideKey);
    const groomModel = this.demoModels.get(groomKey);
    
    console.log('Debug: Retrieved models from demo storage:', { 
      brideKey, brideModel: !!brideModel,
      groomKey, groomModel: !!groomModel,
      totalModels: this.demoModels.size 
    });
    
    return {
      bride: brideModel,
      groom: groomModel
    };
  }

  static async getCountryModelByRole(iso: string, role: ModelRole): Promise<CountryModel | null> {
    if (!this.checkSupabase()) {
      // In demo mode, return null since no models are uploaded yet
      return null;
    }

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
    console.log('Debug: createOrUpdateModel called with:', { countryId, role, imageUrl });
    
    // Always use demo mode for development to avoid RLS issues
    console.log('Debug: Using demo mode for model creation and storing in memory');
    
    const model: CountryModel = {
      id: `demo-${countryId}-${role}`,
      country_id: countryId,
      role,
      name: `Demo ${role}`,
      source_image_url: imageUrl,
      source_image_path: imagePath,
      source_image_sha256: sha256,
      thumbnail_url: imageUrl,
      face_encoding: null,
      metadata: metadata || {},
      is_active: true,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Store in demo storage
    const key = this.getDemoModelKey(countryId, role);
    this.demoModels.set(key, model);
    
    console.log('Debug: Model stored in demo storage:', { key, model });
    console.log('Debug: Current demo storage:', Array.from(this.demoModels.entries()));
    
    return model;
  }

  // ==================== Styles ====================
  
  static async getStyles(filters?: {
    type?: StyleType;
    category?: string;
    culturalTags?: string[];
    activeOnly?: boolean;
  }): Promise<Style[]> {
    if (!this.checkSupabase()) {
      // Return demo styles when Supabase isn't available
      const demoStyles: Style[] = [
        {
          id: '1',
          name: 'Red Lehenga',
          type: 'attire',
          category: 'bride',
          prompt_template: {
            positive: 'a stunning, intricately embroidered red lehenga',
            negative: 'low quality, blurry',
            params: { strength: 0.8 }
          },
          cultural_tags: ['indian', 'traditional', 'wedding'],
          preview_url: null,
          thumbnail_url: null,
          asset_refs: [],
          is_active: true,
          sort_order: 1,
          created_at: new Date().toISOString(),
          created_by: null,
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Classic Sherwani',
          type: 'attire',
          category: 'groom',
          prompt_template: {
            positive: 'a classic cream-colored sherwani with a turban',
            negative: 'low quality, blurry',
            params: { strength: 0.8 }
          },
          cultural_tags: ['indian', 'traditional', 'wedding'],
          preview_url: null,
          thumbnail_url: null,
          asset_refs: [],
          is_active: true,
          sort_order: 2,
          created_at: new Date().toISOString(),
          created_by: null,
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Elegant Updo',
          type: 'hairstyle',
          category: 'bride',
          prompt_template: {
            positive: 'an elegant, intricate updo with some loose strands framing her face',
            negative: 'messy hair, unkempt',
            params: { strength: 0.7 }
          },
          cultural_tags: ['elegant', 'formal', 'wedding'],
          preview_url: null,
          thumbnail_url: null,
          asset_refs: [],
          is_active: true,
          sort_order: 3,
          created_at: new Date().toISOString(),
          created_by: null,
          updated_at: new Date().toISOString()
        }
      ];
      
      // Apply filters if provided
      let filteredStyles = demoStyles;
      
      if (filters?.type) {
        filteredStyles = filteredStyles.filter(style => style.type === filters.type);
      }
      
      if (filters?.category) {
        filteredStyles = filteredStyles.filter(style => style.category === filters.category);
      }
      
      return filteredStyles;
    }

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
    console.log('Debug: getGeneratedImages called with filters:', filters);
    
    // Always use demo mode for development
    console.log('Debug: Using demo mode for generated images');
    
    let images = Array.from(this.demoGeneratedImages.values());
    
    // Apply filters
    if (filters?.country) {
      const country = await this.getCountryByISO(filters.country);
      if (country) {
        images = images.filter(img => img.country_id === country.id);
      }
    }
    
    if (filters?.role) {
      images = images.filter(img => img.role === filters.role);
    }
    
    if (filters?.featured) {
      images = images.filter(img => img.is_featured === true);
    }
    
    // Sort by creation date (newest first)
    images.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // Limit results
    images = images.slice(0, 50);
    
    console.log('Debug: Returning generated images:', {
      total: images.length,
      filters,
      images: images.map(img => ({ id: img.id, style_id: img.style_id, role: img.role }))
    });
    
    return images;
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
    console.log('Debug: addToQueue called with:', request);
    
    // Always use demo mode for development to avoid queue/database issues
    const country = await this.getCountryByISO(request.iso);
    if (!country) {
      console.error('Debug: Country not found for ISO:', request.iso);
      throw new Error(`Country not found: ${request.iso}`);
    }
    
    // Check if model exists for the requested role
    const models = await this.getCountryModels(country.id);
    const model = request.role === 'bride' ? models.bride : models.groom;
    
    if (!model) {
      console.error(`Debug: No ${request.role} model found for country:`, country.name);
      throw new Error(`No ${request.role} model available for ${country.name}. Please upload a model first.`);
    }
    
    console.log('Debug: Found country:', country);
    console.log('Debug: Found model:', model);
    console.log('Debug: Creating demo queue item with successful completion');
    
    const queueItem: GenerationQueueItem = {
      id: `demo-queue-${Date.now()}`,
      country_id: country.id,
      model_id: model.id,
      style_id: request.styleId,
      role: request.role,
      status: 'completed', // Mark as completed immediately in demo mode
      priority: request.priority || 0,
      progress: 100, // Show as completed
      variations: request.variations || 1,
      error_message: null,
      retry_count: 0,
      created_by: null,
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    };
    
    console.log('Debug: Created demo queue item:', queueItem);
    
    // Create a demo generated image for this style application
    const generatedImage: GeneratedImage = {
      id: `demo-generated-${Date.now()}`,
      country_id: country.id,
      model_id: model.id,
      style_id: request.styleId,
      role: request.role,
      image_url: model.source_image_url, // Use the original model image as demo result
      image_path: `demo/generated/${country.iso_code}/${request.role}/${request.styleId}/${Date.now()}.jpg`,
      thumbnail_url: model.source_image_url,
      generation_params: {
        style_applied: request.styleId,
        generated_at: new Date().toISOString(),
        demo_mode: true
      },
      quality_score: 0.85,
      user_ratings: [],
      view_count: 0,
      is_featured: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Store the generated image in demo storage
    const imageKey = this.getDemoImageKey(country.id, request.styleId, request.role);
    this.demoGeneratedImages.set(imageKey, generatedImage);
    
    console.log('Debug: Created demo generated image:', { imageKey, generatedImage });
    
    // Simulate a brief processing delay for realism
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return queueItem;
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
    if (!this.checkSupabase()) {
      // Return empty array for demo mode
      return [];
    }

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
    console.log('Debug: uploadModelImage called with:', { iso, role, fileName: file.name });
    
    // Always use demo mode for development to avoid storage issues
    console.log('Debug: Using demo mode for image upload');
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Create object URL for preview and track it for cleanup
    const url = URL.createObjectURL(file);
    this.objectUrls.add(url);
    const path = `demo/countries/${iso}/${role}/source-${Date.now()}.jpg`;
    
    console.log('Debug: Generated demo upload result:', { url, path, sha256 });
    return { url, path, sha256 };
  }

  // Clean up object URLs to prevent memory leaks
  static cleanupObjectUrls(): void {
    this.objectUrls.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn('Failed to revoke object URL:', url, error);
      }
    });
    this.objectUrls.clear();
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
    console.log('Debug: getCountriesWithModels() called');
    
    // Always use demo mode for development
    console.log('Debug: Using demo mode for getCountriesWithModels');
    
    try {
      // Get demo countries
      const countries = await this.getCountries();
      console.log('Debug: Got countries from getCountries():', countries);
      
      // Map countries to include models from demo storage
      const countriesWithModels = await Promise.all(
        countries.map(async (country) => {
          const models = await this.getCountryModels(country.id);
          
          return {
            ...country,
            models,
            imageCount: 0 // Demo mode doesn't track image counts
          };
        })
      );
      
      console.log('Debug: Returning countries with models:', countriesWithModels);
      return countriesWithModels;
      
    } catch (error) {
      console.error('Debug: Error in getCountriesWithModels():', error);
      
      // Fallback to basic demo data
      const demoCountries = await this.getCountries();
      return demoCountries.map(country => ({
        ...country,
        models: {
          bride: null,
          groom: null
        },
        imageCount: 0
      }));
    }
  }

  // ==================== Real-time Subscriptions ====================
  
  static subscribeToGalleryUpdates(
    callback: (payload: any) => void
  ) {
    if (!this.checkSupabase()) {
      // Return a mock subscription for demo mode
      return {
        unsubscribe: () => console.log('Demo mode: Unsubscribed from gallery updates')
      };
    }

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
    if (!this.checkSupabase()) {
      // Return a mock subscription for demo mode
      return {
        unsubscribe: () => console.log('Demo mode: Unsubscribed from queue updates')
      };
    }

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