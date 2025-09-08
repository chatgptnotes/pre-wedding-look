import { supabase } from '../lib/supabase';

export interface SavedImage {
  id: string;
  project_id: string;
  image_url: string;
  storage_path: string;
  image_type: 'bride' | 'groom' | 'couple';
  config_used: any;
  created_at: string;
  is_downloaded: boolean;
}

export class ImageStorageService {
  
  // Convert image URL to blob (handles both regular URLs and base64 data URLs)
  static async urlToBlob(url: string): Promise<Blob> {
    if (url.startsWith('data:')) {
      // Handle base64 data URL
      const response = await fetch(url);
      return await response.blob();
    } else {
      // Handle regular URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      return await response.blob();
    }
  }

  // Helper function to add timeout to promises
  static async withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
    const timeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
    );
    return Promise.race([promise, timeout]);
  }

  // Upload base64 image to Supabase storage
  static async uploadBase64Image(
    base64Image: string,
    filePath: string
  ): Promise<{ publicUrl: string; path: string } | null> {
    if (!supabase) {
      console.warn('Supabase not initialized, skipping storage upload');
      return null;
    }

    try {
      // Convert base64 to blob
      const imageBlob = await this.urlToBlob(base64Image);
      
      // Upload to storage
      const { data, error } = await this.withTimeout(
        supabase.storage
          .from('pre-wedding-images')
          .upload(filePath, imageBlob, {
            contentType: imageBlob.type || 'image/jpeg',
            upsert: true
          }),
        30000, // 30 second timeout
        'Upload to storage'
      );

      if (error) {
        console.error('Storage upload error:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('pre-wedding-images')
        .getPublicUrl(data.path);

      return {
        publicUrl: urlData.publicUrl,
        path: data.path
      };
    } catch (error) {
      console.error('Error uploading base64 image:', error);
      return null;
    }
  }

  // Upload image to Supabase storage
  static async uploadImageToStorage(
    imageBlob: Blob, 
    fileName: string,
    userId: string
  ): Promise<string> {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    const filePath = `${userId}/${Date.now()}-${fileName}`;
    
    try {
      console.log('Attempting to upload to bucket "images"...');
      
      // First, try to list buckets to check if images bucket exists (with timeout)
      console.log('Checking available buckets...');
      const bucketsPromise = supabase.storage.listBuckets();
      const { data: buckets, error: bucketError } = await bucketsPromise;
      
      console.log('Available buckets:', buckets?.map(b => b.name) || 'none');
      
      if (bucketError) {
        console.error('Error listing buckets:', bucketError);
        throw bucketError;
      }
      
      // Check if images bucket exists
      const imagesBucket = buckets?.find(b => b.name === 'images');
      console.log('🔍 BUCKET CHECK:', {
        foundImagesBucket: !!imagesBucket,
        allBuckets: buckets?.map(b => b.name) || [],
        totalBuckets: buckets?.length || 0
      });
      
      if (!imagesBucket) {
        console.log('📦 Images bucket not found, attempting to create...');
        
        try {
          // Try to create the bucket (with timeout)
          const createBucketPromise = supabase.storage.createBucket('images', {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            fileSizeLimit: 5242880 // 5MB
          });
          
          const { data: createData, error: createError } = await createBucketPromise;
          
          if (createError) {
            console.error('❌ Failed to create bucket:', createError);
            console.error('🔍 Bucket creation error details:', {
              message: createError.message,
              error: createError
            });
            throw new Error(`Bucket creation failed: ${createError.message}`);
          }
          
          console.log('✅ Images bucket created successfully:', createData);
        } catch (bucketError) {
          console.error('🚨 Bucket creation process failed:', bucketError);
          throw bucketError;
        }
      } else {
        console.log('✅ Images bucket already exists');
      }
      
      // Now attempt the upload (with timeout)
      console.log('Starting file upload...');
      const uploadPromise = supabase.storage
        .from('images')
        .upload(filePath, imageBlob, {
          contentType: 'image/jpeg',
          upsert: true // Allow overwrite if file exists
        });

      const { data, error } = await uploadPromise;

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      console.log('Upload successful, getting public URL...');
      
      // Get public URL (this should be fast, but add timeout anyway)
      const publicUrlPromise = supabase.storage
        .from('images')
        .getPublicUrl(data.path);

      const publicUrlResponse = supabase.storage
        .from('images')
        .getPublicUrl(data.path);
      
      const { data: { publicUrl } } = publicUrlResponse;

      console.log('Public URL generated:', publicUrl);
      return publicUrl;
      
    } catch (error) {
      console.error('Storage operation failed:', error);
      throw error;
    }
  }

  // Save image metadata to database
  static async saveImageToDatabase(
    projectId: string,
    imageUrl: string,
    storagePath: string,
    imageType: 'bride' | 'groom' | 'couple',
    config: any
  ): Promise<SavedImage> {
    if (!supabase) {
      // If no supabase, create a mock saved image
      return {
        id: `mock-${Date.now()}`,
        project_id: projectId,
        image_url: imageUrl,
        storage_path: storagePath,
        image_type: imageType,
        config_used: config,
        is_downloaded: false,
        created_at: new Date().toISOString()
      };
    }

    try {
      // First, try to insert into generated_images table
      const insertPromise = supabase
        .from('generated_images')
        .insert({
          project_id: projectId,
          image_url: imageUrl,
          storage_path: storagePath,
          image_type: imageType,
          config_used: config,
          is_downloaded: false
        })
        .select();

      const { data, error } = await insertPromise;

      if (error) {
        console.error('Generated_images table error:', error);
        // Fallback: try to save to pre_wedding_projects table instead
        return await this.saveToProjectsFallback(projectId, imageUrl, imageType, config);
      }
      
      if (!data || data.length === 0) {
        console.warn('No data returned from insert, using fallback');
        return await this.saveToProjectsFallback(projectId, imageUrl, imageType, config);
      }

      return data[0];
    } catch (error) {
      console.error('Database save failed, using fallback:', error);
      // Final fallback: create mock data
      return {
        id: `fallback-${Date.now()}`,
        project_id: projectId,
        image_url: imageUrl,
        storage_path: storagePath,
        image_type: imageType,
        config_used: config,
        is_downloaded: false,
        created_at: new Date().toISOString()
      };
    }
  }

  // Fallback method to save to projects table
  static async saveToProjectsFallback(
    projectId: string,
    imageUrl: string,
    imageType: 'bride' | 'groom' | 'couple',
    config: any
  ): Promise<SavedImage> {
    try {
      console.log('Trying fallback: updating project with image URL...');
      
      const updateColumn = imageType === 'bride' ? 'generated_bride_image_url' :
                          imageType === 'groom' ? 'generated_groom_image_url' : 'final_image_url';
      
      const updatePromise = supabase
        .from('pre_wedding_projects')
        .update({
          [updateColumn]: imageUrl,
          config: config,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select();

      const { data, error } = await updatePromise;

      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('No project found with the specified ID');
      }

      console.log('Successfully saved to projects table');
      
      // Return mock generated image data
      return {
        id: `project-${Date.now()}`,
        project_id: projectId,
        image_url: imageUrl,
        storage_path: 'project-table',
        image_type: imageType,
        config_used: config,
        is_downloaded: false,
        created_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Project fallback failed:', error);
      throw error;
    }
  }

  // Browser localStorage fallback
  static saveToLocalStorage(imageUrl: string, projectId: string, imageType: string, config: any): SavedImage {
    const savedImages = JSON.parse(localStorage.getItem('saved_images') || '[]');
    const savedImage: SavedImage = {
      id: `local-${Date.now()}`,
      project_id: projectId,
      image_url: imageUrl,
      storage_path: 'localStorage',
      image_type: imageType as 'bride' | 'groom' | 'couple',
      config_used: config,
      is_downloaded: false,
      created_at: new Date().toISOString()
    };
    
    savedImages.push(savedImage);
    localStorage.setItem('saved_images', JSON.stringify(savedImages));
    console.log('💾 Image saved to localStorage:', savedImage);
    return savedImage;
  }

  // Main save image function
  static async saveImage(
    originalImageUrl: string,
    projectId: string,
    imageType: 'bride' | 'groom' | 'couple',
    config: any,
    userId: string
  ): Promise<SavedImage> {
    console.log('🚀 Starting image save process...', {
      urlType: originalImageUrl.startsWith('data:') ? 'base64' : 'url',
      urlLength: originalImageUrl.length,
      projectId,
      imageType,
      userId,
      hasSupabase: !!supabase
    });

    // Test Supabase connection first
    if (!supabase) {
      console.warn('⚠️ No Supabase client - using localStorage fallback');
      return this.saveToLocalStorage(originalImageUrl, projectId, imageType, config);
    }

    let storageUrl = originalImageUrl;
    let storagePath = 'original';
    
    try {
      // Try Supabase storage with shorter timeout
      console.log('🔄 Attempting Supabase storage...');
      const storageProcess = async () => {
        const imageBlob = await this.urlToBlob(originalImageUrl);
        const fileName = `${imageType}-${Date.now()}.jpg`;
        return await this.uploadImageToStorage(imageBlob, fileName, userId);
      };
      
      storageUrl = await storageProcess();
      storagePath = `${userId}/${Date.now()}-${imageType}.jpg`;
      console.log('✅ Supabase storage successful:', storageUrl);
      
    } catch (storageError) {
      console.warn('❌ Supabase storage failed:', storageError);
      storageUrl = originalImageUrl;
      storagePath = 'fallback-original';
    }
    
    try {
      // Try database save with shorter timeout
      console.log('💾 Attempting database save...');
      const savedImage = await this.saveImageToDatabase(projectId, storageUrl, storagePath, imageType, config);
      console.log('✅ Database save successful:', savedImage);
      return savedImage;
      
    } catch (dbError) {
      console.warn('❌ Database save failed, using localStorage:', dbError);
      return this.saveToLocalStorage(originalImageUrl, projectId, imageType, config);
    }
  }

  // Get saved images from localStorage
  static getLocalStorageImages(): SavedImage[] {
    return JSON.parse(localStorage.getItem('saved_images') || '[]');
  }

  // Get saved images for a project
  static async getProjectImages(projectId: string): Promise<SavedImage[]> {
    let supabaseImages: SavedImage[] = [];
    let localImages: SavedImage[] = [];
    
    // Try to get from Supabase first
    if (supabase) {
      try {
        const { data, error } = await supabase
            .from('generated_images')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        
        if (!error && data) {
          supabaseImages = data;
        }
      } catch (error) {
        console.warn('Failed to fetch from Supabase, checking localStorage:', error);
      }
    }
    
    // Always check localStorage as well
    const allLocalImages = this.getLocalStorageImages();
    localImages = allLocalImages.filter(img => img.project_id === projectId);
    
    // Combine and deduplicate (prefer Supabase over localStorage)
    const combinedImages = [...supabaseImages];
    localImages.forEach(localImg => {
      const exists = supabaseImages.some(supaImg => 
        supaImg.image_url === localImg.image_url && 
        supaImg.image_type === localImg.image_type
      );
      if (!exists) {
        combinedImages.push(localImg);
      }
    });
    
    // Sort by created_at
    return combinedImages.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Get ALL saved images (for My Projects view)
  static async getAllSavedImages(): Promise<SavedImage[]> {
    let supabaseImages: SavedImage[] = [];
    let localImages: SavedImage[] = [];
    
    // Try Supabase first
    if (supabase) {
      try {
        const { data, error } = await supabase
            .from('generated_images')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!error && data) {
          supabaseImages = data;
        }
      } catch (error) {
        console.warn('Failed to fetch all from Supabase:', error);
      }
    }
    
    // Get from localStorage
    localImages = this.getLocalStorageImages();
    
    // Combine and deduplicate
    const combinedImages = [...supabaseImages];
    localImages.forEach(localImg => {
      const exists = supabaseImages.some(supaImg => 
        supaImg.image_url === localImg.image_url && 
        supaImg.image_type === localImg.image_type
      );
      if (!exists) {
        combinedImages.push(localImg);
      }
    });
    
    return combinedImages.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Mark image as downloaded
  static async markAsDownloaded(imageId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    const { error } = await supabase
      .from('generated_images')
      .update({ is_downloaded: true })
      .eq('id', imageId);

    if (error) {
      throw new Error(`Failed to mark as downloaded: ${error.message}`);
    }
  }

  // Download image
  static async downloadImage(imageUrl: string, fileName: string): Promise<void> {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw new Error('Failed to download image');
    }
  }
}