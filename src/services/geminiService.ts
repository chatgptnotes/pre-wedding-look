import { GoogleGenAI, Modality } from "@google/genai";
import { GenerationConfig } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey });

const fileToGenerativePart = (data: string) => {
  const parts = data.split(';');
  const mimeType = parts[0].split(':')[1];
  const base64Data = parts[1].split(',')[1];
  return {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };
};


export async function generateStoryboardScene(
  sceneConfig: {
    name: string;
    location: string;
    timeOfDay: string;
    description: string;
  },
  brideImage: string | null,
  groomImage: string | null
): Promise<string> {
  const requestParts: ({ inlineData: { mimeType: string; data: string; } } | { text: string })[] = [];
  let prompt = '';

  const photographyDetails = `The final image should be a high-quality cinematic photograph with dramatic lighting appropriate for ${sceneConfig.timeOfDay}, professional composition, and film-like quality suitable for a romantic storyboard scene.`;

  if (brideImage && groomImage) {
    // Couple Storyboard Scene Logic
    requestParts.push(fileToGenerativePart(brideImage), fileToGenerativePart(groomImage));

    const promptParts = [
      `**Task:** Create a cinematic pre-wedding storyboard scene combining the bride from the first image and the groom from the second image.`,
      '',
      '🚨 **ABSOLUTE CRITICAL FACE PRESERVATION RULES:** 🚨',
      '1. **FACES MUST REMAIN 100% IDENTICAL:** The bride\'s face from image 1 and groom\'s face from image 2 must be copied EXACTLY as they appear.',
      '2. **NO FACIAL MODIFICATIONS:** Do NOT change, enhance, stylize, or alter faces in any way.',
      '3. **PRESERVE:** Face shape, skin tone, eyes, eyebrows, nose, lips, cheeks, chin, forehead, facial expressions.',
      '4. **FACE CLARITY:** Maintain original face clarity and resolution - faces should be crystal clear.',
      '5. **IDENTITY PRESERVATION:** The people must be instantly recognizable as the same individuals.',
      '',
      '**SCENE COMPOSITION (BODY & ENVIRONMENT ONLY):**',
      `- **Scene Title:** ${sceneConfig.name}`,
      `- **Location:** ${sceneConfig.location} - Create an authentic, detailed representation of this location`,
      `- **Time of Day:** ${sceneConfig.timeOfDay} - Apply appropriate lighting, mood, and atmospheric effects`,
      `- **Scene Description:** ${sceneConfig.description} - Capture this romantic moment while preserving faces`,
      '- **Cinematic Quality:** Professional pre-wedding photography style with beautiful composition',
      '- **Poses:** Natural, romantic poses appropriate for the scene and location',
      `- **Photography:** ${photographyDetails}`,
      '- **Aspect Ratio:** The image should be in 16:9 cinematic format for storyboard presentation',
      '',
      '**FINAL CHECK:** Before generating, ensure faces are 100% identical to source images with crystal-clear quality while creating a beautiful cinematic scene.'
    ];
    prompt = promptParts.filter(Boolean).join('\n');
  } else {
    throw new Error("Both bride and groom images are required for storyboard scene generation.");
  }

  requestParts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: requestParts,
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        return `data:${mimeType};base64,${base64ImageBytes}`;
      }
    }
    
    let responseText = "No storyboard scene was generated in the response.";
    if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
        responseText = `Storyboard scene generation failed. Model response: ${response.candidates[0].content.parts[0].text}`;
    }
    throw new Error(responseText);

  } catch (error) {
    console.error("Error generating storyboard scene with Gemini:", error);
    if (error instanceof Error && error.message.includes('Model response')) {
        throw error;
    }
    throw new Error("Failed to generate the storyboard scene. The model may not have been able to process the request. Please try with different images or scene description.");
  }
}

export async function generateFutureVision(
  scenario: {
    name: string;
    yearsAhead: number;
    description: string;
    backgroundSetting?: string;
    familyMembers?: Array<{
      name: string;
      relationship: string;
      ageInScenario: number;
      description: string;
    }>;
  },
  brideImage: string | null,
  groomImage: string | null
): Promise<string> {
  const requestParts: ({ inlineData: { mimeType: string; data: string; } } | { text: string })[] = [];
  let prompt = '';

  const photographyDetails = `The final image should be a high-quality, heartwarming family photograph with natural lighting, professional composition, and emotional depth suitable for capturing this milestone moment.`;

  if (brideImage && groomImage) {
    // Couple Future Vision Logic
    requestParts.push(fileToGenerativePart(brideImage), fileToGenerativePart(groomImage));

    const promptParts = [
      `**Task:** Create a future vision photograph showing the bride from the first image and the groom from the second image after ${scenario.yearsAhead} years together.`,
      '',
      '🚨 **IDENTITY PRESERVATION WITH AGING:** 🚨',
      '1. **PRESERVE CORE FACIAL FEATURES:** Keep their fundamental facial structure, eye shape, nose shape, and jawline recognizable.',
      '2. **APPLY REALISTIC AGING:** Add appropriate aging effects for +' + scenario.yearsAhead + ' years:',
      '   - Subtle wrinkles around eyes and mouth',
      '   - Slightly mature facial structure',
      '   - Natural hair changes (graying if appropriate)',
      '   - Gentle skin texture changes',
      '3. **MAINTAIN RECOGNIZABILITY:** They should still be clearly identifiable as the same people.',
      '4. **FACE CLARITY:** Ensure faces remain crystal clear and well-defined.',
      '',
      '**SCENARIO DETAILS:**',
      `- **Anniversary/Milestone:** ${scenario.name}`,
      `- **Years Together:** ${scenario.yearsAhead} years of marriage`,
      `- **Celebration:** ${scenario.description}`,
      scenario.backgroundSetting ? `- **Setting:** ${scenario.backgroundSetting}` : '',
      '',
      '**ADDITIONAL ELEMENTS:**',
      '- **Emotional Connection:** Show deep love and connection built over years',
      '- **Maturity:** Reflect the wisdom and contentment that comes with time',
      '- **Celebration Mood:** Capture the joy of reaching this milestone',
      scenario.familyMembers && scenario.familyMembers.length > 0 ? 
        `- **Family Members:** Include ${scenario.familyMembers.length} family members: ${scenario.familyMembers.map(fm => `${fm.relationship} (${fm.name}, age ${fm.ageInScenario})`).join(', ')}` : '',
      `- **Photography:** ${photographyDetails}`,
      '- **Aspect Ratio:** 4:3 family portrait format suitable for framing',
      '',
      '**FINAL CHECK:** Ensure the couple is recognizable but appropriately aged, with a warm, celebratory atmosphere.'
    ];
    prompt = promptParts.filter(Boolean).join('\n');
  } else {
    throw new Error("Both bride and groom images are required for future vision generation.");
  }

  requestParts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: requestParts,
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        return `data:${mimeType};base64,${base64ImageBytes}`;
      }
    }
    
    let responseText = "No future vision was generated in the response.";
    if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
        responseText = `Future vision generation failed. Model response: ${response.candidates[0].content.parts[0].text}`;
    }
    throw new Error(responseText);

  } catch (error) {
    console.error("Error generating future vision with Gemini:", error);
    if (error instanceof Error && error.message.includes('Model response')) {
        throw error;
    }
    throw new Error("Failed to generate the future vision. The model may not have been able to process the request. Please try with different images or scenario details.");
  }
}

export async function generateBananaChallengeImage(
  theme: {
    id: string;
    name: string;
    emoji: string;
    description: string;
    category: 'fantasy' | 'sci-fi' | 'bollywood' | 'adventure' | 'comedy';
    difficulty: 'easy' | 'medium' | 'hard' | 'insane';
    prompt: string;
    colors: string[];
    props?: string[];
  },
  brideImage: string,
  groomImage: string
): Promise<string> {
  const requestParts: ({ inlineData: { mimeType: string; data: string; } } | { text: string })[] = [];
  
  requestParts.push(fileToGenerativePart(brideImage), fileToGenerativePart(groomImage));

  const promptParts = [
    `**BANANA CHALLENGE MODE: ${theme.name.toUpperCase()}** 🍌`,
    '',
    '**Task:** Create an absolutely WILD and CRAZY pre-wedding photo that combines the bride from the first image and the groom from the second image in the most BANANAS way possible!',
    '',
    '🚨 **FACE PRESERVATION (STILL CRITICAL):** 🚨',
    '1. **FACES MUST REMAIN 100% IDENTICAL:** Preserve the exact faces from both images.',
    '2. **NO FACIAL MODIFICATIONS:** Keep all facial features exactly as they appear.',
    '3. **IDENTITY PRESERVATION:** The couple must be instantly recognizable.',
    '4. **FACE CLARITY:** Maintain crystal-clear facial details.',
    '',
    '🍌 **BANANA CHALLENGE THEME:**',
    `- **Theme:** ${theme.name} ${theme.emoji}`,
    `- **Description:** ${theme.description}`,
    `- **Category:** ${theme.category} (Go TOTALLY ${theme.category.toUpperCase()}!)`,
    `- **Difficulty:** ${theme.difficulty.toUpperCase()} - Push creative boundaries!`,
    `- **Core Concept:** ${theme.prompt}`,
    theme.props && theme.props.length > 0 ? `- **Required Props:** ${theme.props.join(', ')} - Make them prominent!` : '',
    '',
    '🎨 **CREATIVE REQUIREMENTS:**',
    '- **Go COMPLETELY BANANAS:** This should be the most wild, creative, over-the-top version possible',
    '- **Embrace the Absurd:** Don\'t hold back - make it hilariously awesome',
    '- **Dynamic Action:** Include movement, energy, and dramatic poses',
    '- **Rich Details:** Pack the image with theme-appropriate elements',
    `- **Color Palette:** Emphasize these colors: ${theme.colors.join(', ')}`,
    '- **Cinematic Drama:** Make it look like a movie poster or epic scene',
    '',
    '🎭 **EXECUTION STYLE:**',
    '- **Photography Quality:** High-resolution, professional composition despite the craziness',
    '- **Lighting:** Dramatic and appropriate for the theme',
    '- **Composition:** Dynamic and engaging layout',
    '- **Aspect Ratio:** 16:9 for maximum visual impact',
    '',
    `**FINAL BANANA CHECK:** Create the most INSANE, CREATIVE, and AMAZING ${theme.name} scene while keeping their beautiful faces exactly as they are! 🍌✨`
  ];

  const prompt = promptParts.filter(Boolean).join('\n');
  requestParts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: requestParts,
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        return `data:${mimeType};base64,${base64ImageBytes}`;
      }
    }
    
    let responseText = "No banana challenge image was generated in the response.";
    if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
        responseText = `Banana challenge generation failed. Model response: ${response.candidates[0].content.parts[0].text}`;
    }
    throw new Error(responseText);

  } catch (error) {
    console.error("Error generating banana challenge with Gemini:", error);
    if (error instanceof Error && error.message.includes('Model response')) {
        throw error;
    }
    throw new Error("Failed to generate the banana challenge image. The model may not have been able to process the request. Please try with different images or theme.");
  }
}

export async function generateVoiceSlideshow(slideshowData: {
  bride_image: string;
  groom_image: string;
  voice_recordings: Array<{
    id: string;
    type: 'bride' | 'groom';
    audio_file: string | null;
    voice_id: string | null;
  }>;
  selected_templates: Array<{
    id: string;
    name: string;
    script: string;
    mood: 'romantic' | 'playful' | 'emotional' | 'dramatic';
    duration: number;
    musicStyle: string;
  }>;
  custom_script: string;
  narrator_type: 'bride' | 'groom' | 'both';
  created_at: string;
}): Promise<string> {
  const requestParts: ({ inlineData: { mimeType: string; data: string; } } | { text: string })[] = [];
  
  requestParts.push(fileToGenerativePart(slideshowData.bride_image), fileToGenerativePart(slideshowData.groom_image));

  const scriptContent = slideshowData.selected_templates.map(t => `${t.name}: ${t.script}`).join('\n') + 
                       (slideshowData.custom_script ? `\nCustom: ${slideshowData.custom_script}` : '');

  const promptParts = [
    '**VOICE SLIDESHOW GENERATION** 🎬',
    '',
    '**Task:** Create a beautiful romantic slideshow image that represents the love story narrated by the couple\'s voices.',
    '',
    '🚨 **FACE PRESERVATION:** 🚨',
    '1. **FACES MUST REMAIN 100% IDENTICAL:** Preserve exact faces from both images.',
    '2. **NO FACIAL MODIFICATIONS:** Keep all facial features exactly as they appear.',
    '3. **IDENTITY PRESERVATION:** The couple must be instantly recognizable.',
    '4. **FACE CLARITY:** Maintain crystal-clear facial details.',
    '',
    '🎭 **SLIDESHOW NARRATIVE:**',
    `- **Narrator:** ${slideshowData.narrator_type === 'both' ? 'Both voices telling their story' : `${slideshowData.narrator_type} voice narrating`}`,
    `- **Story Content:** ${scriptContent}`,
    `- **Selected Templates:** ${slideshowData.selected_templates.map(t => `${t.name} (${t.mood})`).join(', ')}`,
    slideshowData.custom_script ? `- **Personal Message:** ${slideshowData.custom_script}` : '',
    '',
    '🎨 **VISUAL REQUIREMENTS:**',
    '- **Romantic Slideshow Style:** Create a cinematic, heartwarming scene that captures their love story',
    '- **Emotional Depth:** Convey the emotions from their voice narration through visual elements',
    '- **Storytelling Elements:** Include visual metaphors for their journey together',
    '- **Warm Lighting:** Soft, romantic lighting that enhances the emotional connection',
    '- **Composition:** Elegant layout suitable for a slideshow presentation',
    '',
    '🎵 **MOOD INTEGRATION:**',
    slideshowData.selected_templates.length > 0 ? 
      `- **Template Moods:** ${slideshowData.selected_templates.map(t => `${t.mood} (${t.musicStyle})`).join(', ')}` : '',
    '- **Overall Tone:** Romantic and emotionally resonant',
    '- **Visual Music:** Let the image feel like it has the rhythm of their love story',
    '',
    '📐 **TECHNICAL SPECS:**',
    '- **Aspect Ratio:** 16:9 for slideshow presentation',
    '- **Quality:** High-resolution, professional slideshow quality',
    '- **Style:** Cinematic with soft focus elements',
    '',
    '**FINAL CHECK:** Create a slideshow image that perfectly represents their voiced love story while preserving their exact facial features! 🎬💕'
  ];

  const prompt = promptParts.filter(Boolean).join('\n');
  requestParts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: requestParts,
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        return `data:${mimeType};base64,${base64ImageBytes}`;
      }
    }
    
    let responseText = "No voice slideshow image was generated in the response.";
    if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
        responseText = `Voice slideshow generation failed. Model response: ${response.candidates[0].content.parts[0].text}`;
    }
    throw new Error(responseText);

  } catch (error) {
    console.error("Error generating voice slideshow with Gemini:", error);
    if (error instanceof Error && error.message.includes('Model response')) {
        throw error;
    }
    throw new Error("Failed to generate the voice slideshow. The model may not have been able to process the request. Please try with different content or images.");
  }
}

export async function generateRegionalStyleImages(
  style: {
    id: string;
    name: string;
    description: string;
    region: string;
    colors: string[];
    features: string[];
    attire: {
      bride: string;
      groom: string;
    };
    accessories: string[];
    patterns: string[];
    significance: string;
  },
  brideImage: string,
  groomImage: string,
  count: number = 6
): Promise<string[]> {
  const generatedImages: string[] = [];
  
  for (let i = 0; i < count; i++) {
    try {
      const requestParts: ({ inlineData: { mimeType: string; data: string; } } | { text: string })[] = [];
      
      requestParts.push(fileToGenerativePart(brideImage), fileToGenerativePart(groomImage));

      const variationPrompts = [
        'close-up romantic portrait',
        'full-body traditional pose',
        'cultural celebration scene',
        'artistic composition',
        'ceremonial moment',
        'lifestyle portrait'
      ];

      const promptParts = [
        `**REGIONAL STYLE: ${style.name.toUpperCase()} - VARIATION ${i + 1}** 🌍`,
        '',
        '**Task:** Create a beautiful pre-wedding photo showcasing authentic regional cultural style and traditions.',
        '',
        '🚨 **FACE PRESERVATION:** 🚨',
        '1. **FACES MUST REMAIN 100% IDENTICAL:** Preserve exact faces from both images.',
        '2. **NO FACIAL MODIFICATIONS:** Keep all facial features exactly as they appear.',
        '3. **IDENTITY PRESERVATION:** The couple must be instantly recognizable.',
        '4. **FACE CLARITY:** Maintain crystal-clear facial details.',
        '',
        `🏛️ **REGIONAL STYLE - ${style.region}:**`,
        `- **Style Name:** ${style.name}`,
        `- **Cultural Description:** ${style.description}`,
        `- **Regional Significance:** ${style.significance}`,
        `- **Variation Style:** ${variationPrompts[i] || 'artistic composition'}`,
        '',
        '👗 **TRADITIONAL ATTIRE:**',
        `- **Bride's Attire:** ${style.attire.bride} - authentic and detailed`,
        `- **Groom's Attire:** ${style.attire.groom} - traditional and elegant`,
        `- **Cultural Accessories:** ${style.accessories.join(', ')}`,
        `- **Traditional Patterns:** ${style.patterns.join(', ')}`,
        '',
        '🎨 **VISUAL ELEMENTS:**',
        `- **Color Palette:** Emphasize ${style.colors.join(', ')} in clothing and decor`,
        `- **Cultural Features:** ${style.features.join(', ')}`,
        '- **Authenticity:** Ensure all cultural elements are respectful and accurate',
        '- **Regional Backdrop:** Include appropriate cultural/architectural elements',
        '- **Lighting:** Warm, celebratory lighting that honors the cultural tradition',
        '',
        '📐 **TECHNICAL SPECS:**',
        '- **Quality:** High-resolution cultural portrait photography',
        '- **Composition:** Balanced and respectful cultural representation',
        '- **Aspect Ratio:** 4:3 for traditional portrait format',
        '',
        `**CULTURAL RESPECT:** Create an authentic, beautiful representation of ${style.name} traditions while preserving their exact facial features! 🌍💕`
      ];

      const prompt = promptParts.filter(Boolean).join('\n');
      requestParts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
          parts: requestParts,
        },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64ImageBytes = part.inlineData.data;
          const mimeType = part.inlineData.mimeType;
          generatedImages.push(`data:${mimeType};base64,${base64ImageBytes}`);
          break;
        }
      }

      // Add a small delay between generations to avoid overwhelming the API
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`Error generating regional style image ${i + 1}:`, error);
      // Continue with remaining images even if one fails
    }
  }

  if (generatedImages.length === 0) {
    throw new Error("Failed to generate any regional style images");
  }

  return generatedImages;
}

export async function generateMagicVariations(
  brideImage: string,
  groomImage: string,
  count: number = 12
): Promise<string[]> {
  const generatedImages: string[] = [];
  
  const magicStyles = [
    'romantic cinematic',
    'dreamy soft focus',
    'golden hour lighting',
    'vintage film style',
    'artistic black and white',
    'warm sunset tones',
    'ethereal fantasy',
    'elegant portrait style',
    'natural candid moment',
    'dramatic lighting',
    'soft pastel colors',
    'professional studio quality'
  ];

  for (let i = 0; i < count; i++) {
    try {
      const requestParts: ({ inlineData: { mimeType: string; data: string; } } | { text: string })[] = [];
      
      requestParts.push(fileToGenerativePart(brideImage), fileToGenerativePart(groomImage));

      const currentStyle = magicStyles[i] || magicStyles[i % magicStyles.length];

      const promptParts = [
        `**MAGIC VARIATIONS - STYLE ${i + 1}: ${currentStyle.toUpperCase()}** ✨`,
        '',
        '**Task:** Create a magical pre-wedding photo with creative styling and artistic flair.',
        '',
        '🚨 **FACE PRESERVATION:** 🚨',
        '1. **FACES MUST REMAIN 100% IDENTICAL:** Preserve exact faces from both images.',
        '2. **NO FACIAL MODIFICATIONS:** Keep all facial features exactly as they appear.',
        '3. **IDENTITY PRESERVATION:** The couple must be instantly recognizable.',
        '4. **FACE CLARITY:** Maintain crystal-clear facial details.',
        '',
        `✨ **MAGIC STYLE: ${currentStyle}**`,
        '- **Creative Interpretation:** Apply the magic style to lighting, composition, and atmosphere',
        '- **Artistic Enhancement:** Enhance the overall mood while preserving faces',
        '- **Professional Quality:** High-end wedding photography standard',
        '- **Emotional Impact:** Create a romantic and memorable image',
        '',
        '🎨 **VISUAL ELEMENTS:**',
        '- **Unique Variation:** Each image should have a distinct artistic interpretation',
        '- **Romantic Atmosphere:** Maintain the romantic pre-wedding theme',
        '- **Professional Composition:** Well-balanced and aesthetically pleasing',
        '- **Magic Touch:** Add subtle artistic elements that make it special',
        '',
        '📐 **TECHNICAL SPECS:**',
        '- **Quality:** Professional wedding photography resolution',
        '- **Aspect Ratio:** 4:3 for optimal display',
        '- **Lighting:** Appropriate to the selected style variation',
        '',
        `**MAGIC TOUCH:** Transform their love story into a ${currentStyle} masterpiece while keeping their faces exactly as they are! ✨💕`
      ];

      const prompt = promptParts.filter(Boolean).join('\n');
      requestParts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
          parts: requestParts,
        },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64ImageBytes = part.inlineData.data;
          const mimeType = part.inlineData.mimeType;
          generatedImages.push(`data:${mimeType};base64,${base64ImageBytes}`);
          break;
        }
      }

      // Add a small delay between generations
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
    } catch (error) {
      console.error(`Error generating magic variation ${i + 1}:`, error);
      // Continue with remaining images even if one fails
    }
  }

  if (generatedImages.length === 0) {
    throw new Error("Failed to generate any magic variations");
  }

  return generatedImages;
}

export async function generatePersonalizedImage(
  config: GenerationConfig,
  brideImage: string | null,
  groomImage: string | null
): Promise<string> {
  const { location, brideAttire, groomAttire, bridePose, groomPose, style, hairstyle, groomHairstyle, aspectRatio, jewelry } = config;

  const requestParts: ({ inlineData: { mimeType: string; data: string; } } | { text: string })[] = [];
  let prompt = '';

  const photographyDetails = `The final image should be a high-quality photograph with photorealistic detail, soft natural lighting, and a shallow depth of field (bokeh) to create a romantic atmosphere.`;

  if (brideImage && groomImage) {
    // Couple Photoshoot Logic
    requestParts.push(fileToGenerativePart(brideImage), fileToGenerativePart(groomImage));

    const promptParts = [
      '**Task:** Combine the bride from the first image and the groom from the second image into a new, cohesive pre-wedding photograph.',
      '',
      '🚨 **ABSOLUTE CRITICAL FACE PRESERVATION RULES:** 🚨',
      '1. **FACES MUST REMAIN 100% IDENTICAL:** The bride\'s face from image 1 and groom\'s face from image 2 must be copied EXACTLY as they appear.',
      '2. **NO FACIAL MODIFICATIONS:** Do NOT change, enhance, stylize, or alter faces in any way.',
      '3. **PRESERVE:** Face shape, skin tone, eyes, eyebrows, nose, lips, cheeks, chin, forehead, facial expressions.',
      '4. **FACE CLARITY:** Maintain original face clarity and resolution - faces should be crystal clear.',
      '5. **IDENTITY PRESERVATION:** The people must be instantly recognizable as the same individuals.',
      '',
      '**CHANGES ALLOWED (BODY & SCENE ONLY):**',
      '- Background scenery and environment',
      '- Lighting and atmospheric effects', 
      '- Body poses and positioning',
      '- Clothing and accessories (but not face)',
      '- Overall image composition',
      '',
      location ? `- **Location:** Place them in ${location} but keep their original faces unchanged.` : '',
      `- **Pose:** The bride is ${bridePose}. The groom is ${groomPose}. Position their bodies naturally but preserve their original facial features exactly.`,
      style ? `- **Style:** Apply ${style} to the overall scene, lighting, and atmosphere, but NOT to their faces.` : '',
      `- **Photography:** ${photographyDetails}`,
      aspectRatio ? `- **Aspect Ratio:** The image must have a ${aspectRatio}.` : '',
      '',
      '**FINAL CHECK:** Before generating, ensure faces are 100% identical to source images with crystal-clear quality.'
    ];
    prompt = promptParts.filter(Boolean).join('\n');

  } else if (brideImage) {
    // Solo Bride Photoshoot Logic
    requestParts.push(fileToGenerativePart(brideImage));

    const promptParts = [
      '**Task:** Generate a beautiful, high-resolution pre-wedding style photograph featuring the Indian bride from the provided image.',
      '',
      '🚨 **ABSOLUTE CRITICAL FACE PRESERVATION RULES:** 🚨',
      '1. **FACE MUST REMAIN 100% IDENTICAL:** Copy the bride\'s face EXACTLY as it appears in the source image.',
      '2. **NO FACIAL MODIFICATIONS:** Do NOT change, enhance, stylize, or alter her face in any way.',
      '3. **PRESERVE:** Face shape, skin tone, eyes, eyebrows, nose, lips, cheeks, chin, forehead, facial expression.',
      '4. **FACE CLARITY:** Maintain original face clarity and resolution - face should be crystal clear.',
      '5. **IDENTITY PRESERVATION:** The bride must be instantly recognizable as the same person.',
      '',
      '**CHANGES ALLOWED (EVERYTHING EXCEPT FACE):**',
      brideAttire ? `- **Bride's Attire:** She is wearing ${brideAttire} but keep her original face unchanged.` : '',
      hairstyle ? `- **Bride's Hairstyle:** Style her hair as ${hairstyle} but preserve her original facial features.` : '',
      jewelry ? `- **Bride's Jewelry:** Adorn her with ${jewelry} but don't alter her face.` : '',
      bridePose ? `- **Pose:** The bride is ${bridePose} but maintain her original facial appearance.` : '',
      location ? `- **Location:** Place her in ${location} but keep her face exactly as in the original image.` : '',
      style ? `- **Style:** Apply ${style} to the overall scene and atmosphere, but NOT to her face.` : '',
      `- **Photography:** ${photographyDetails}`,
      aspectRatio ? `- **Aspect Ratio:** The image must have a ${aspectRatio}.` : '',
      '',
      '**FINAL CHECK:** Before generating, ensure face is 100% identical to source image with crystal-clear quality.'
    ];
    prompt = promptParts.filter(Boolean).join('\n');

  } else if (groomImage) {
    // Solo Groom Photoshoot Logic
    requestParts.push(fileToGenerativePart(groomImage));
    
    const promptParts = [
      '**Task:** Generate a handsome, high-resolution pre-wedding style photograph featuring the Indian groom from the provided image.',
      '',
      '🚨 **ABSOLUTE CRITICAL FACE PRESERVATION RULES:** 🚨',
      '1. **FACE MUST REMAIN 100% IDENTICAL:** Copy the groom\'s face EXACTLY as it appears in the source image.',
      '2. **NO FACIAL MODIFICATIONS:** Do NOT change, enhance, stylize, or alter his face in any way.',
      '3. **PRESERVE:** Face shape, skin tone, eyes, eyebrows, nose, lips, cheeks, chin, forehead, facial expression.',
      '4. **FACE CLARITY:** Maintain original face clarity and resolution - face should be crystal clear.',
      '5. **IDENTITY PRESERVATION:** The groom must be instantly recognizable as the same person.',
      '',
      '**CHANGES ALLOWED (EVERYTHING EXCEPT FACE):**',
      groomAttire ? `- **Groom's Attire:** He is wearing ${groomAttire} but keep his original face unchanged.` : '',
      groomHairstyle ? `- **Groom's Hairstyle:** His hair is styled in ${groomHairstyle} but preserve his original facial features.` : '',
      groomPose ? `- **Pose:** The groom is ${groomPose} but maintain his original facial appearance.` : '',
      location ? `- **Location:** The scene is set ${location} but keep his face exactly as in the original image.` : '',
      style ? `- **Style:** Apply ${style} to the overall scene and atmosphere, but NOT to his face.` : '',
      `- **Photography:** ${photographyDetails}`,
      aspectRatio ? `- **Aspect Ratio:** The image must have a ${aspectRatio}.` : '',
      '',
      '**FINAL CHECK:** Before generating, ensure face is 100% identical to source image with crystal-clear quality.'
    ];
    prompt = promptParts.filter(Boolean).join('\n');

  } else {
    throw new Error("At least one image (bride or groom) must be provided for generation.");
  }


  requestParts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: requestParts,
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        return `data:${mimeType};base64,${base64ImageBytes}`;
      }
    }
    
    let responseText = "No image was generated in the response.";
    if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
        responseText = `Image generation failed. Model response: ${response.candidates[0].content.parts[0].text}`;
    }
    throw new Error(responseText);

  } catch (error) {
    console.error("Error generating image with Gemini:", error);
    if (error instanceof Error && error.message.includes('Model response')) {
        throw error;
    }
    throw new Error("Failed to generate the image. The model may not have been able to process the request. Please try with different images or options.");
  }
}