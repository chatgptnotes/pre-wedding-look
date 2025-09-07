import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { generatePersonalizedImage } from '../geminiService';
import { GenerationConfig } from '../../types';
import { GoogleGenAI } from '@google/genai';

// Mock the GoogleGenAI module
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(() => ({
    models: {
      generateContent: mockGenerateContent
    }
  })),
  Modality: {
    IMAGE: 'image',
    TEXT: 'text'
  }
}));

describe('geminiService', () => {
  const mockConfig: GenerationConfig = {
    location: 'in front of the Taj Mahal at sunrise',
    brideAttire: 'a stunning, intricately embroidered red lehenga',
    groomAttire: 'a classic cream-colored sherwani with a turban',
    bridePose: 'standing in a front view portrait',
    groomPose: 'standing in a front view portrait',
    style: 'cinematic, ultra-realistic, dramatic lighting',
    hairstyle: 'an elegant, intricate updo',
    groomHairstyle: 'a classic, neat gelled hairstyle',
    aspectRatio: '9:16 portrait aspect ratio',
    jewelry: 'an elaborate Kundan choker necklace'
  };

  const mockBrideImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/test';
  const mockGroomImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/test2';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generatePersonalizedImage', () => {
    it('should generate couple image when both bride and groom images are provided', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: 'mock-base64-image-data',
                mimeType: 'image/jpeg'
              }
            }]
          }
        }]
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await generatePersonalizedImage(mockConfig, mockBrideImage, mockGroomImage);

      expect(result).toBe('data:image/jpeg;base64,mock-base64-image-data');
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
          parts: expect.arrayContaining([
            expect.objectContaining({ inlineData: expect.any(Object) }),
            expect.objectContaining({ inlineData: expect.any(Object) }),
            expect.objectContaining({ text: expect.stringContaining('Combine the bride from the first image') })
          ])
        },
        config: {
          responseModalities: ['image', 'text']
        }
      });
    });

    it('should generate solo bride image when only bride image is provided', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: 'mock-bride-image-data',
                mimeType: 'image/png'
              }
            }]
          }
        }]
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await generatePersonalizedImage(mockConfig, mockBrideImage, null);

      expect(result).toBe('data:image/png;base64,mock-bride-image-data');
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
          parts: expect.arrayContaining([
            expect.objectContaining({ inlineData: expect.any(Object) }),
            expect.objectContaining({ text: expect.stringContaining('Generate a beautiful, high-resolution pre-wedding style photograph featuring the Indian bride') })
          ])
        },
        config: {
          responseModalities: ['image', 'text']
        }
      });
    });

    it('should generate solo groom image when only groom image is provided', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: 'mock-groom-image-data',
                mimeType: 'image/webp'
              }
            }]
          }
        }]
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await generatePersonalizedImage(mockConfig, null, mockGroomImage);

      expect(result).toBe('data:image/webp;base64,mock-groom-image-data');
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
          parts: expect.arrayContaining([
            expect.objectContaining({ inlineData: expect.any(Object) }),
            expect.objectContaining({ text: expect.stringContaining('Generate a handsome, high-resolution pre-wedding style photograph featuring the Indian groom') })
          ])
        },
        config: {
          responseModalities: ['image', 'text']
        }
      });
    });

    it('should throw error when no images are provided', async () => {
      await expect(generatePersonalizedImage(mockConfig, null, null))
        .rejects
        .toThrow('At least one image (bride or groom) must be provided for generation.');
    });

    it('should throw error when API response has no image', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'No image generated'
            }]
          }
        }]
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      await expect(generatePersonalizedImage(mockConfig, mockBrideImage, null))
        .rejects
        .toThrow('Image generation failed. Model response: No image generated');
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('API Error');
      mockGenerateContent.mockRejectedValue(mockError);

      await expect(generatePersonalizedImage(mockConfig, mockBrideImage, null))
        .rejects
        .toThrow('Failed to generate the image. The model may not have been able to process the request. Please try with different images or options.');
    });

    it('should preserve face preservation rules in prompt for couple generation', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: 'mock-image-data',
                mimeType: 'image/jpeg'
              }
            }]
          }
        }]
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      await generatePersonalizedImage(mockConfig, mockBrideImage, mockGroomImage);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      const promptText = callArgs.contents.parts.find(part => part.text)?.text;
      
      expect(promptText).toContain('ABSOLUTE CRITICAL FACE PRESERVATION RULES');
      expect(promptText).toContain('FACES MUST REMAIN 100% IDENTICAL');
      expect(promptText).toContain('NO FACIAL MODIFICATIONS');
    });

    it('should include all configuration parameters in the prompt', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: 'mock-image-data',
                mimeType: 'image/jpeg'
              }
            }]
          }
        }]
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      await generatePersonalizedImage(mockConfig, mockBrideImage, mockGroomImage);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      const promptText = callArgs.contents.parts.find(part => part.text)?.text;
      
      expect(promptText).toContain(mockConfig.location);
      expect(promptText).toContain(mockConfig.bridePose);
      expect(promptText).toContain(mockConfig.groomPose);
      expect(promptText).toContain(mockConfig.style);
      expect(promptText).toContain(mockConfig.aspectRatio);
    });

    it('should correctly parse base64 image data', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: 'mock-image-data',
                mimeType: 'image/jpeg'
              }
            }]
          }
        }]
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      await generatePersonalizedImage(mockConfig, mockBrideImage, null);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      const imagePart = callArgs.contents.parts.find(part => part.inlineData);
      
      expect(imagePart.inlineData.mimeType).toBe('image/jpeg');
      expect(imagePart.inlineData.data).toBe('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/test');
    });
  });
});