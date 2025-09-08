# Country Models System - Implementation Blueprint

## Overview
Implementation plan for adding country-specific model galleries to PreWedding AI Studio, based on the provided architecture blueprint.

## Database Schema Integration

### New Tables to Add

```sql
-- Countries (extending current system)
create table countries (
  id uuid primary key default gen_random_uuid(),
  iso_code text unique not null check (char_length(iso_code)=2),
  name text not null,
  flag_emoji text not null,
  cultural_styles jsonb default '[]'::jsonb, -- reference to cultural styles
  created_at timestamptz default now()
);

-- Country Models (core concept)
create table country_models (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(id) on delete cascade,
  role model_role not null,
  source_image_url text not null,
  source_image_sha256 text not null,
  face_encoding jsonb, -- for consistency checking
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now(),
  unique(country_id, role)
);

-- Enhanced Styles (mapping current constants)
create table styles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type style_type not null,
  category text not null, -- 'attire', 'location', 'pose', 'jewelry', etc.
  prompt_template jsonb not null,
  cultural_tags text[] default '{}', -- ['indian', 'traditional', 'marathi']
  preview_url text,
  asset_refs jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- Generated Galleries
create table generated_images (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(id) on delete cascade,
  model_id uuid not null references country_models(id) on delete cascade,
  style_id uuid not null references styles(id) on delete cascade,
  role model_role not null,
  image_url text not null,
  generation_params jsonb default '{}',
  quality_score float,
  user_ratings jsonb default '[]'::jsonb,
  is_featured boolean default false,
  created_at timestamptz default now()
);

-- Generation Queue
create table generation_queue (
  id uuid primary key default gen_random_uuid(),
  country_iso text not null,
  role model_role not null,
  style_id uuid not null references styles(id),
  status text not null default 'pending', -- pending, processing, completed, failed
  progress integer default 0,
  error_message text,
  created_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz
);
```

## Storage Structure

```
supabase-storage/
├── faces/
│   ├── countries/
│   │   ├── IN/
│   │   │   ├── bride/source.jpg
│   │   │   └── groom/source.jpg
│   │   ├── US/
│   │   │   ├── bride/source.jpg
│   │   │   └── groom/source.jpg
│   │   └── ...
├── galleries/
│   ├── countries/
│   │   ├── IN/
│   │   │   ├── bride/
│   │   │   │   ├── style-001/
│   │   │   │   │   ├── generated-001.jpg
│   │   │   │   │   └── generated-002.jpg
│   │   │   │   └── style-002/...
│   │   │   └── groom/...
│   │   └── ...
└── styles/
    ├── previews/
    │   ├── attire-001.jpg
    │   └── location-001.jpg
    └── assets/
        ├── loras/
        └── controlnets/
```

## API Endpoints

### Admin Model Management
```typescript
// POST /api/admin/models
interface CreateModelRequest {
  iso: string;
  role: 'bride' | 'groom';
  file: File;
  metadata?: {
    ethnicity?: string;
    age_range?: string;
    description?: string;
  };
}

// GET /api/admin/models?iso=IN
interface ModelResponse {
  bride?: CountryModel;
  groom?: CountryModel;
}
```

### Style Application
```typescript
// POST /api/admin/apply-style
interface ApplyStyleRequest {
  iso: string;
  role: 'bride' | 'groom';
  styleId: string;
  variations?: number; // generate 1-5 variations
}

// POST /api/admin/batch-generate
interface BatchGenerateRequest {
  iso: string;
  role: 'bride' | 'groom';
  styleIds: string[];
  priority?: 'low' | 'normal' | 'high';
}
```

### Gallery Endpoints
```typescript
// GET /api/gallery?iso=IN&role=bride&style=attire
interface GalleryResponse {
  images: GeneratedImage[];
  pagination: PaginationMeta;
  filters: FilterOptions;
}

// GET /api/gallery/featured?limit=20
interface FeaturedResponse {
  images: FeaturedImage[];
  countries: CountryStats[];
}
```

## React Components Integration

### Enhanced Admin Panel
```tsx
function CountryModelsAdmin() {
  const [selectedCountry, setSelectedCountry] = useState<string>('IN');
  const [generationQueue, setGenerationQueue] = useState<QueueItem[]>([]);
  
  return (
    <div className="admin-panel">
      <CountrySelector 
        selected={selectedCountry}
        onChange={setSelectedCountry}
      />
      
      <ModelManager 
        country={selectedCountry}
        onModelUpdate={refreshGallery}
      />
      
      <StylesGrid 
        country={selectedCountry}
        onApplyStyle={handleStyleApplication}
        showApplyButtons={true}
      />
      
      <GenerationQueue 
        queue={generationQueue}
        onCancel={cancelGeneration}
      />
    </div>
  );
}
```

### Public Gallery
```tsx
function CountryGallery() {
  const [country, setCountry] = useState<string>('IN');
  const [role, setRole] = useState<'bride' | 'groom'>('bride');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  
  useEffect(() => {
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('gallery-updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'generated_images' },
        (payload) => refreshImages()
      )
      .subscribe();
      
    return () => subscription.unsubscribe();
  }, [country, role]);
  
  return (
    <div className="gallery">
      <CountryRoleSelector 
        country={country} 
        role={role}
        onCountryChange={setCountry}
        onRoleChange={setRole}
      />
      
      <ImageGrid 
        images={images}
        onImageClick={openLightbox}
        layout="masonry"
      />
    </div>
  );
}
```

## Background Processing

### Queue Worker
```typescript
// lib/queue-worker.ts
export async function processStyleApplication(job: Job) {
  const { iso, role, styleId } = job.data;
  
  try {
    // Update status
    await updateQueueStatus(job.id, 'processing', 10);
    
    // Fetch model and style
    const model = await getCountryModel(iso, role);
    const style = await getStyle(styleId);
    
    await updateQueueStatus(job.id, 'processing', 30);
    
    // Generate image(s)
    const variations = await generateStyleVariations({
      sourceImage: model.source_image_url,
      style: style.prompt_template,
      assets: style.asset_refs,
      count: job.data.variations || 1
    });
    
    await updateQueueStatus(job.id, 'processing', 80);
    
    // Store results
    for (const imageUrl of variations) {
      await insertGeneratedImage({
        country_id: model.country_id,
        model_id: model.id,
        style_id: styleId,
        role,
        image_url: imageUrl,
        generation_params: job.data
      });
    }
    
    await updateQueueStatus(job.id, 'completed', 100);
    
  } catch (error) {
    await updateQueueStatus(job.id, 'failed', 0, error.message);
    throw error;
  }
}
```

## Current App Integration Points

### 1. Constants Migration
```typescript
// Convert existing constants to database styles
const migrateConstants = async () => {
  // Convert BRIDE_ATTIRE to styles table
  for (const attire of BRIDE_ATTIRE) {
    await createStyle({
      name: attire.label,
      type: 'attire',
      category: 'bride',
      prompt_template: {
        positive: attire.promptValue,
        negative: "low quality, blurry",
        params: { strength: 0.8 }
      },
      preview_url: attire.imageUrl
    });
  }
  
  // Convert LOCATIONS to backdrop styles
  // Convert HAIRSTYLES to hairstyle styles
  // etc...
};
```

### 2. Enhanced Tab System
```tsx
function EnhancedTabNavigation() {
  const tabs = [
    { id: 'classic', label: 'Classic Mode' },
    { id: 'gallery', label: 'Country Galleries', new: true },
    { id: 'storyboard', label: 'Storyboard' },
    // ... other existing tabs
  ];
  
  return (
    <TabSystem 
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
}
```

### 3. Gallery Integration
```tsx
function GalleryTab() {
  return (
    <div className="gallery-tab">
      <div className="gallery-intro">
        <h2>Explore Global Wedding Styles</h2>
        <p>See how our AI adapts to different cultural aesthetics</p>
      </div>
      
      <CountryGrid countries={SUPPORTED_COUNTRIES} />
      
      <FeaturedGallery limit={12} />
      
      <StyleComparison 
        countries={['IN', 'US', 'JP', 'BR']}
        style="traditional-attire"
      />
    </div>
  );
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Database schema setup
- Storage bucket configuration
- Basic admin model upload
- Simple style application

### Phase 2: Core Features (Week 3-4)
- Queue system implementation
- Gallery UI components
- Real-time updates
- Basic batch generation

### Phase 3: Enhancement (Week 5-6)
- Advanced filtering and search
- Quality scoring system
- Featured image curation
- Performance optimization

### Phase 4: Polish (Week 7-8)
- Advanced admin tools
- Analytics and insights
- SEO optimization
- Launch preparation

## Benefits for Current App

### User Experience
- **Discovery**: Users can explore styles across cultures
- **Inspiration**: See real results before uploading own photos
- **Trust**: Professional galleries build confidence
- **Learning**: Understand cultural authenticity

### Business Value
- **Showcase**: Demonstrate AI capabilities
- **Marketing**: Featured galleries for social media
- **Partnerships**: Cultural consultants and photographers
- **Scaling**: Template for expanding to new markets

### Technical Advantages
- **Performance**: Pre-generated results load instantly
- **Reliability**: Reduces dependency on real-time generation
- **Quality**: Curated results maintain high standards
- **Analytics**: Track popular styles and countries

## Migration Strategy

### From Current System
1. **Preserve Existing**: Keep current user upload flow
2. **Add Gallery Tab**: New tab for browsing galleries
3. **Admin Enhancement**: Add model management to admin panel
4. **Gradual Rollout**: Start with 3-5 countries
5. **User Feedback**: Iterate based on usage patterns

### Data Migration
```sql
-- Migrate existing constants
INSERT INTO styles (name, type, category, prompt_template, preview_url)
SELECT 
  label,
  'attire'::style_type,
  'bride',
  jsonb_build_object('positive', prompt_value, 'negative', 'low quality'),
  image_url
FROM (VALUES 
  ('Red Lehenga', 'a stunning, intricately embroidered red lehenga', '/images/bride/attire/Red-lahenga.jpg'),
  -- ... other constant values
) AS constants(label, prompt_value, image_url);
```

This blueprint provides a solid foundation for implementing country-specific model galleries while preserving the excellent work already done in the PreWedding AI Studio.