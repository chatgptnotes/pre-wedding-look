import { supabase, supabaseAdmin, getSupabaseClient } from '../lib/supabase';
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
      anonKey: anonKey ? '[SET - LENGTH: ' + anonKey.length + ']' : '[NOT SET]',
      serviceKey: serviceKey ? '[SET - LENGTH: ' + serviceKey.length + ']' : '[NOT SET]',
      nodeEnv: import.meta.env.NODE_ENV,
      mode: import.meta.env.MODE
    });
    
    if (!client) {
      const errorMsg = requireAdmin 
        ? 'Admin database connection required. Please check your Supabase service key configuration.'
        : 'Database connection required. Please check your Supabase configuration.';
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log('✅ Database client is available and ready for operations');
    return client;
  }

  // Check if Supabase is available for fallback logic
  private static isSupabaseAvailable(): boolean {
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      return !!(url && anonKey && supabase);
    } catch {
      return false;
    }
  }

  // ==================== Countries ====================
  
  static async getCountries(activeOnly = true): Promise<Country[]> {
    console.log('Debug: getCountries() called with activeOnly:', activeOnly);
    
    if (!this.isSupabaseAvailable()) {
      // Return demo countries
      console.log('Debug: Using demo countries');
      return [
        {
          id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
          iso_code: 'IN',
          name: 'India',
          flag_emoji: '🇮🇳',
          cultural_styles: ['indian', 'traditional'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2b3c4d5e-6f78-90ab-cdef-123456789012',
          iso_code: 'US',
          name: 'United States',
          flag_emoji: '🇺🇸',
          cultural_styles: ['american', 'western'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    }

    try {
      const client = this.checkSupabase();
      let query = client.from('countries').select('*');
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) {
        console.error('Error fetching countries from database:', error);
        console.log('🔄 Falling back to demo countries due to database error');
        // Fall back to demo countries on database error
        return [
          {
            id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
            iso_code: 'IN',
            name: 'India',
            flag_emoji: '🇮🇳',
            cultural_styles: ['indian', 'traditional'],
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2b3c4d5e-6f78-90ab-cdef-123456789012',
            iso_code: 'US',
            name: 'United States',
            flag_emoji: '🇺🇸',
            cultural_styles: ['american', 'western'],
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
      }
      
      return data || [];
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      console.log('🔄 Falling back to demo countries due to connection error');
      // Fall back to demo countries on connection error
      return [
        {
          id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
          iso_code: 'IN',
          name: 'India',
          flag_emoji: '🇮🇳',
          cultural_styles: ['indian', 'traditional'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2b3c4d5e-6f78-90ab-cdef-123456789012',
          iso_code: 'US',
          name: 'United States',
          flag_emoji: '🇺🇸',
          cultural_styles: ['american', 'western'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    }
  }

  static async getCountryByISO(iso: string): Promise<Country | null> {
    if (!this.isSupabaseAvailable()) {
      // Return demo country
      const demoCountries = await this.getCountries();
      return demoCountries.find(c => c.iso_code === iso) || null;
    }

    const client = this.checkSupabase();
    const { data, error } = await client
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
    
    if (!this.isSupabaseAvailable()) {
      // Return demo models
      console.log('Debug: Using demo models for countryId:', countryId);
      const brideKey = this.getDemoModelKey(countryId, 'bride');
      const groomKey = this.getDemoModelKey(countryId, 'groom');
      
      // Create default demo models for India if they don't exist
      if (countryId === '1a2b3c4d-5e6f-7890-abcd-ef1234567890' && !this.demoModels.has(brideKey)) {
        // Create default India bride model
        const defaultBrideModel: CountryModel = {
          id: `demo-${countryId}-bride`,
          country_id: countryId,
          role: 'bride',
          name: 'India Bride Model',
          source_image_url: 'https://images.unsplash.com/photo-1594736797933-d0511ba2fe65?w=300&h=400&fit=crop&crop=face',
          source_image_path: 'demo/countries/IN/bride/default.jpg',
          source_image_sha256: 'demo-hash-india-bride',
          thumbnail_url: 'https://images.unsplash.com/photo-1594736797933-d0511ba2fe65?w=150&h=200&fit=crop&crop=face',
          metadata: {
            description: 'Demo India bride model for style application testing'
          },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        this.demoModels.set(brideKey, defaultBrideModel);
        console.log('Debug: Created default India bride model for demo');
      }
      
      return {
        bride: this.demoModels.get(brideKey),
        groom: this.demoModels.get(groomKey)
      };
    }

    try {
      const client = this.checkSupabase();
      const { data, error } = await client
        .from('country_models')
        .select('*')
        .eq('country_id', countryId)
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching country models from database:', error);
        console.log('🔄 Falling back to demo models due to database error');
        // Fall back to demo models on database error
        const brideKey = this.getDemoModelKey(countryId, 'bride');
        const groomKey = this.getDemoModelKey(countryId, 'groom');
        
        return {
          bride: this.demoModels.get(brideKey),
          groom: this.demoModels.get(groomKey)
        };
      }
      
      const models = data || [];
      const brideModel = models.find(m => m.role === 'bride');
      const groomModel = models.find(m => m.role === 'groom');
      
      console.log('Debug: Retrieved models from database:', { 
        brideModel: !!brideModel,
        groomModel: !!groomModel,
        totalModels: models.length
      });
      
      return {
        bride: brideModel,
        groom: groomModel
      };
    } catch (dbError) {
      console.error('Database connection failed for country models:', dbError);
      console.log('🔄 Falling back to demo models due to connection error');
      // Fall back to demo models on connection error
      const brideKey = this.getDemoModelKey(countryId, 'bride');
      const groomKey = this.getDemoModelKey(countryId, 'groom');
      
      return {
        bride: this.demoModels.get(brideKey),
        groom: this.demoModels.get(groomKey)
      };
    }
  }

  static async getCountryModelByRole(iso: string, role: ModelRole): Promise<CountryModel | null> {
    if (!this.isSupabaseAvailable()) {
      const country = await this.getCountryByISO(iso);
      if (!country) return null;
      
      const modelKey = this.getDemoModelKey(country.id, role);
      return this.demoModels.get(modelKey) || null;
    }

    const client = this.checkSupabase();
    const { data, error } = await client
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
    metadata?: any,
    saveToDatabase = true
  ): Promise<CountryModel> {
    console.log('Debug: createOrUpdateModel called with:', { countryId, role, imageUrl, saveToDatabase });
    
    // Validate that countryId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(countryId)) {
      console.error('❌ Invalid UUID format for countryId:', countryId);
      throw new Error(`Invalid country ID format. Expected UUID, got: ${countryId}`);
    }
    
    const model: CountryModel = {
      id: saveToDatabase ? `${countryId}-${role}` : `demo-${countryId}-${role}`,
      country_id: countryId,
      role,
      name: `${role.charAt(0).toUpperCase() + role.slice(1)} Model`,
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
    
    if (!this.isSupabaseAvailable() || !saveToDatabase) {
      console.log('🎨 Demo mode: Storing model in memory');
      const modelKey = this.getDemoModelKey(countryId, role);
      this.demoModels.set(modelKey, model);
      return model;
    }
    
    // Use admin client for database operations to bypass RLS
    const adminClient = this.checkSupabase(true);
    
    console.log('💾 Debug: Saving model to Supabase database with admin client');
    
    try {
      // Deactivate existing model for this country/role
      const { error: deactivateError } = await adminClient
        .from('country_models')
        .update({ is_active: false })
        .eq('country_id', countryId)
        .eq('role', role);
      
      if (deactivateError) {
        console.warn('⚠️ Warning deactivating existing models:', deactivateError);
      }
      
      // Create new active model
      const { data, error } = await adminClient
        .from('country_models')
        .insert({
          country_id: countryId,
          role,
          source_image_url: imageUrl,
          source_image_path: imagePath,
          source_image_sha256: sha256,
          metadata,
          is_active: true,
          created_by: null
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating country model:', error);
        console.error('❌ Full error details:', JSON.stringify(error, null, 2));
        
        // Provide more specific error messages
        if (error.code === '22P02') {
          throw new Error(`Invalid UUID format in data. Country ID: ${countryId}`);
        } else if (error.code === '23505') {
          throw new Error(`Model already exists for ${role} in this country`);
        } else if (error.message?.includes('row-level security')) {
          throw new Error('Authentication required for admin operations');
        } else {
          throw new Error(`Database error: ${error.message}`);
        }
      }
      
      console.log('✅ Debug: Model saved to Supabase:', data);
      return data;
      
    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError);
      throw dbError;
    }
  }

  // ==================== Styles ====================
  
  static async getStyles(filters?: {
    type?: StyleType;
    category?: string;
    culturalTags?: string[];
    activeOnly?: boolean;
  }): Promise<Style[]> {
    if (!this.isSupabaseAvailable()) {
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

    const client = this.checkSupabase();
    let query = client.from('styles').select('*');
    
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
    if (!this.isSupabaseAvailable()) {
      const styles = await this.getStyles();
      return styles.find(s => s.id === id) || null;
    }

    const client = this.checkSupabase();
    const { data, error } = await client
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
    
    if (!this.isSupabaseAvailable()) {
      // Use demo mode when Supabase isn't available
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
      
      console.log('Debug: Returning demo generated images:', {
        total: images.length,
        filters,
        images: images.map(img => ({ id: img.id, style_id: img.style_id, role: img.role }))
      });
      
      return images;
    }

    // Use Supabase when available
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
    
    // Always get active images
    query = query.eq('is_active', true);
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching generated images:', error);
      return [];
    }
    
    const images = data || [];
    console.log('Debug: Returning database generated images:', {
      total: images.length,
      filters,
      images: images.map(img => ({ id: img.id, style_id: img.style_id, role: img.role }))
    });
    
    return images;
  }

  static async getFeaturedImages(limit = 20): Promise<GeneratedImage[]> {
    if (!this.isSupabaseAvailable()) {
      // Return empty array for demo mode
      return [];
    }

    const client = this.checkSupabase();
    const { data, error } = await client
      .rpc('get_featured_gallery', { p_limit: limit });
    
    if (error) {
      console.error('Error fetching featured images:', error);
      throw error;
    }
    
    return data || [];
  }

  static async incrementViewCount(imageId: string): Promise<void> {
    if (!this.isSupabaseAvailable()) {
      // Do nothing in demo mode
      return;
    }

    const client = this.checkSupabase();
    await client.rpc('increment', {
      table_name: 'generated_images',
      row_id: imageId,
      column_name: 'view_count'
    });
  }

  // ==================== Generation Queue ====================
  
  static async addToQueue(request: ApplyStyleRequest): Promise<GenerationQueueItem> {
    console.log('Debug: addToQueue called with:', request);
    
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
    
    if (!this.isSupabaseAvailable()) {
      // Use demo mode when Supabase isn't available
      console.log('Debug: Creating demo queue item with successful completion');
      
      const queueItem: GenerationQueueItem = {
        id: `demo-queue-${Date.now()}`,
        country_id: country.id,
        model_id: model.id,
        style_id: request.styleId,
        role: request.role,
        status: 'completed',
        priority: request.priority || 0,
        progress: 100,
        variations: request.variations || 1,
        error_message: null,
        retry_count: 0,
        created_by: null,
        created_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };
      
      // Get the style details for display
      const style = await this.getStyleById(request.styleId);
      
      // Create a demo generated image for this style application
      const generatedImage: GeneratedImage = {
        id: `demo-generated-${Date.now()}`,
        country_id: country.id,
        model_id: model.id,
        style_id: request.styleId,
        role: request.role,
        image_url: model.source_image_url,
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
        is_saved: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        style_name: style?.name || `Applied Style ${request.styleId}`
      };
      
      // Store the generated image in demo storage
      const imageKey = this.getDemoImageKey(country.id, request.styleId, request.role);
      this.demoGeneratedImages.set(imageKey, generatedImage);
      
      console.log('Debug: Created demo generated image:', { imageKey, generatedImage });
      
      // Simulate a brief processing delay for realism
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return queueItem;
    }

    // Use Supabase when available
    console.log('Debug: Adding to Supabase generation queue');
    
    const client = this.checkSupabase();
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
      throw queueError;
    }
    
    // For now, simulate immediate completion and create generated image
    const { data: generatedData, error: generatedError } = await client
      .from('generated_images')
      .insert({
        country_id: country.id,
        model_id: model.id,
        style_id: request.styleId,
        role: request.role,
        image_url: model.source_image_url, // Use model image as placeholder
        image_path: `generated/${country.iso_code}/${request.role}/${request.styleId}/${Date.now()}.jpg`,
        thumbnail_url: model.source_image_url,
        generation_params: {
          style_applied: request.styleId,
          generated_at: new Date().toISOString(),
          simulated: true
        },
        quality_score: 0.85,
        is_active: true
      })
      .select()
      .single();
    
    if (generatedError) {
      console.error('Error creating generated image:', generatedError);
    } else {
      console.log('Debug: Created generated image in database:', generatedData);
    }
    
    // Update queue status to completed
    await this.updateQueueStatus(queueData.id, 'completed', 100);
    
    return {
      ...queueData,
      status: 'completed',
      progress: 100,
      completed_at: new Date().toISOString()
    };
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
    if (!this.isSupabaseAvailable()) {
      // Return empty array for demo mode
      return [];
    }

    const client = this.checkSupabase();
    const { data, error } = await client
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
    if (!this.isSupabaseAvailable()) {
      return;
    }

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
    
    const client = this.checkSupabase();
    const { error } = await client
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
    
    if (!this.isSupabaseAvailable()) {
      // In demo mode, create object URL for the file
      console.log('🎨 Demo mode: Creating object URL for uploaded file');
      const objectUrl = URL.createObjectURL(file);
      this.objectUrls.add(objectUrl);
      
      // Generate a fake SHA256 hash for demo
      const fakeHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      
      return {
        url: objectUrl,
        path: `demo/countries/${iso}/${role}/source-${Date.now()}.jpg`,
        sha256: fakeHash
      };
    }
    
    // Use admin client for storage operations
    const adminClient = this.checkSupabase(true);
    
    try {
      // Generate SHA256 hash of file
      const fileBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      console.log('💾 Debug: Uploading to Supabase storage with admin client');
      
      // Upload to storage
      const storagePath = `countries/${iso}/${role}/source-${Date.now()}.jpg`;
      const { error: uploadError } = await adminClient.storage
        .from('faces')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: true
        });
      
      if (uploadError) {
        console.error('❌ Error uploading model image:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }
      
      // Get public URL
      const { data: { publicUrl } } = adminClient.storage
        .from('faces')
        .getPublicUrl(storagePath);
      
      console.log('✅ Debug: Uploaded to Supabase storage:', { publicUrl, storagePath, sha256 });
      return {
        url: publicUrl,
        path: storagePath,
        sha256
      };
      
    } catch (storageError) {
      console.error('❌ Storage operation failed:', storageError);
      throw storageError;
    }
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
    if (!this.isSupabaseAvailable()) {
      // In demo mode, create object URL
      const objectUrl = URL.createObjectURL(imageBlob);
      this.objectUrls.add(objectUrl);
      return {
        url: objectUrl,
        path: `demo/countries/${iso}/${role}/${styleId}/${Date.now()}.jpg`
      };
    }
    
    const client = this.checkSupabase();
    const path = `countries/${iso}/${role}/${styleId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
    
    const { error: uploadError } = await client.storage
      .from('galleries')
      .upload(path, imageBlob, {
        contentType: 'image/jpeg',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading generated image:', uploadError);
      throw uploadError;
    }
    
    const { data: { publicUrl } } = client.storage
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
    
    try {
      // Get countries
      const countries = await this.getCountries();
      console.log('Debug: Got countries from getCountries():', countries);
      
      // Map countries to include models
      const countriesWithModels = await Promise.all(
        countries.map(async (country) => {
          let models = { bride: undefined, groom: undefined };
          let imageCount = 0;
          
          try {
            models = await this.getCountryModels(country.id);
          } catch (modelError) {
            console.warn(`Failed to get models for country ${country.name}:`, modelError);
            // Continue with empty models
          }
          
          // Get image count
          try {
            if (this.isSupabaseAvailable()) {
              // Get image count from database
              const client = this.checkSupabase();
              const { count, error } = await client
                .from('generated_images')
                .select('*', { count: 'exact', head: true })
                .eq('country_id', country.id)
                .eq('is_active', true);
              
              if (!error) {
                imageCount = count || 0;
              } else {
                console.warn('Database error getting image count:', error);
                imageCount = 0;
              }
            } else {
              // Count demo images
              const demoImages = Array.from(this.demoGeneratedImages.values())
                .filter(img => img.country_id === country.id);
              imageCount = demoImages.length;
            }
          } catch (imageCountError) {
            console.warn(`Failed to get image count for country ${country.name}:`, imageCountError);
            imageCount = 0;
          }
          
          return {
            ...country,
            models,
            imageCount
          };
        })
      );
      
      console.log('Debug: Returning countries with models:', countriesWithModels);
      return countriesWithModels;
      
    } catch (error) {
      console.error('Debug: Error in getCountriesWithModels():', error);
      
      // Enhanced fallback to demo data
      console.log('🔄 Falling back to basic demo countries with models');
      const demoCountries = [
        {
          id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
          iso_code: 'IN',
          name: 'India',
          flag_emoji: '🇮🇳',
          cultural_styles: ['indian', 'traditional'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2b3c4d5e-6f78-90ab-cdef-123456789012',
          iso_code: 'US',
          name: 'United States',
          flag_emoji: '🇺🇸',
          cultural_styles: ['american', 'western'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      return demoCountries.map(country => ({
        ...country,
        models: {
          bride: this.demoModels.get(this.getDemoModelKey(country.id, 'bride')),
          groom: this.demoModels.get(this.getDemoModelKey(country.id, 'groom'))
        },
        imageCount: Array.from(this.demoGeneratedImages.values())
          .filter(img => img.country_id === country.id).length
      }));
    }
  }

  // ==================== Real-time Subscriptions ====================
  
  static subscribeToGalleryUpdates(
    callback: (payload: any) => void
  ) {
    if (!this.isSupabaseAvailable()) {
      // Return a mock subscription for demo mode
      return {
        unsubscribe: () => console.log('Demo mode: Unsubscribed from gallery updates')
      };
    }

    const client = this.checkSupabase();
    return client
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
    if (!this.isSupabaseAvailable()) {
      // Return a mock subscription for demo mode
      return {
        unsubscribe: () => console.log('Demo mode: Unsubscribed from queue updates')
      };
    }

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

  // ==================== Generated Image Management ====================
  
  static async saveGeneratedImage(imageId: string): Promise<void> {
    console.log('Debug: saveGeneratedImage called for image:', imageId);
    
    if (!this.isSupabaseAvailable()) {
      // In demo mode, just mark as saved in memory
      const image = this.demoGeneratedImages.get(imageId);
      if (image) {
        (image as any).is_saved = true;
        image.updated_at = new Date().toISOString();
        console.log('Debug: Image marked as saved in demo mode');
      } else {
        throw new Error('Image not found in demo storage');
      }
      return;
    }

    const client = this.checkSupabase();
    const { error } = await client
      .from('generated_images')
      .update({ 
        is_saved: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', imageId);

    if (error) {
      console.error('Error saving image:', error);
      throw error;
    }

    console.log('Debug: Image saved to database');
  }

  static async deleteGeneratedImage(imageId: string): Promise<void> {
    console.log('Debug: deleteGeneratedImage called for image:', imageId);
    
    if (!this.isSupabaseAvailable()) {
      // In demo mode, remove from memory
      const image = this.demoGeneratedImages.get(imageId);
      if (image && image.image_url) {
        // Clean up object URL if it's a demo image
        if (this.objectUrls.has(image.image_url)) {
          URL.revokeObjectURL(image.image_url);
          this.objectUrls.delete(image.image_url);
        }
      }
      this.demoGeneratedImages.delete(imageId);
      console.log('Debug: Image deleted from demo storage');
      return;
    }

    const client = this.checkSupabase();
    const { error } = await client
      .from('generated_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      console.error('Error deleting image:', error);
      throw error;
    }

    console.log('Debug: Image deleted from database');
  }

  static async clearGeneratedImages(countryIso: string, role: ModelRole): Promise<void> {
    console.log('Debug: clearGeneratedImages called for:', { countryIso, role });
    
    if (!this.isSupabaseAvailable()) {
      // In demo mode, clear matching images from memory
      const keysToDelete: string[] = [];
      this.demoGeneratedImages.forEach((image, key) => {
        if ((image as any).country_iso === countryIso && image.role === role) {
          // Clean up object URL if it's a demo image
          if (image.image_url && this.objectUrls.has(image.image_url)) {
            URL.revokeObjectURL(image.image_url);
            this.objectUrls.delete(image.image_url);
          }
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.demoGeneratedImages.delete(key));
      console.log('Debug: Cleared', keysToDelete.length, 'images from demo storage');
      return;
    }

    const client = this.checkSupabase();
    const { error } = await client
      .from('generated_images')
      .delete()
      .eq('country_iso', countryIso)
      .eq('role', role);

    if (error) {
      console.error('Error clearing images:', error);
      throw error;
    }

    console.log('Debug: Images cleared from database');
  }

  // ==================== Action Tracking ====================
  
  static async logStyleApplicationAction(
    action: 'apply' | 'save' | 'delete' | 'clear',
    countryIso: string,
    role: ModelRole,
    styleId?: string,
    imageId?: string,
    metadata?: any
  ): Promise<void> {
    console.log('Debug: logStyleApplicationAction called:', { action, countryIso, role, styleId, imageId });
    
    if (!this.isSupabaseAvailable()) {
      // In demo mode, just log to console
      console.log('Demo mode: Style application action logged:', {
        action,
        countryIso,
        role,
        styleId,
        imageId,
        metadata,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const client = this.checkSupabase();
    const { error } = await client
      .from('style_application_logs')
      .insert({
        action,
        country_iso: countryIso,
        role,
        style_id: styleId,
        image_id: imageId,
        metadata,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging style application action:', error);
      // Don't throw error for logging failures to avoid disrupting the main flow
    } else {
      console.log('Debug: Style application action logged to database');
    }
  }
}