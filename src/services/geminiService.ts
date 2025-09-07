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