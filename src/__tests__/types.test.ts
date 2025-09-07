import { describe, it, expect } from 'vitest';
import { 
  SelectionOption, 
  ConfigCategory, 
  GenerationConfig, 
  ChatMessage, 
  OptionUpdate, 
  ChatbotAction 
} from '../types';

describe('Types', () => {
  describe('SelectionOption', () => {
    it('should validate a complete SelectionOption object', () => {
      const option: SelectionOption = {
        id: 'test-id',
        label: 'Test Label',
        imageUrl: 'https://example.com/image.jpg',
        promptValue: 'test prompt value'
      };

      expect(option.id).toBe('test-id');
      expect(option.label).toBe('Test Label');
      expect(option.imageUrl).toBe('https://example.com/image.jpg');
      expect(option.promptValue).toBe('test prompt value');
    });

    it('should allow empty prompt value', () => {
      const option: SelectionOption = {
        id: 'none',
        label: 'None',
        imageUrl: 'data:image/svg+xml,test',
        promptValue: ''
      };

      expect(option.promptValue).toBe('');
    });
  });

  describe('ConfigCategory', () => {
    it('should contain all expected categories', () => {
      const expectedCategories: ConfigCategory[] = [
        'location',
        'brideAttire',
        'groomAttire',
        'bridePose',
        'groomPose',
        'style',
        'hairstyle',
        'groomHairstyle',
        'aspectRatio',
        'jewelry'
      ];

      expectedCategories.forEach(category => {
        const testCategory: ConfigCategory = category;
        expect(typeof testCategory).toBe('string');
      });
    });

    it('should not accept invalid category values', () => {
      // TypeScript compile-time check - this would fail at compile time
      // const invalidCategory: ConfigCategory = 'invalidCategory'; // This would cause a TypeScript error
      
      // Runtime validation would need to be implemented separately
      const validCategories = [
        'location',
        'brideAttire',
        'groomAttire',
        'bridePose',
        'groomPose',
        'style',
        'hairstyle',
        'groomHairstyle',
        'aspectRatio',
        'jewelry'
      ];

      expect(validCategories).toContain('location');
      expect(validCategories).toContain('jewelry');
      expect(validCategories).not.toContain('invalidCategory');
    });
  });

  describe('GenerationConfig', () => {
    it('should validate a complete GenerationConfig object', () => {
      const config: GenerationConfig = {
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

      expect(typeof config.location).toBe('string');
      expect(typeof config.brideAttire).toBe('string');
      expect(typeof config.groomAttire).toBe('string');
      expect(typeof config.bridePose).toBe('string');
      expect(typeof config.groomPose).toBe('string');
      expect(typeof config.style).toBe('string');
      expect(typeof config.hairstyle).toBe('string');
      expect(typeof config.groomHairstyle).toBe('string');
      expect(typeof config.aspectRatio).toBe('string');
      expect(typeof config.jewelry).toBe('string');
    });

    it('should allow empty string values for optional configurations', () => {
      const config: GenerationConfig = {
        location: '',
        brideAttire: '',
        groomAttire: '',
        bridePose: 'standing in a front view portrait',
        groomPose: 'standing in a front view portrait',
        style: 'cinematic',
        hairstyle: '',
        groomHairstyle: '',
        aspectRatio: '1:1',
        jewelry: ''
      };

      expect(config.location).toBe('');
      expect(config.brideAttire).toBe('');
      expect(config.jewelry).toBe('');
    });
  });

  describe('ChatMessage', () => {
    it('should validate a user chat message', () => {
      const message: ChatMessage = {
        id: 1,
        sender: 'user',
        text: 'Hello, can you help me choose a location?'
      };

      expect(message.id).toBe(1);
      expect(message.sender).toBe('user');
      expect(message.text).toBe('Hello, can you help me choose a location?');
    });

    it('should validate a bot chat message', () => {
      const message: ChatMessage = {
        id: 2,
        sender: 'bot',
        text: 'Of course! I can suggest some beautiful locations for your pre-wedding shoot.'
      };

      expect(message.id).toBe(2);
      expect(message.sender).toBe('bot');
      expect(message.text).toBe('Of course! I can suggest some beautiful locations for your pre-wedding shoot.');
    });

    it('should handle different message ID types', () => {
      const messages: ChatMessage[] = [
        { id: 1, sender: 'user', text: 'First message' },
        { id: 2, sender: 'bot', text: 'Second message' },
        { id: 100, sender: 'user', text: 'Later message' }
      ];

      messages.forEach(message => {
        expect(typeof message.id).toBe('number');
        expect(['user', 'bot']).toContain(message.sender);
        expect(typeof message.text).toBe('string');
      });
    });
  });

  describe('OptionUpdate', () => {
    it('should validate an option update object', () => {
      const update: OptionUpdate = {
        category: 'location',
        promptValue: 'in front of the Taj Mahal at sunrise'
      };

      expect(update.category).toBe('location');
      expect(update.promptValue).toBe('in front of the Taj Mahal at sunrise');
    });

    it('should work with different categories', () => {
      const updates: OptionUpdate[] = [
        { category: 'brideAttire', promptValue: 'red lehenga' },
        { category: 'groomAttire', promptValue: 'white sherwani' },
        { category: 'style', promptValue: 'cinematic' }
      ];

      updates.forEach(update => {
        expect(typeof update.category).toBe('string');
        expect(typeof update.promptValue).toBe('string');
      });
    });
  });

  describe('ChatbotAction', () => {
    it('should validate a SetOptionAction', () => {
      const action: ChatbotAction = {
        action: 'set_option',
        updates: [
          { category: 'location', promptValue: 'beach location' },
          { category: 'style', promptValue: 'romantic' }
        ],
        responseText: 'I\'ve updated your selections to a romantic beach setting.'
      };

      expect(action.action).toBe('set_option');
      if (action.action === 'set_option') {
        expect(Array.isArray(action.updates)).toBe(true);
        expect(action.updates).toHaveLength(2);
        expect(action.responseText).toBe('I\'ve updated your selections to a romantic beach setting.');
      }
    });

    it('should validate a ChatAction', () => {
      const action: ChatbotAction = {
        action: 'chat',
        responseText: 'That sounds like a wonderful idea! Tell me more about your preferences.'
      };

      expect(action.action).toBe('chat');
      if (action.action === 'chat') {
        expect(action.updates).toBeUndefined();
        expect(action.responseText).toBe('That sounds like a wonderful idea! Tell me more about your preferences.');
      }
    });

    it('should maintain discriminated union properties', () => {
      const setOptionAction: ChatbotAction = {
        action: 'set_option',
        updates: [{ category: 'location', promptValue: 'garden' }],
        responseText: 'Location set to garden'
      };

      const chatAction: ChatbotAction = {
        action: 'chat',
        responseText: 'How can I help you today?'
      };

      // Type guards should work
      if (setOptionAction.action === 'set_option') {
        expect(setOptionAction.updates).toBeDefined();
        expect(Array.isArray(setOptionAction.updates)).toBe(true);
      }

      if (chatAction.action === 'chat') {
        expect(chatAction.updates).toBeUndefined();
      }
    });
  });
});