/**
 * Global Data Service for Continental Wedding Management
 * Handles wedding traditions, styles, and cultural data across all continents
 */

import { supabase } from '../lib/supabase';
import { geolocationService, RegionalConfig, CountryInfo, CONTINENTAL_STYLES } from './geolocationService';

export interface ContinentalWeddingStyle {
  id: string;
  continent: string;
  country: string;
  country_code: string;
  style_name: string;
  style_category: 'traditional' | 'modern' | 'fusion';
  wedding_type: string;
  description: string;
  
  // Bride Styling
  bride_attire: string;
  bride_attire_description: string;
  bride_jewelry: string;
  bride_hairstyle: string;
  bride_makeup: string;
  
  // Groom Styling  
  groom_attire: string;
  groom_attire_description: string;
  groom_accessories: string;
  groom_hairstyle: string;
  
  // Ceremony Details
  venue_style: string;
  venue_description: string;
  ceremony_type: string;
  ceremony_elements: string[];
  cultural_rituals: string[];
  
  // Visual Elements
  color_palette: string[];
  seasonal_preferences: string;
  photography_style: string;
  decoration_elements: string[];
  
  // Metadata
  popularity_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // AI Generation
  base_prompt: string;
  style_modifiers: string[];
  cultural_keywords: string[];
}

export interface RegionalVenue {
  id: string;
  continent: string;
  country: string;
  venue_name: string;
  venue_type: 'temple' | 'beach' | 'palace' | 'garden' | 'mountain' | 'urban' | 'historical';
  description: string;
  image_url: string;
  ai_prompt: string;
  cultural_significance: string;
  best_seasons: string[];
  photography_tips: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface CulturalAttire {
  id: string;
  continent: string;
  country: string;
  attire_name: string;
  gender: 'bride' | 'groom' | 'unisex';
  attire_type: 'traditional' | 'modern' | 'ceremonial' | 'reception';
  description: string;
  fabric_details: string;
  color_significance: string;
  occasions: string[];
  styling_notes: string;
  ai_prompt: string;
  image_url: string;
  historical_context: string;
  modern_adaptations: string;
  price_range: 'budget' | 'mid-range' | 'luxury';
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface GlobalTradition {
  id: string;
  tradition_name: string;
  continent: string;
  countries: string[];
  tradition_type: 'ceremony' | 'ritual' | 'celebration' | 'blessing';
  description: string;
  significance: string;
  typical_timing: string;
  required_items: string[];
  participant_roles: string[];
  modern_variations: string;
  photo_opportunities: string[];
  ai_scene_prompt: string;
  cultural_sensitivity_notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserLocationPreference {
  user_id: string;
  detected_country: string;
  detected_continent: string;
  preferred_continent: string;
  preferred_countries: string[];
  favorite_styles: string[];
  custom_cultural_mix: string[];
  updated_at: string;
}

export class GlobalDataService {
  private static instance: GlobalDataService;

  public static getInstance(): GlobalDataService {
    if (!GlobalDataService.instance) {
      GlobalDataService.instance = new GlobalDataService();
    }
    return GlobalDataService.instance;
  }

  /**
   * Initialize global wedding data on first app load
   */
  async initializeGlobalData(): Promise<void> {
    try {
      console.log('Initializing global wedding data...');
      
      // Check if data already exists
      const { data: existingStyles, error } = await supabase
        .from('continental_wedding_styles')
        .select('id')
        .limit(1);

      if (error) {
        console.warn('Continental styles table not found, using local data');
        return;
      }

      // If no data exists, seed with initial continental styles
      if (!existingStyles || existingStyles.length === 0) {
        await this.seedInitialData();
      }

    } catch (error) {
      console.error('Error initializing global data:', error);
      // Fallback to local data if database is unavailable
    }
  }

  /**
   * Get wedding styles based on user's detected location
   */
  async getLocationBasedStyles(limit: number = 10): Promise<{
    userLocation: CountryInfo | null;
    regionalStyles: ContinentalWeddingStyle[];
    recommendations: {
      primaryStyles: ContinentalWeddingStyle[];
      alternativeStyles: ContinentalWeddingStyle[];
      culturalTips: string[];
    };
  }> {
    // Get user's location
    const userLocation = await geolocationService.detectCountry();
    const continent = userLocation?.continent || 'North America';

    try {
      // Fetch styles from database
      const { data: regionalStyles, error } = await supabase
        .from('continental_wedding_styles')
        .select('*')
        .eq('continent', continent)
        .eq('is_active', true)
        .order('popularity_score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get alternative styles from other continents
      const { data: alternativeStyles } = await supabase
        .from('continental_wedding_styles')
        .select('*')
        .neq('continent', continent)
        .eq('is_active', true)
        .eq('style_category', 'fusion')
        .limit(5);

      return {
        userLocation,
        regionalStyles: regionalStyles || [],
        recommendations: {
          primaryStyles: (regionalStyles || []).slice(0, 5),
          alternativeStyles: alternativeStyles || [],
          culturalTips: this.getCulturalTips(continent)
        }
      };

    } catch (error) {
      console.error('Error fetching location-based styles:', error);
      
      // Fallback to local data
      const localConfig = geolocationService.getRegionalStyles(userLocation);
      return {
        userLocation,
        regionalStyles: this.convertLocalToDBFormat(localConfig, continent),
        recommendations: {
          primaryStyles: this.convertLocalToDBFormat(localConfig, continent).slice(0, 3),
          alternativeStyles: [],
          culturalTips: this.getCulturalTips(continent)
        }
      };
    }
  }

  /**
   * Search wedding styles across all continents
   */
  async searchGlobalStyles(query: string, filters: {
    continent?: string;
    country?: string;
    styleType?: string;
    priceRange?: string;
  } = {}): Promise<ContinentalWeddingStyle[]> {
    try {
      let queryBuilder = supabase
        .from('continental_wedding_styles')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters.continent) {
        queryBuilder = queryBuilder.eq('continent', filters.continent);
      }
      if (filters.country) {
        queryBuilder = queryBuilder.eq('country', filters.country);
      }
      if (filters.styleType) {
        queryBuilder = queryBuilder.eq('style_category', filters.styleType);
      }

      // Text search across multiple fields
      if (query) {
        queryBuilder = queryBuilder.or(
          `style_name.ilike.%${query}%,description.ilike.%${query}%,ceremony_type.ilike.%${query}%`
        );
      }

      const { data, error } = await queryBuilder
        .order('popularity_score', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error searching global styles:', error);
      return [];
    }
  }

  /**
   * Get venues for a specific continent/country
   */
  async getRegionalVenues(continent: string, country?: string): Promise<RegionalVenue[]> {
    try {
      let queryBuilder = supabase
        .from('regional_venues')
        .select('*')
        .eq('continent', continent);

      if (country) {
        queryBuilder = queryBuilder.eq('country', country);
      }

      const { data, error } = await queryBuilder
        .eq('is_featured', true)
        .order('venue_name')
        .limit(20);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error fetching regional venues:', error);
      return [];
    }
  }

  /**
   * Get cultural attire options
   */
  async getCulturalAttire(continent: string, gender: 'bride' | 'groom' | 'both' = 'both'): Promise<CulturalAttire[]> {
    try {
      let queryBuilder = supabase
        .from('cultural_attire')
        .select('*')
        .eq('continent', continent);

      if (gender !== 'both') {
        queryBuilder = queryBuilder.or(`gender.eq.${gender},gender.eq.unisex`);
      }

      const { data, error } = await queryBuilder
        .eq('is_featured', true)
        .order('attire_name')
        .limit(30);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error fetching cultural attire:', error);
      return [];
    }
  }

  /**
   * Get global traditions and rituals
   */
  async getGlobalTraditions(continent?: string): Promise<GlobalTradition[]> {
    try {
      let queryBuilder = supabase
        .from('global_traditions')
        .select('*')
        .eq('is_active', true);

      if (continent) {
        queryBuilder = queryBuilder.eq('continent', continent);
      }

      const { data, error } = await queryBuilder
        .order('tradition_name')
        .limit(50);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error fetching global traditions:', error);
      return [];
    }
  }

  /**
   * Save user location preferences
   */
  async saveUserPreferences(userId: string, preferences: {
    preferredContinent?: string;
    preferredCountries?: string[];
    favoriteStyles?: string[];
    culturalMix?: string[];
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_location_preferences')
        .upsert({
          user_id: userId,
          preferred_continent: preferences.preferredContinent,
          preferred_countries: preferences.preferredCountries,
          favorite_styles: preferences.favoriteStyles,
          custom_cultural_mix: preferences.culturalMix,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  }

  /**
   * Get admin statistics for global data
   */
  async getGlobalDataStats(): Promise<{
    totalStyles: number;
    totalVenues: number;
    totalAttire: number;
    totalTraditions: number;
    continentBreakdown: Record<string, number>;
    popularStyles: ContinentalWeddingStyle[];
  }> {
    try {
      const [stylesCount, venuesCount, attireCount, traditionsCount, popularStyles] = await Promise.all([
        supabase.from('continental_wedding_styles').select('id', { count: 'exact' }),
        supabase.from('regional_venues').select('id', { count: 'exact' }),
        supabase.from('cultural_attire').select('id', { count: 'exact' }),
        supabase.from('global_traditions').select('id', { count: 'exact' }),
        supabase.from('continental_wedding_styles')
          .select('*')
          .eq('is_active', true)
          .order('popularity_score', { ascending: false })
          .limit(10)
      ]);

      // Get continent breakdown
      const { data: continentData } = await supabase
        .from('continental_wedding_styles')
        .select('continent')
        .eq('is_active', true);

      const continentBreakdown: Record<string, number> = {};
      continentData?.forEach(item => {
        continentBreakdown[item.continent] = (continentBreakdown[item.continent] || 0) + 1;
      });

      return {
        totalStyles: stylesCount.count || 0,
        totalVenues: venuesCount.count || 0,
        totalAttire: attireCount.count || 0,
        totalTraditions: traditionsCount.count || 0,
        continentBreakdown,
        popularStyles: popularStyles.data || []
      };

    } catch (error) {
      console.error('Error fetching global data stats:', error);
      return {
        totalStyles: 0,
        totalVenues: 0,
        totalAttire: 0,
        totalTraditions: 0,
        continentBreakdown: {},
        popularStyles: []
      };
    }
  }

  /**
   * Private helper methods
   */
  private async seedInitialData(): Promise<void> {
    console.log('Seeding initial global wedding data...');

    const initialData: Partial<ContinentalWeddingStyle>[] = [];

    // Convert local CONTINENTAL_STYLES to database format
    Object.entries(CONTINENTAL_STYLES).forEach(([key, config]) => {
      config.countries.forEach((country, index) => {
        initialData.push({
          continent: config.continent,
          country: country,
          country_code: this.getCountryCode(country),
          style_name: `${country} Traditional Wedding`,
          style_category: 'traditional',
          wedding_type: config.defaultStyles.weddingTraditions[0] || 'Traditional Ceremony',
          description: `Authentic ${country} wedding style with traditional elements`,
          
          bride_attire: config.defaultStyles.brideAttire[0] || 'Traditional wedding dress',
          bride_attire_description: config.defaultStyles.brideAttire[0] || 'Traditional wedding attire',
          bride_jewelry: 'Traditional jewelry set',
          bride_hairstyle: 'Traditional bridal hairstyle',
          bride_makeup: 'Traditional bridal makeup',
          
          groom_attire: config.defaultStyles.groomAttire[0] || 'Traditional suit',
          groom_attire_description: config.defaultStyles.groomAttire[0] || 'Traditional groom attire',
          groom_accessories: 'Traditional accessories',
          groom_hairstyle: 'Traditional groom hairstyle',
          
          venue_style: config.defaultStyles.venues[0] || 'Traditional venue',
          venue_description: config.defaultStyles.venues[0] || 'Traditional wedding venue',
          ceremony_type: config.defaultStyles.ceremonies[0] || 'Traditional ceremony',
          ceremony_elements: config.defaultStyles.ceremonies,
          cultural_rituals: config.defaultStyles.weddingTraditions,
          
          color_palette: config.defaultStyles.colors,
          seasonal_preferences: 'All seasons',
          photography_style: 'Traditional',
          decoration_elements: ['Traditional decorations'],
          
          popularity_score: Math.floor(Math.random() * 100) + 50,
          is_active: true,
          
          base_prompt: `${config.defaultStyles.weddingTraditions[0]}, ${config.defaultStyles.brideAttire[0]}, ${config.defaultStyles.groomAttire[0]}, ${config.defaultStyles.venues[0]}`,
          style_modifiers: config.defaultStyles.colors,
          cultural_keywords: [country.toLowerCase(), config.continent.toLowerCase()]
        });
      });
    });

    try {
      const { error } = await supabase
        .from('continental_wedding_styles')
        .insert(initialData);

      if (error) {
        console.error('Error seeding data:', error);
      } else {
        console.log('Successfully seeded global wedding data');
      }
    } catch (error) {
      console.error('Error in seedInitialData:', error);
    }
  }

  private convertLocalToDBFormat(config: RegionalConfig, continent: string): ContinentalWeddingStyle[] {
    return config.countries.slice(0, 3).map((country, index) => ({
      id: `local-${continent}-${index}`,
      continent: config.continent,
      country: country,
      country_code: this.getCountryCode(country),
      style_name: `${country} Traditional`,
      style_category: 'traditional' as const,
      wedding_type: config.defaultStyles.weddingTraditions[0] || 'Traditional',
      description: `Traditional ${country} wedding style`,
      
      bride_attire: config.defaultStyles.brideAttire[0] || '',
      bride_attire_description: config.defaultStyles.brideAttire[0] || '',
      bride_jewelry: 'Traditional jewelry',
      bride_hairstyle: 'Traditional style',
      bride_makeup: 'Traditional makeup',
      
      groom_attire: config.defaultStyles.groomAttire[0] || '',
      groom_attire_description: config.defaultStyles.groomAttire[0] || '',
      groom_accessories: 'Traditional accessories',
      groom_hairstyle: 'Traditional style',
      
      venue_style: config.defaultStyles.venues[0] || '',
      venue_description: config.defaultStyles.venues[0] || '',
      ceremony_type: config.defaultStyles.ceremonies[0] || '',
      ceremony_elements: config.defaultStyles.ceremonies,
      cultural_rituals: config.defaultStyles.weddingTraditions,
      
      color_palette: config.defaultStyles.colors,
      seasonal_preferences: 'All seasons',
      photography_style: 'Traditional',
      decoration_elements: ['Traditional'],
      
      popularity_score: 75,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      
      base_prompt: config.defaultStyles.weddingTraditions[0] || '',
      style_modifiers: config.defaultStyles.colors,
      cultural_keywords: [country.toLowerCase()]
    }));
  }

  private getCulturalTips(continent: string): string[] {
    const tips: Record<string, string[]> = {
      'Asia': [
        'Red and gold colors are traditionally auspicious',
        'Consider seasonal festivals in your planning',
        'Family involvement is central to ceremonies'
      ],
      'Europe': [
        'White is traditional for bride attire',
        'Church ceremonies are common',
        'Seasonal considerations for outdoor venues'
      ],
      'North America': [
        'Mix of traditional and modern elements',
        'Outdoor ceremonies are popular',
        'Cultural fusion is celebrated'
      ],
      'Africa': [
        'Vibrant colors and patterns are significant',
        'Community participation is important',
        'Traditional music and dance are integral'
      ],
      'South America': [
        'Passionate and colorful celebrations',
        'Family traditions are honored',
        'Music and dance are essential elements'
      ],
      'Middle East': [
        'Modesty in attire is important',
        'Gold and rich colors are preferred',
        'Extended celebration periods are common'
      ],
      'Oceania': [
        'Natural settings are popular',
        'Incorporate local cultural elements',
        'Seasonal weather considerations are important'
      ]
    };

    return tips[continent] || tips['North America'];
  }

  private getCountryCode(country: string): string {
    const codes: Record<string, string> = {
      'India': 'IN', 'China': 'CN', 'Japan': 'JP', 'Korea': 'KR',
      'UK': 'GB', 'France': 'FR', 'Italy': 'IT', 'Germany': 'DE',
      'USA': 'US', 'Canada': 'CA', 'Mexico': 'MX',
      'Nigeria': 'NG', 'South Africa': 'ZA', 'Morocco': 'MA',
      'Brazil': 'BR', 'Argentina': 'AR', 'Colombia': 'CO',
      'UAE': 'AE', 'Saudi Arabia': 'SA', 'Turkey': 'TR',
      'Australia': 'AU', 'New Zealand': 'NZ', 'Fiji': 'FJ'
    };
    return codes[country] || 'US';
  }
}

export const globalDataService = GlobalDataService.getInstance();