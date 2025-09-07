/**
 * Geolocation Service for Global Country Detection
 * Automatically detects user's country/region for regional style recommendations
 */

export interface CountryInfo {
  country: string;
  countryCode: string;
  continent: string;
  region: string;
  timezone: string;
}

export interface RegionalConfig {
  continent: string;
  region: string;
  countries: string[];
  defaultStyles: {
    weddingTraditions: string[];
    brideAttire: string[];
    groomAttire: string[];
    venues: string[];
    colors: string[];
    ceremonies: string[];
  };
}

// Continental wedding style configurations
export const CONTINENTAL_STYLES: Record<string, RegionalConfig> = {
  'asia': {
    continent: 'Asia',
    region: 'Asian Traditions',
    countries: ['India', 'China', 'Japan', 'Korea', 'Thailand', 'Indonesia', 'Philippines', 'Malaysia', 'Singapore', 'Vietnam'],
    defaultStyles: {
      weddingTraditions: [
        'Hindu ceremony with sacred fire',
        'Chinese tea ceremony',
        'Japanese sake sharing ritual',
        'Korean paebaek ceremony',
        'Thai water blessing ceremony'
      ],
      brideAttire: [
        'Red silk lehenga with gold embroidery',
        'Traditional Chinese qipao with phoenix motifs',
        'Japanese white shiromuku or red uchikake',
        'Korean hanbok in vibrant colors',
        'Thai traditional silk dress with golden accessories'
      ],
      groomAttire: [
        'Silk sherwani with churidar',
        'Chinese changshan with dragon patterns',
        'Japanese montsuki haori hakama',
        'Korean hanbok with jeogori jacket',
        'Thai traditional silk shirt with ornate details'
      ],
      venues: [
        'Temple courtyards with intricate carvings',
        'Royal palace gardens',
        'Traditional pavilions with red pillars',
        'Mountain temples with prayer flags',
        'Tropical gardens with golden temples'
      ],
      colors: ['Deep reds', 'Royal gold', 'Sacred saffron', 'Emerald green', 'Pure white'],
      ceremonies: ['Ring exchange', 'Sacred thread tying', 'Fire blessings', 'Tea ceremony', 'Floral garland exchange']
    }
  },
  'europe': {
    continent: 'Europe',
    region: 'European Elegance',
    countries: ['UK', 'France', 'Italy', 'Germany', 'Spain', 'Greece', 'Russia', 'Netherlands', 'Switzerland', 'Austria'],
    defaultStyles: {
      weddingTraditions: [
        'Church ceremony with organ music',
        'French château celebration',
        'Italian villa wedding',
        'Greek Orthodox ceremony',
        'Russian folk traditions'
      ],
      brideAttire: [
        'Classic white ball gown with cathedral train',
        'French lace mermaid dress',
        'Italian silk A-line with vintage beading',
        'Greek goddess flowing dress',
        'Russian traditional dress with embroidered details'
      ],
      groomAttire: [
        'Classic black tuxedo with bow tie',
        'Three-piece British suit',
        'Italian tailored morning coat',
        'French vintage vest and jacket',
        'German traditional lederhosen (for themed weddings)'
      ],
      venues: [
        'Gothic cathedral with stained glass',
        'French château with vineyard views',
        'Italian villa overlooking Tuscany',
        'Greek island chapel by the sea',
        'Russian palace ballroom with chandeliers'
      ],
      colors: ['Classic white', 'Champagne gold', 'Vintage ivory', 'Dusty rose', 'Royal navy'],
      ceremonies: ['Vow exchange', 'Ring blessing', 'Unity candle', 'Wine ceremony', 'Traditional dance']
    }
  },
  'northamerica': {
    continent: 'North America',
    region: 'North American Style',
    countries: ['USA', 'Canada', 'Mexico'],
    defaultStyles: {
      weddingTraditions: [
        'Beach ceremony at sunset',
        'Rustic barn wedding',
        'Garden party celebration',
        'Mexican fiesta wedding',
        'Canadian outdoor wilderness wedding'
      ],
      brideAttire: [
        'Bohemian beach dress with flowing fabric',
        'Rustic lace dress with boots',
        'Classic American princess gown',
        'Mexican traditional dress with colorful embroidery',
        'Canadian elegant dress suitable for outdoor settings'
      ],
      groomAttire: [
        'Casual linen suit for beach weddings',
        'Rustic suspenders with bow tie',
        'Classic American tuxedo',
        'Mexican guayabera with traditional details',
        'Canadian outdoor formal wear'
      ],
      venues: [
        'Pacific coast beach with ocean waves',
        'Rustic barn with string lights',
        'Urban rooftop with city skyline',
        'Mexican hacienda with colorful tiles',
        'Canadian mountain lake with pine forests'
      ],
      colors: ['Ocean blues', 'Sunset oranges', 'Forest greens', 'Desert browns', 'Mountain whites'],
      ceremonies: ['Sand ceremony', 'Handfasting', 'Tree planting', 'Cultural fusion rituals', 'Adventure vows']
    }
  },
  'africa': {
    continent: 'Africa',
    region: 'African Heritage',
    countries: ['Nigeria', 'South Africa', 'Morocco', 'Egypt', 'Kenya', 'Ghana', 'Ethiopia', 'Tanzania'],
    defaultStyles: {
      weddingTraditions: [
        'Traditional drumming and dancing',
        'Jumping the broom ceremony',
        'Kola nut ceremony (Nigerian)',
        'Moroccan henna celebration',
        'Egyptian Nubian traditions'
      ],
      brideAttire: [
        'Colorful traditional African print dress',
        'Nigerian gele headwrap with iro and buba',
        'Moroccan caftan with intricate beading',
        'Egyptian traditional dress with gold accessories',
        'South African traditional beadwork attire'
      ],
      groomAttire: [
        'Traditional African dashiki with matching pants',
        'Nigerian agbada with embroidered details',
        'Moroccan djellaba in rich fabrics',
        'Egyptian traditional galabiya',
        'South African traditional shirt with beadwork'
      ],
      venues: [
        'African savanna with acacia trees',
        'Traditional village setting with huts',
        'Moroccan riad with mosaic tiles',
        'Egyptian temple with ancient columns',
        'South African wine estate with mountain backdrop'
      ],
      colors: ['Earth tones', 'Vibrant oranges', 'Deep purples', 'Golden yellows', 'Rich browns'],
      ceremonies: ['Libation pouring', 'Traditional dancing', 'Ancestor blessing', 'Cultural music', 'Community celebration']
    }
  },
  'southamerica': {
    continent: 'South America',
    region: 'South American Passion',
    countries: ['Brazil', 'Argentina', 'Colombia', 'Peru', 'Chile', 'Ecuador', 'Venezuela'],
    defaultStyles: {
      weddingTraditions: [
        'Brazilian festa with samba dancing',
        'Argentine tango ceremony',
        'Colombian cumbia celebration',
        'Peruvian Andean mountain ceremony',
        'Chilean vineyard wedding'
      ],
      brideAttire: [
        'Brazilian carnival-inspired dress with feathers',
        'Argentine elegant tango dress',
        'Colombian traditional pollera',
        'Peruvian traditional dress with Andean patterns',
        'Chilean modern dress with cultural elements'
      ],
      groomAttire: [
        'Brazilian white linen suit with colorful accents',
        'Argentine formal suit for tango',
        'Colombian guayabera with traditional details',
        'Peruvian poncho with modern suit',
        'Chilean formal wear with wine country style'
      ],
      venues: [
        'Brazilian beach with palm trees',
        'Argentine pampas with endless grasslands',
        'Colombian coffee plantation in mountains',
        'Peruvian Machu Picchu-style ancient ruins',
        'Chilean Andes with snow-capped peaks'
      ],
      colors: ['Tropical greens', 'Sunset reds', 'Ocean blues', 'Mountain browns', 'Festival yellows'],
      ceremonies: ['Rhythm and dance', 'Wine blessing', 'Mountain spirits', 'Coffee ritual', 'Cultural music']
    }
  },
  'middleeast': {
    continent: 'Middle East',
    region: 'Middle Eastern Splendor',
    countries: ['UAE', 'Saudi Arabia', 'Iran', 'Turkey', 'Israel', 'Lebanon', 'Jordan', 'Qatar'],
    defaultStyles: {
      weddingTraditions: [
        'Arabian nights celebration with oud music',
        'Persian sofreh aghd ceremony',
        'Turkish traditional henna night',
        'Jewish chuppah ceremony',
        'Lebanese zaffe procession'
      ],
      brideAttire: [
        'Embroidered kaftan with gold threading',
        'Persian traditional dress with intricate patterns',
        'Turkish ottoman-inspired gown',
        'Elegant dress suitable for chuppah',
        'Lebanese traditional dress with silk details'
      ],
      groomAttire: [
        'Traditional thobe with bisht cloak',
        'Persian formal wear with cultural elements',
        'Turkish ottoman-style jacket',
        'Formal suit appropriate for Jewish ceremony',
        'Lebanese traditional outfit with modern touches'
      ],
      venues: [
        'Desert oasis with palm trees',
        'Persian garden with flowing water',
        'Turkish palace courtyard',
        'Jerusalem stone architecture',
        'Lebanese mountain terrace with Mediterranean views'
      ],
      colors: ['Desert golds', 'Deep purples', 'Royal blues', 'Rich burgundies', 'Pearl whites'],
      ceremonies: ['Traditional music', 'Cultural dancing', 'Blessing rituals', 'Family traditions', 'Ancient customs']
    }
  },
  'oceania': {
    continent: 'Oceania',
    region: 'Pacific Paradise',
    countries: ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Samoa', 'Tonga'],
    defaultStyles: {
      weddingTraditions: [
        'Australian beach ceremony with didgeridoo',
        'New Zealand Māori haka ceremony',
        'Fijian bose ceremony with kava',
        'Pacific island flower blessing',
        'Aboriginal dreamtime ceremony'
      ],
      brideAttire: [
        'Flowing beach dress with native flower crown',
        'New Zealand dress with Māori-inspired patterns',
        'Fijian traditional bula dress',
        'Pacific island dress with tropical prints',
        'Australian outback-appropriate elegant dress'
      ],
      groomAttire: [
        'Linen shirt with traditional Aboriginal patterns',
        'New Zealand formal wear with Māori elements',
        'Fijian traditional sulu with shirt',
        'Pacific island formal tropical wear',
        'Australian bush formal attire'
      ],
      venues: [
        'Great Barrier Reef underwater chapel',
        'New Zealand fjords with mountain backdrop',
        'Fijian tropical island with crystal waters',
        'Pacific island beach with palm trees',
        'Australian outback with red rock formations'
      ],
      colors: ['Ocean turquoise', 'Tropical greens', 'Sunset oranges', 'Coral pinks', 'Earth reds'],
      ceremonies: ['Water blessing', 'Traditional music', 'Flower exchanges', 'Cultural dance', 'Nature rituals']
    }
  }
};

export class GeolocationService {
  private static instance: GeolocationService;
  private countryCache: CountryInfo | null = null;

  public static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  /**
   * Detect user's country using multiple fallback methods
   */
  async detectCountry(): Promise<CountryInfo | null> {
    // Return cached result if available
    if (this.countryCache) {
      return this.countryCache;
    }

    try {
      // Method 1: Try ipapi.co (free tier)
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const countryInfo: CountryInfo = {
          country: data.country_name || 'Unknown',
          countryCode: data.country_code || 'US',
          continent: this.mapContinentCode(data.continent_code),
          region: data.region || 'Unknown',
          timezone: data.timezone || 'UTC',
        };
        
        this.countryCache = countryInfo;
        return countryInfo;
      }
    } catch (error) {
      console.warn('Primary geolocation service failed, trying fallback...');
    }

    try {
      // Method 2: Fallback to ipify + geojs
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      
      const geoResponse = await fetch(`https://get.geojs.io/v1/ip/geo/${ipData.ip}.json`);
      const geoData = await geoResponse.json();

      if (geoData.country) {
        const countryInfo: CountryInfo = {
          country: geoData.country,
          countryCode: geoData.country_code || 'US',
          continent: this.mapContinentName(geoData.continent_code),
          region: geoData.region || 'Unknown',
          timezone: geoData.timezone || 'UTC',
        };

        this.countryCache = countryInfo;
        return countryInfo;
      }
    } catch (error) {
      console.warn('Fallback geolocation service failed');
    }

    // Method 3: Final fallback using Intl API for timezone
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const fallbackCountry = this.getCountryFromTimezone(timezone);
      
      const countryInfo: CountryInfo = {
        country: fallbackCountry.country,
        countryCode: fallbackCountry.code,
        continent: fallbackCountry.continent,
        region: 'Detected from Timezone',
        timezone: timezone,
      };

      this.countryCache = countryInfo;
      return countryInfo;
    } catch (error) {
      console.error('All geolocation methods failed');
    }

    return null;
  }

  /**
   * Get regional style configuration based on detected country
   */
  getRegionalStyles(countryInfo: CountryInfo | null): RegionalConfig {
    if (!countryInfo) {
      // Default to North American styles if detection fails
      return CONTINENTAL_STYLES['northamerica'];
    }

    const continentKey = this.getContinentKey(countryInfo.continent);
    return CONTINENTAL_STYLES[continentKey] || CONTINENTAL_STYLES['northamerica'];
  }

  /**
   * Get appropriate style recommendations based on user's location
   */
  async getLocationBasedRecommendations(): Promise<{
    countryInfo: CountryInfo | null;
    regionalStyles: RegionalConfig;
    recommendations: {
      primaryStyle: string;
      suggestedVenues: string[];
      culturalElements: string[];
      colorPalette: string[];
    };
  }> {
    const countryInfo = await this.detectCountry();
    const regionalStyles = this.getRegionalStyles(countryInfo);

    const recommendations = {
      primaryStyle: `${regionalStyles.region} Wedding Style`,
      suggestedVenues: regionalStyles.defaultStyles.venues.slice(0, 3),
      culturalElements: regionalStyles.defaultStyles.weddingTraditions.slice(0, 3),
      colorPalette: regionalStyles.defaultStyles.colors,
    };

    return {
      countryInfo,
      regionalStyles,
      recommendations,
    };
  }

  private mapContinentCode(continentCode: string): string {
    const mapping: Record<string, string> = {
      'AF': 'Africa',
      'AN': 'Antarctica',
      'AS': 'Asia',
      'EU': 'Europe',
      'NA': 'North America',
      'OC': 'Oceania',
      'SA': 'South America',
    };
    return mapping[continentCode] || 'Unknown';
  }

  private mapContinentName(continentCode: string): string {
    return this.mapContinentCode(continentCode);
  }

  private getContinentKey(continentName: string): string {
    const mapping: Record<string, string> = {
      'Africa': 'africa',
      'Asia': 'asia',
      'Europe': 'europe',
      'North America': 'northamerica',
      'South America': 'southamerica',
      'Oceania': 'oceania',
      'Antarctica': 'oceania', // Fallback
      'Unknown': 'northamerica', // Default fallback
    };
    return mapping[continentName] || 'northamerica';
  }

  private getCountryFromTimezone(timezone: string): { country: string; code: string; continent: string } {
    // Simple timezone to country mapping for fallback
    const timezoneMap: Record<string, { country: string; code: string; continent: string }> = {
      'America/New_York': { country: 'United States', code: 'US', continent: 'North America' },
      'America/Los_Angeles': { country: 'United States', code: 'US', continent: 'North America' },
      'America/Chicago': { country: 'United States', code: 'US', continent: 'North America' },
      'America/Denver': { country: 'United States', code: 'US', continent: 'North America' },
      'Europe/London': { country: 'United Kingdom', code: 'GB', continent: 'Europe' },
      'Europe/Paris': { country: 'France', code: 'FR', continent: 'Europe' },
      'Europe/Berlin': { country: 'Germany', code: 'DE', continent: 'Europe' },
      'Asia/Tokyo': { country: 'Japan', code: 'JP', continent: 'Asia' },
      'Asia/Shanghai': { country: 'China', code: 'CN', continent: 'Asia' },
      'Asia/Kolkata': { country: 'India', code: 'IN', continent: 'Asia' },
      'Australia/Sydney': { country: 'Australia', code: 'AU', continent: 'Oceania' },
      'Pacific/Auckland': { country: 'New Zealand', code: 'NZ', continent: 'Oceania' },
    };

    return timezoneMap[timezone] || { country: 'United States', code: 'US', continent: 'North America' };
  }
}

export const geolocationService = GeolocationService.getInstance();