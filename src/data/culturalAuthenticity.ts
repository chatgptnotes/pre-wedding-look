/**
 * Cultural Authenticity Guide for Global Wedding Traditions
 * Comprehensive research-based authentic wedding customs across continents
 */

export interface CulturalWeddingTradition {
  id: string;
  name: string;
  continent: string;
  countries: string[];
  description: string;
  historicalSignificance: string;
  modernAdaptations: string[];
  keyElements: {
    attire: {
      bride: string[];
      groom: string[];
      family: string[];
    };
    ceremony: {
      rituals: string[];
      symbols: string[];
      music: string[];
      duration: string;
      participants: string[];
    };
    colors: {
      primary: string[];
      significance: Record<string, string>;
      restrictions: string[];
    };
    venues: {
      traditional: string[];
      modern: string[];
      significance: string;
    };
  };
  culturalSensitivity: {
    respectfulRepresentation: string[];
    avoidances: string[];
    consultationAdvice: string;
  };
  photographyGuidelines: {
    allowedMoments: string[];
    restrictedMoments: string[];
    stylingTips: string[];
    culturalContext: string;
  };
}

export const AUTHENTIC_WEDDING_TRADITIONS: CulturalWeddingTradition[] = [
  {
    id: 'hindu-indian',
    name: 'Hindu Indian Wedding',
    continent: 'Asia',
    countries: ['India', 'Nepal', 'Bangladesh', 'Sri Lanka'],
    description: 'Sacred Hindu matrimonial ceremony with ancient Vedic traditions spanning multiple days of celebration',
    historicalSignificance: 'Rooted in 5000+ years of Vedic tradition, Hindu weddings are considered sacred unions blessed by divine elements. Each ritual has deep spiritual meaning connecting the couple to cosmic forces.',
    modernAdaptations: [
      'Destination weddings incorporating traditional elements',
      'Fusion of regional Indian customs',
      'Eco-friendly ceremonies with traditional rituals',
      'Technology integration while maintaining authenticity',
      'Shortened ceremonies for modern schedules'
    ],
    keyElements: {
      attire: {
        bride: [
          'Red or maroon silk lehenga with gold embroidery (Rajasthan/North India)',
          'Kanjeevaram silk saree in vibrant colors (Tamil Nadu/South India)',
          'White/cream silk saree with red border (Bengali tradition)',
          'Heavy gold jewelry including mangalsutra, nath, armlets',
          'Henna designs on hands and feet',
          'Fresh flower garlands in hair'
        ],
        groom: [
          'Silk sherwani with churidar in ivory, gold, or maroon',
          'Traditional dhoti with silk kurta (South Indian)',
          'Bandhgala suit with traditional accessories',
          'Turban or sehra (face curtain of flowers)',
          'Gold chain, kada (bracelet), ring',
          'Kalgi (plume) on turban'
        ],
        family: [
          'Silk sarees and kurtas in auspicious colors',
          'Gold jewelry and traditional accessories',
          'Avoid black and white typically',
          'Regional variations in style and draping'
        ]
      },
      ceremony: {
        rituals: [
          'Ganesh Puja (invoking blessings of Lord Ganesha)',
          'Kanyadaan (father giving away daughter)',
          'Panigrahana (holding hands ritual)',
          'Saptapadi (seven vows around sacred fire)',
          'Sindoor and mangalsutra ceremony',
          'Aashirwad (blessings from elders)'
        ],
        symbols: [
          'Sacred fire (Agni) as divine witness',
          'Kalash (sacred water vessel)',
          'Coconut for prosperity',
          'Marigold and rose flowers',
          'Rice for fertility',
          'Turmeric for purity'
        ],
        music: [
          'Vedic chants and mantras',
          'Shehnai (traditional wind instrument)',
          'Dhol and tabla rhythms',
          'Bollywood and classical songs',
          'Regional folk music'
        ],
        duration: '3-7 days with multiple ceremonies',
        participants: [
          'Immediate and extended family',
          'Community members',
          'Pandit (priest)',
          'Wedding party members'
        ]
      },
      colors: {
        primary: ['Red', 'Gold', 'Orange', 'Yellow', 'Pink', 'Green'],
        significance: {
          'Red': 'Purity, fertility, and prosperity',
          'Gold': 'Wealth and auspiciousness',
          'Yellow': 'Knowledge and happiness',
          'Orange': 'Strength and courage',
          'Green': 'New beginnings and harvest'
        },
        restrictions: ['Black (inauspicious)', 'White (mourning color in some regions)']
      },
      venues: {
        traditional: [
          'Temple courtyards',
          'Family ancestral homes',
          'Palace gardens',
          'Heritage hotels with traditional architecture'
        ],
        modern: [
          'Luxury hotels with traditional decor',
          'Beach resorts with mandap setup',
          'Destination venues with cultural authenticity'
        ],
        significance: 'Venue should accommodate sacred fire ceremony and guest circulation for rituals'
      }
    },
    culturalSensitivity: {
      respectfulRepresentation: [
        'Understand spiritual significance of rituals',
        'Respect religious customs and timing',
        'Include authentic traditional elements',
        'Consult with Hindu priests for accuracy',
        'Honor regional variations and family customs'
      ],
      avoidances: [
        'Superficial use of religious symbols',
        'Inappropriate mixing of different Hindu traditions',
        'Disrespect for sacred fire or religious items',
        'Using costume-like attire instead of authentic garments'
      ],
      consultationAdvice: 'Always consult with knowledgeable Hindu priests, cultural experts, or family elders to ensure authenticity and respect'
    },
    photographyGuidelines: {
      allowedMoments: [
        'Pre-ceremony preparations and decorations',
        'Family portraits in traditional attire',
        'Ritual moments with respectful distance',
        'Celebration and dancing sequences',
        'Food and cultural elements'
      ],
      restrictedMoments: [
        'Very close shots during sacred rituals without permission',
        'Flash photography during certain ceremonies',
        'Disrupting flow of religious proceedings'
      ],
      stylingTips: [
        'Capture intricate details of clothing and jewelry',
        'Include traditional decorations and rangoli',
        'Show cultural context and family interactions',
        'Highlight the sacred fire and ritual elements',
        'Document regional and family-specific customs'
      ],
      culturalContext: 'Hindu weddings are deeply spiritual events. Photography should capture the sacred nature while being respectful of religious proceedings.'
    }
  },

  {
    id: 'chinese-traditional',
    name: 'Chinese Traditional Wedding',
    continent: 'Asia',
    countries: ['China', 'Taiwan', 'Hong Kong', 'Singapore', 'Malaysia'],
    description: 'Ancient Chinese matrimonial customs emphasizing family honor, prosperity, and harmonious union with rich symbolic elements',
    historicalSignificance: 'Dating back over 3000 years, Chinese weddings emphasize family lineage, ancestral respect, and harmonious balance between families. Every element carries deep symbolic meaning for prosperity and fertility.',
    modernAdaptations: [
      'Fusion of traditional tea ceremony with modern reception',
      'Western dress combined with Chinese elements',
      'Simplified rituals for contemporary schedules',
      'International venues with Chinese cultural integration',
      'Digital elements while preserving core traditions'
    ],
    keyElements: {
      attire: {
        bride: [
          'Red qipao (cheongsam) with gold dragon and phoenix embroidery',
          'Traditional Chinese wedding dress with intricate beadwork',
          'Red silk with auspicious symbols (double happiness, dragons)',
          'Gold jewelry including dragon and phoenix designs',
          'Red shoes and accessories',
          'Traditional Chinese makeup with red lips'
        ],
        groom: [
          'Traditional Chinese changshan in red or gold',
          'Modern suit with Chinese collar and buttons',
          'Dragon-embroidered jacket with traditional pants',
          'Traditional Chinese hat or modern styling',
          'Gold accessories and traditional shoes'
        ],
        family: [
          'Traditional Chinese attire in auspicious colors',
          'Avoid white (mourning color) and black',
          'Prefer red, gold, pink, and other bright colors'
        ]
      },
      ceremony: {
        rituals: [
          'Tea ceremony honoring parents and elders',
          'Hair combing ceremony',
          'Capping ceremony for groom',
          'Door games and challenges',
          'Wedding procession with music',
          'Three bows to heaven, earth, and parents'
        ],
        symbols: [
          'Double Happiness character (Xi Xi)',
          'Dragon and Phoenix (perfect match)',
          'Red dates, peanuts, longan, lotus seeds (fertility)',
          'Gold and red colors throughout',
          'Bamboo for resilience',
          'Mandarin ducks for loyalty'
        ],
        music: [
          'Traditional Chinese instruments (erhu, guzheng)',
          'Lion dance performances',
          'Traditional wedding songs',
          'Modern Chinese pop music',
          'Festive celebration music'
        ],
        duration: '1-3 days with multiple ceremonies',
        participants: [
          'Extended family and clan members',
          'Community representatives',
          'Wedding party and attendants',
          'Traditional performers'
        ]
      },
      colors: {
        primary: ['Red', 'Gold', 'Pink', 'Orange', 'Yellow'],
        significance: {
          'Red': 'Luck, joy, and prosperity',
          'Gold': 'Wealth and status',
          'Pink': 'Romance and happiness',
          'Yellow': 'Imperial color and nobility'
        },
        restrictions: ['White (death and mourning)', 'Black (bad luck)', 'Blue (sadness)']
      },
      venues: {
        traditional: [
          'Ancestral family homes',
          'Traditional Chinese gardens',
          'Temples or clan halls',
          'Historic Chinese architecture venues'
        ],
        modern: [
          'Hotels with Chinese cultural decor',
          'Restaurants serving traditional banquet',
          'Gardens designed with feng shui principles'
        ],
        significance: 'Venues should have good feng shui and accommodate family honor traditions'
      }
    },
    culturalSensitivity: {
      respectfulRepresentation: [
        'Honor family hierarchy and respect for elders',
        'Understand significance of tea ceremony',
        'Respect feng shui principles in setup',
        'Include authentic cultural symbols meaningfully',
        'Acknowledge regional Chinese variations'
      ],
      avoidances: [
        'Using Chinese elements as mere decoration',
        'Disrespecting family customs and protocols',
        'Inappropriate use of cultural symbols',
        'Ignoring the importance of family honor'
      ],
      consultationAdvice: 'Consult with Chinese cultural experts, family elders, or cultural associations to ensure respectful and authentic representation'
    },
    photographyGuidelines: {
      allowedMoments: [
        'Tea ceremony with family members',
        'Traditional attire and cultural elements',
        'Family portraits honoring hierarchy',
        'Cultural performances and celebrations',
        'Traditional food and banquet settings'
      ],
      restrictedMoments: [
        'Private family discussions or negotiations',
        'Certain traditional rituals without family permission',
        'Disrupting the flow of ceremonial proceedings'
      ],
      stylingTips: [
        'Capture intricate embroidery and cultural details',
        'Include traditional decorations and symbols',
        'Show family respect and hierarchical relationships',
        'Highlight red and gold color scheme',
        'Document authentic cultural practices'
      ],
      culturalContext: 'Chinese weddings emphasize family honor and cultural continuity. Photography should respect these values while capturing the celebratory nature.'
    }
  },

  {
    id: 'japanese-traditional',
    name: 'Japanese Traditional Wedding (Shinzen-shiki)',
    continent: 'Asia',
    countries: ['Japan'],
    description: 'Sacred Shinto ceremony emphasizing purity, respect, and harmony with nature and ancestral spirits',
    historicalSignificance: 'Rooted in Shinto traditions dating back over 1500 years, Japanese weddings emphasize purity, harmony with nature, and respect for ancestors. The ceremony is deeply spiritual and minimalist in aesthetic.',
    modernAdaptations: [
      'Combination of Shinto ceremony with Western reception',
      'Simplified traditional elements for contemporary couples',
      'International venues incorporating Japanese aesthetics',
      'Fusion of traditional kimono with modern accessories',
      'Technology integration while maintaining ceremonial dignity'
    ],
    keyElements: {
      attire: {
        bride: [
          'White shiromuku (pure white kimono) for ceremony',
          'Colorful uchikake (over-kimono) for reception',
          'Traditional wataboshi (white hood) or tsunokakushi',
          'Minimal makeup with white base and red lips',
          'Traditional accessories (fan, hairpins)',
          'White tabi socks and zori sandals'
        ],
        groom: [
          'Black formal montsuki (crested kimono)',
          'Hakama (formal pleated pants)',
          'Haori (formal jacket) with family crests',
          'White tabi and traditional footwear',
          'Formal fan and traditional accessories'
        ],
        family: [
          'Formal kimono or Western formal wear',
          'Subdued colors respecting ceremony solemnity',
          'Traditional Japanese accessories when appropriate'
        ]
      },
      ceremony: {
        rituals: [
          'San-san-kudo (sake sharing ritual)',
          'Ring exchange (modern addition)',
          'Reading of wedding vows',
          'Offering of tamagushi (sacred branches)',
          'Purification rituals',
          'Ancestral prayers and blessings'
        ],
        symbols: [
          'Sake cups for union ceremony',
          'Tamagushi (sacred Shinto branches)',
          'Origami cranes for longevity',
          'Cherry blossoms for beauty and life',
          'Bamboo for strength and flexibility',
          'White for purity and new beginnings'
        ],
        music: [
          'Traditional gagaku court music',
          'Shinto ceremonial music',
          'Shamisen and koto performances',
          'Contemporary Japanese music for reception'
        ],
        duration: '2-3 hours for ceremony, full day for celebration',
        participants: [
          'Immediate family members',
          'Close friends and relatives',
          'Shinto priest (kannushi)',
          'Formal wedding party'
        ]
      },
      colors: {
        primary: ['White', 'Red', 'Gold', 'Silver', 'Soft pastels'],
        significance: {
          'White': 'Purity and new beginnings',
          'Red': 'Happiness and good fortune',
          'Gold': 'Prosperity and nobility',
          'Silver': 'Elegance and refinement'
        },
        restrictions: ['Bright or flashy colors during ceremony', 'Black (associated with formality or mourning)']
      },
      venues: {
        traditional: [
          'Shinto shrines',
          'Traditional Japanese gardens',
          'Historic temples',
          'Family ancestral locations'
        ],
        modern: [
          'Hotels with traditional Japanese aesthetics',
          'Contemporary venues with Shinto elements',
          'Garden venues with Japanese design'
        ],
        significance: 'Venues should promote harmony with nature and provide spiritual atmosphere'
      }
    },
    culturalSensitivity: {
      respectfulRepresentation: [
        'Understand spiritual significance of Shinto elements',
        'Respect ceremony solemnity and quietude',
        'Honor Japanese concepts of harmony and respect',
        'Include authentic cultural elements meaningfully',
        'Respect traditional gender roles and family hierarchy'
      ],
      avoidances: [
        'Overly casual approach to sacred rituals',
        'Misuse of religious symbols or items',
        'Disrespecting ceremony protocols',
        'Using Japanese elements purely as decoration'
      ],
      consultationAdvice: 'Consult with Shinto priests, Japanese cultural experts, or cultural centers to ensure authentic and respectful representation'
    },
    photographyGuidelines: {
      allowedMoments: [
        'Pre-ceremony preparations and kimono dressing',
        'Garden and temple architecture',
        'Formal portraits in traditional attire',
        'Reception celebrations and cultural performances',
        'Traditional food presentation and sake ceremony'
      ],
      restrictedMoments: [
        'Certain sacred ritual moments without permission',
        'Flash photography during solemn ceremonies',
        'Disrupting the quiet, contemplative atmosphere'
      ],
      stylingTips: [
        'Capture minimalist aesthetic and attention to detail',
        'Include natural elements and garden settings',
        'Show respect for ceremony solemnity',
        'Highlight traditional craftsmanship in kimono',
        'Document the harmony between tradition and nature'
      ],
      culturalContext: 'Japanese weddings emphasize harmony, respect, and spiritual connection. Photography should reflect these values with dignity and restraint.'
    }
  }

  // Note: This is a sample of comprehensive cultural documentation
  // Additional traditions for other continents would follow the same detailed format:
  // - European (British, French, Italian, Greek Orthodox, Russian)
  // - African (Nigerian, South African, Moroccan, Egyptian, Kenyan)
  // - North American (American, Canadian, Mexican)
  // - South American (Brazilian, Argentine, Colombian, Peruvian)
  // - Middle Eastern (Arabic, Persian, Turkish, Jewish, Lebanese)
  // - Oceanian (Australian, New Zealand Māori, Fijian, Pacific Islander)
];

export interface CulturalSensitivityGuidelines {
  generalPrinciples: string[];
  researchRequirements: string[];
  consultationSources: string[];
  representationStandards: string[];
  commonMistakes: string[];
}

export const CULTURAL_SENSITIVITY_GUIDELINES: CulturalSensitivityGuidelines = {
  generalPrinciples: [
    'Always prioritize authentic representation over aesthetic appeal',
    'Understand the spiritual and cultural significance behind traditions',
    'Respect regional variations within cultural groups',
    'Acknowledge the living nature of cultural practices',
    'Avoid stereotypes and oversimplified representations',
    'Honor the voices and perspectives of culture bearers',
    'Recognize that wedding traditions evolve while maintaining core values'
  ],
  researchRequirements: [
    'Study historical context and origins of traditions',
    'Understand contemporary practices and adaptations',
    'Research regional and family-specific variations',
    'Learn about cultural taboos and sensitivities',
    'Investigate appropriate ceremonial protocols',
    'Understand color symbolism and material significance',
    'Research appropriate terminology and language use'
  ],
  consultationSources: [
    'Cultural and religious leaders',
    'Academic experts and anthropologists',
    'Community elders and tradition keepers',
    'Cultural centers and museums',
    'Authentic cultural organizations',
    'Family members with cultural knowledge',
    'Professional cultural consultants'
  ],
  representationStandards: [
    'Ensure accuracy in cultural details and elements',
    'Maintain respectful tone and approach',
    'Include diverse perspectives within cultures',
    'Avoid exoticization or othering',
    'Present traditions with dignity and context',
    'Acknowledge sources and cultural contributors',
    'Update representations based on community feedback'
  ],
  commonMistakes: [
    'Mixing elements from different cultures inappropriately',
    'Using sacred symbols as mere decoration',
    'Oversimplifying complex cultural traditions',
    'Ignoring contemporary cultural evolution',
    'Assuming uniformity within cultural groups',
    'Appropriating without understanding significance',
    'Failing to consult with cultural experts'
  ]
};

/**
 * Helper function to get authentic wedding traditions by continent
 */
export function getAuthenticTraditionsByContinent(continent: string): CulturalWeddingTradition[] {
  return AUTHENTIC_WEDDING_TRADITIONS.filter(tradition => 
    tradition.continent === continent
  );
}

/**
 * Helper function to get cultural guidelines for specific tradition
 */
export function getCulturalGuidelines(traditionId: string): CulturalWeddingTradition | null {
  return AUTHENTIC_WEDDING_TRADITIONS.find(tradition => 
    tradition.id === traditionId
  ) || null;
}

/**
 * Helper function to validate cultural representation
 */
export function validateCulturalRepresentation(
  elements: string[], 
  traditionId: string
): { isValid: boolean; warnings: string[]; suggestions: string[] } {
  const tradition = getCulturalGuidelines(traditionId);
  
  if (!tradition) {
    return {
      isValid: false,
      warnings: ['Tradition not found in cultural database'],
      suggestions: ['Research authentic traditions for this culture']
    };
  }

  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check for cultural sensitivity issues
  elements.forEach(element => {
    tradition.culturalSensitivity.avoidances.forEach(avoidance => {
      if (element.toLowerCase().includes(avoidance.toLowerCase())) {
        warnings.push(`Potential cultural sensitivity issue: ${avoidance}`);
      }
    });
  });

  // Provide suggestions for improvement
  if (warnings.length === 0) {
    suggestions.push(...tradition.culturalSensitivity.respectfulRepresentation);
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions
  };
}