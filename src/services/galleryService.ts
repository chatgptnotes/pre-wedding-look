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
      .limit(1);
    
    if (error) {
      console.error('Error fetching country:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    // Return first result or null if no results
    return data && data.length > 0 ? data[0] : null;
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
      .select();
    
    if (error) {
      console.error('Error creating country model:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      throw new Error('Failed to create country model - no data returned');
    }
    
    return data[0];
  }

  static async updateCountryModel(id: string, updates: Partial<CountryModel>): Promise<CountryModel> {
    const client = this.checkSupabase(true);
    const { data, error } = await client
      .from('country_models')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating country model:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      throw new Error(`Country model with id ${id} not found or could not be updated`);
    }
    
    return data[0];
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
      .limit(1);
    
    if (error) {
      console.error('Error fetching style by ID:', error);
      return null;
    }
    
    return data && data.length > 0 ? data[0] : null;
  }

  static async createStyle(style: Omit<Style, 'id' | 'created_at' | 'updated_at'>): Promise<Style> {
    const client = this.checkSupabase(true);
    const { data, error } = await client
      .from('styles')
      .insert(style)
      .select();
    
    if (error) {
      console.error('Error creating style:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      throw new Error('Failed to create style - no data returned');
    }
    
    return data[0];
  }

  // ==================== Generation Queue ====================
  
  static async addToQueue(request: ApplyStyleRequest): Promise<GenerationQueueItem> {
    console.log('Debug: addToQueue called with request:', request);
    
    // Get country and model info
    const country = await this.getCountryByISO(request.iso);
    if (!country) {
      throw new Error(`Country not found: ${request.iso}`);
    }
    
    const model = await this.getCountryModelByRole(request.iso, request.role);
    if (!model) {
      throw new Error(`${request.role} model not found for ${request.iso}`);
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
      .select();
    
    if (queueError) {
      console.error('Error adding to queue:', queueError);
      throw new Error(`Queue error: ${queueError.message}`);
    }
    
    if (!queueData || queueData.length === 0) {
      throw new Error('Failed to add to queue - no data returned');
    }
    
    const queueItem = queueData[0];

    // For now, simulate immediate completion and create generated image
    const style = await this.getStyleById(request.styleId);
    const { data: generatedData, error: generatedError } = await client
      .from('generated_images')
      .insert({
        country_id: country.id,
        model_id: model.id,
        style_id: request.styleId,
        queue_id: queueItem.id,
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
      .select();
    
    if (generatedError) {
      console.error('Error creating generated image:', generatedError);
      throw new Error(`Failed to create generated image: ${generatedError.message}`);
    } else {
      console.log('Debug: Created generated image in database:', generatedData);
      
      // Verify the image was created correctly
      if (generatedData && generatedData.length > 0) {
        const createdImage = generatedData[0];
        console.log('Debug: Generated image details:', {
          id: createdImage.id,
          country_id: createdImage.country_id,
          role: createdImage.role,
          style_id: createdImage.style_id,
          is_active: createdImage.is_active,
          image_url: createdImage.image_url,
          style_name: createdImage.style_name
        });
      } else {
        console.warn('Warning: Generated image created but no data returned');
      }
    }
    
    // Update queue status to completed
    await client
      .from('generation_queue')
      .update({ 
        status: 'completed', 
        progress: 100, 
        completed_at: new Date().toISOString() 
      })
      .eq('id', queueItem.id);
    
    return {
      ...queueItem,
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
          styleId,
          role: request.role,
          priority: request.priority
        })
      )
    );
    return items;
  }

  static async getQueueStatus(): Promise<GenerationQueueItem[]>;
  static async getQueueStatus(countryISO: string, role: ModelRole): Promise<GenerationQueueItem[]>;
  static async getQueueStatus(countryISO?: string, role?: ModelRole): Promise<GenerationQueueItem[]> {
    console.log('Debug: getQueueStatus called with:', { countryISO, role });
    
    const client = this.checkSupabase();
    let query = client.from('generation_queue').select('*');
    
    // If parameters are provided, filter by them
    if (countryISO && role) {
      const country = await this.getCountryByISO(countryISO);
      if (!country) return [];
      
      query = query
        .eq('country_id', country.id)
        .eq('role', role);
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);
    
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

  static async getFeaturedImages(limit: number = 30): Promise<GeneratedImage[]> {
    console.log('Debug: getFeaturedImages called with limit:', limit);
    
    const client = this.checkSupabase();
    const { data, error } = await client
      .from('generated_images')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching featured images:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log('Debug: Returning featured images:', {
      total: (data || []).length,
      limit
    });
    
    return data || [];
  }

  static async incrementViewCount(imageId: string): Promise<void> {
    console.log('Debug: incrementViewCount called for image:', imageId);
    
    const client = this.checkSupabase();
    const { error } = await client
      .rpc('increment_view_count', { image_id: imageId });
    
    if (error) {
      // Fallback to manual increment if RPC function doesn't exist
      console.warn('RPC function not available, using manual increment:', error.message);
      
      const { data: currentImage, error: fetchError } = await client
        .from('generated_images')
        .select('view_count')
        .eq('id', imageId)
        .limit(1);
      
      if (fetchError) {
        console.error('Error fetching current view count:', fetchError);
        throw new Error(`Database error: ${fetchError.message}`);
      }
      
      const currentViewCount = currentImage && currentImage.length > 0 ? currentImage[0].view_count : 0;
      
      const { error: updateError } = await client
        .from('generated_images')
        .update({ 
          view_count: currentViewCount + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', imageId);
      
      if (updateError) {
        console.error('Error incrementing view count:', updateError);
        throw new Error(`Database error: ${updateError.message}`);
      }
    }
    
    console.log('Debug: View count incremented successfully');
  }

  static async uploadGeneratedImage(
    blob: Blob, 
    countryISO: string, 
    role: string, 
    fileName: string
  ): Promise<{ url: string; path: string }> {
    console.log('Debug: uploadGeneratedImage called with:', { 
      countryISO, 
      role, 
      fileName,
      blobSize: blob.size,
      blobType: blob.type
    });
    
    const client = this.checkSupabase();
    
    // Generate unique file path
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const filePath = `generated/${countryISO}/${role}/${timestamp}-${randomSuffix}.${fileExtension}`;
    
    console.log('Debug: Uploading to path:', filePath);
    
    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await client.storage
      .from('generated-images')
      .upload(filePath, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading generated image:', uploadError);
      throw new Error(`Upload error: ${uploadError.message}`);
    }
    
    console.log('Debug: Upload successful:', uploadData);
    
    // Get public URL
    const { data: urlData } = client.storage
      .from('generated-images')
      .getPublicUrl(filePath);
    
    const result = {
      url: urlData.publicUrl,
      path: filePath
    };
    
    console.log('Debug: uploadGeneratedImage completed:', result);
    return result;
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

  static subscribeToGalleryUpdates(callback: (payload: any) => void) {
    const client = this.checkSupabase();
    return client
      .channel('gallery-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generated_images'
        },
        callback
      )
      .subscribe();
  }

  // ==================== Style Application Logging ====================
  
  static async logStyleApplicationAction(
    action: string,
    countryIso: string,
    role: string,
    styleId: string,
    imageId?: string,
    details?: any
  ): Promise<void> {
    console.log('Debug: logStyleApplicationAction called:', { 
      action, 
      countryIso, 
      role, 
      styleId, 
      imageId, 
      details 
    });
    
    try {
      const client = this.checkSupabase();
      const { error } = await client
        .from('style_application_logs')
        .insert({
          action,
          country_iso: countryIso,
          role,
          style_id: styleId,
          image_id: imageId,
          details: details || {},
          timestamp: new Date().toISOString(),
          user_id: (await client.auth.getUser()).data.user?.id
        });
      
      if (error) {
        console.error('Error logging style application action:', error);
        // Don't throw error for logging failures to avoid breaking the main flow
      } else {
        console.log('Debug: Style application action logged successfully');
      }
    } catch (error) {
      console.error('Error in logStyleApplicationAction:', error);
      // Don't throw error for logging failures
    }
  }

  // ==================== Model Image Upload ====================
  
  static async uploadModelImage(
    file: File, 
    countryIso: string, 
    role: string,
    saveToStorage: boolean = true
  ): Promise<{ url: string; path: string; sha256: string }> {
    console.log('Debug: uploadModelImage called with:', { 
      countryIso, 
      role, 
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      saveToStorage
    });
    
    if (!saveToStorage) {
      // Return mock data for demo purposes
      const mockUrl = URL.createObjectURL(file);
      this.objectUrls.add(mockUrl);
      return {
        url: mockUrl,
        path: `demo/models/${countryIso}/${role}/${file.name}`,
        sha256: `demo-${Date.now()}`
      };
    }
    
    const client = this.checkSupabase(true); // Require admin access
    
    // Generate file hash for deduplication
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Generate unique file path
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filePath = `models/${countryIso}/${role}/${timestamp}-${sha256.substring(0, 8)}.${fileExtension}`;
    
    console.log('Debug: Uploading model image to path:', filePath);
    
    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await client.storage
      .from('country-models')
      .upload(filePath, file, {
        contentType: file.type || 'image/jpeg',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading model image:', uploadError);
      throw new Error(`Upload error: ${uploadError.message}`);
    }
    
    console.log('Debug: Model image upload successful:', uploadData);
    
    // Get public URL
    const { data: urlData } = client.storage
      .from('country-models')
      .getPublicUrl(filePath);
    
    const result = {
      url: urlData.publicUrl,
      path: filePath,
      sha256
    };
    
    console.log('Debug: uploadModelImage completed:', result);
    return result;
  }

  static async createOrUpdateModel(
    countryId: string,
    role: string,
    imageUrl: string,
    imagePath: string,
    sha256: string,
    metadata: any = {},
    saveToDatabase: boolean = true
  ): Promise<CountryModel> {
    console.log('Debug: createOrUpdateModel called with:', { 
      countryId, 
      role, 
      imageUrl, 
      imagePath,
      sha256,
      metadata,
      saveToDatabase 
    });
    
    if (!saveToDatabase) {
      // Return a mock model for demo purposes
      return {
        id: `demo-${Date.now()}`,
        country_id: countryId,
        role: role as ModelRole,
        source_image_url: imageUrl,
        source_image_path: imagePath,
        source_image_sha256: sha256,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata
      };
    }
    
    const client = this.checkSupabase(true);
    
    // Check if model already exists for this country and role
    const { data: existingModel, error: fetchError } = await client
      .from('country_models')
      .select('*')
      .eq('country_id', countryId)
      .eq('role', role)
      .limit(1);
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking for existing model:', fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }
    
    const existingModelRecord = existingModel && existingModel.length > 0 ? existingModel[0] : null;
    
    const modelData = {
      country_id: countryId,
      role: role as ModelRole,
      source_image_url: imageUrl,
      source_image_path: imagePath,
      source_image_sha256: sha256,
      metadata: {
        ...metadata,
        uploaded_at: new Date().toISOString()
      }
    };
    
    let result: CountryModel;
    
    if (existingModelRecord) {
      // Update existing model
      console.log('Debug: Updating existing model:', existingModelRecord.id);
      result = await this.updateCountryModel(existingModelRecord.id, {
        ...modelData,
        updated_at: new Date().toISOString()
      });
    } else {
      // Create new model
      console.log('Debug: Creating new model');
      result = await this.createCountryModel({
        ...modelData,
        is_active: true
      });
    }
    
    console.log('Debug: createOrUpdateModel completed:', result);
    return result;
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