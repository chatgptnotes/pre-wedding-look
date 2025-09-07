// Gallery System Types

export type ModelRole = 'bride' | 'groom';
export type StyleType = 'attire' | 'hairstyle' | 'backdrop' | 'jewelry' | 'composite';
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Country {
  id: string;
  iso_code: string;
  name: string;
  flag_emoji: string;
  cultural_styles: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CountryModel {
  id: string;
  country_id: string;
  role: ModelRole;
  name?: string;
  source_image_url: string;
  source_image_path: string;
  source_image_sha256: string;
  thumbnail_url?: string;
  face_encoding?: any;
  metadata?: {
    age_range?: string;
    ethnicity?: string;
    description?: string;
  };
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Style {
  id: string;
  name: string;
  type: StyleType;
  category: string;
  prompt_template: {
    positive: string;
    negative: string;
    params: {
      strength?: number;
      [key: string]: any;
    };
  };
  cultural_tags: string[];
  preview_url?: string;
  thumbnail_url?: string;
  asset_refs?: any[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface GeneratedImage {
  id: string;
  country_id: string;
  model_id: string;
  style_id: string;
  role: ModelRole;
  image_url: string;
  image_path: string;
  thumbnail_url?: string;
  generation_params?: any;
  quality_score?: number;
  user_ratings?: any[];
  view_count: number;
  is_featured: boolean;
  is_saved?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  country?: Country;
  model?: CountryModel;
  style?: Style;
  style_name?: string; // For convenience when style is not joined
}

export interface GenerationQueueItem {
  id: string;
  country_id: string;
  model_id: string;
  style_id: string;
  role: ModelRole;
  status: GenerationStatus;
  priority: number;
  progress: number;
  variations: number;
  error_message?: string;
  retry_count: number;
  created_by?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  // Joined data
  country?: Country;
  model?: CountryModel;
  style?: Style;
}

// Request/Response types for API
export interface CreateModelRequest {
  iso: string;
  role: ModelRole;
  name?: string;
  file: File;
  metadata?: {
    age_range?: string;
    ethnicity?: string;
    description?: string;
  };
}

export interface ApplyStyleRequest {
  iso: string;
  role: ModelRole;
  styleId: string;
  variations?: number;
  priority?: number;
}

export interface BatchGenerateRequest {
  iso: string;
  role: ModelRole;
  styleIds: string[];
  priority?: number;
}

export interface GalleryFilters {
  country?: string;
  role?: ModelRole;
  styleType?: StyleType;
  culturalTags?: string[];
  featured?: boolean;
}

export interface GalleryResponse {
  images: GeneratedImage[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: GalleryFilters;
}

// Helper types
export interface CountryWithModels extends Country {
  models: {
    bride?: CountryModel;
    groom?: CountryModel;
  };
  imageCount: number;
}

export interface StyleWithStats extends Style {
  usageCount: number;
  averageRating: number;
  lastUsed?: string;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  averageProcessingTime: number;
}