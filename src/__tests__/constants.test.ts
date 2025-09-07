import { describe, it, expect } from 'vitest';
import { 
  LOCATIONS, 
  BRIDE_ATTIRE, 
  GROOM_ATTIRE, 
  BRIDE_POSES, 
  GROOM_POSES, 
  STYLES, 
  ASPECT_RATIOS, 
  JEWELRY,
  HAIRSTYLES,
  GROOM_HAIRSTYLES
} from '../constants';
import { SelectionOption } from '../types';

describe('Constants', () => {
  describe('Data Structure Validation', () => {
    const validateSelectionOptions = (options: SelectionOption[], arrayName: string) => {
      it(`should have valid structure for ${arrayName}`, () => {
        expect(Array.isArray(options)).toBe(true);
        expect(options.length).toBeGreaterThan(0);
        
        options.forEach((option, index) => {
          expect(option).toHaveProperty('id');
          expect(option).toHaveProperty('label');
          expect(option).toHaveProperty('imageUrl');
          expect(option).toHaveProperty('promptValue');
          
          expect(typeof option.id).toBe('string');
          expect(typeof option.label).toBe('string');
          expect(typeof option.imageUrl).toBe('string');
          expect(typeof option.promptValue).toBe('string');
          
          expect(option.id).not.toBe('');
          expect(option.label).not.toBe('');
          expect(option.imageUrl).not.toBe('');
          // promptValue can be empty string for NONE options
        });
      });
    };

    validateSelectionOptions(LOCATIONS, 'LOCATIONS');
    validateSelectionOptions(BRIDE_ATTIRE, 'BRIDE_ATTIRE');
    validateSelectionOptions(GROOM_ATTIRE, 'GROOM_ATTIRE');
    validateSelectionOptions(BRIDE_POSES, 'BRIDE_POSES');
    validateSelectionOptions(GROOM_POSES, 'GROOM_POSES');
    validateSelectionOptions(STYLES, 'STYLES');
    validateSelectionOptions(ASPECT_RATIOS, 'ASPECT_RATIOS');
    validateSelectionOptions(JEWELRY, 'JEWELRY');
    validateSelectionOptions(HAIRSTYLES, 'HAIRSTYLES');
    validateSelectionOptions(GROOM_HAIRSTYLES, 'GROOM_HAIRSTYLES');
  });

  describe('LOCATIONS', () => {
    it('should contain expected number of location options', () => {
      expect(LOCATIONS.length).toBe(11); // Including NONE_OPTION
    });

    it('should have "none" as first option', () => {
      expect(LOCATIONS[0].id).toBe('none');
      expect(LOCATIONS[0].label).toBe('None');
      expect(LOCATIONS[0].promptValue).toBe('');
    });

    it('should contain iconic Indian locations', () => {
      const locationLabels = LOCATIONS.map(loc => loc.label.toLowerCase());
      expect(locationLabels).toContain('taj mahal, agra');
      expect(locationLabels).toContain('kerala backwaters');
      expect(locationLabels).toContain('udaipur city palace');
      expect(locationLabels).toContain('goa beach sunset');
      expect(locationLabels).toContain('rajasthan desert');
    });

    it('should have meaningful prompt values for locations', () => {
      const tajMahal = LOCATIONS.find(loc => loc.label.includes('Taj Mahal'));
      expect(tajMahal?.promptValue).toContain('Taj Mahal');
      expect(tajMahal?.promptValue).toContain('sunrise');
    });
  });

  describe('BRIDE_ATTIRE', () => {
    it('should contain traditional Indian attire options', () => {
      const attireLabels = BRIDE_ATTIRE.map(attire => attire.label.toLowerCase());
      expect(attireLabels).toContain('red lehenga');
      expect(attireLabels).toContain('nauvari saree');
      expect(attireLabels).toContain('paithani saree');
      expect(attireLabels).toContain('pastel saree');
    });

    it('should have descriptive prompt values', () => {
      const redLehenga = BRIDE_ATTIRE.find(attire => attire.label.includes('Red Lehenga'));
      expect(redLehenga?.promptValue).toContain('red lehenga');
      expect(redLehenga?.promptValue).toContain('embroidered');
    });
  });

  describe('GROOM_ATTIRE', () => {
    it('should contain traditional and modern attire options', () => {
      const attireLabels = GROOM_ATTIRE.map(attire => attire.label.toLowerCase());
      expect(attireLabels).toContain('classic sherwani');
      expect(attireLabels).toContain('dhoti & pheta');
      expect(attireLabels).toContain('bandhgala suit');
      expect(attireLabels).toContain('modern tuxedo');
    });

    it('should include Maharashtrian traditional wear', () => {
      const dhotipheta = GROOM_ATTIRE.find(attire => attire.label.includes('Dhoti & Pheta'));
      expect(dhotipheta?.promptValue).toContain('Maharashtrian');
      expect(dhotipheta?.promptValue).toContain('dhoti-kurta');
      expect(dhotipheta?.promptValue).toContain('Pheta');
    });
  });

  describe('HAIRSTYLES', () => {
    it('should contain traditional and modern hairstyle options', () => {
      const hairstyleLabels = HAIRSTYLES.map(style => style.label.toLowerCase());
      expect(hairstyleLabels).toContain('elegant updo');
      expect(hairstyleLabels).toContain('maharashtrian bun');
      expect(hairstyleLabels).toContain('loose curls');
      expect(hairstyleLabels).toContain('traditional braid');
    });

    it('should have Maharashtrian cultural elements', () => {
      const maharashtrianBun = HAIRSTYLES.find(style => style.label.includes('Maharashtrian Bun'));
      expect(maharashtrianBun?.promptValue).toContain('Maharashtrian');
      expect(maharashtrianBun?.promptValue).toContain('Ambada');
    });
  });

  describe('GROOM_HAIRSTYLES', () => {
    it('should contain traditional and modern options', () => {
      const hairstyleLabels = GROOM_HAIRSTYLES.map(style => style.label.toLowerCase());
      expect(hairstyleLabels).toContain('classic gelled');
      expect(hairstyleLabels).toContain('modern fade');
      expect(hairstyleLabels).toContain('traditional turban');
    });
  });

  describe('BRIDE_POSES', () => {
    it('should include traditional Indian poses', () => {
      const poseLabels = BRIDE_POSES.map(pose => pose.label.toLowerCase());
      expect(poseLabels).toContain('laaj pose');
      expect(poseLabels).toContain('performing aukshan');
    });

    it('should have traditional cultural context in prompts', () => {
      const laajPose = BRIDE_POSES.find(pose => pose.label.includes('Laaj Pose'));
      expect(laajPose?.promptValue).toContain('laaj');
      expect(laajPose?.promptValue).toContain('shy');

      const aukshan = BRIDE_POSES.find(pose => pose.label.includes('Aukshan'));
      expect(aukshan?.promptValue).toContain('aukshan');
      expect(aukshan?.promptValue).toContain('ritual');
    });
  });

  describe('GROOM_POSES', () => {
    it('should include traditional Indian wedding poses', () => {
      const poseLabels = GROOM_POSES.map(pose => pose.label.toLowerCase());
      expect(poseLabels).toContain('offering gajra');
      expect(poseLabels).toContain('on decorated horse');
    });

    it('should reference traditional wedding elements', () => {
      const gajraOffer = GROOM_POSES.find(pose => pose.label.includes('Offering Gajra'));
      expect(gajraOffer?.promptValue).toContain('gajra');
      expect(gajraOffer?.promptValue).toContain('garland');

      const horse = GROOM_POSES.find(pose => pose.label.includes('Decorated Horse'));
      expect(horse?.promptValue).toContain('baraat');
      expect(horse?.promptValue).toContain('procession');
    });
  });

  describe('STYLES', () => {
    it('should contain 4 style options', () => {
      expect(STYLES.length).toBe(4);
    });

    it('should have distinct style categories', () => {
      const styleLabels = STYLES.map(style => style.label.toLowerCase());
      expect(styleLabels).toContain('cinematic');
      expect(styleLabels).toContain('dreamy');
      expect(styleLabels).toContain('vibrant');
      expect(styleLabels).toContain('vintage');
    });

    it('should have technical photography terms in prompts', () => {
      const cinematic = STYLES.find(style => style.label === 'Cinematic');
      expect(cinematic?.promptValue).toContain('cinematic');
      expect(cinematic?.promptValue).toContain('ultra-realistic');
      expect(cinematic?.promptValue).toContain('dramatic lighting');
    });
  });

  describe('ASPECT_RATIOS', () => {
    it('should contain standard aspect ratios', () => {
      expect(ASPECT_RATIOS.length).toBe(3);
      
      const ratioLabels = ASPECT_RATIOS.map(ratio => ratio.label.toLowerCase());
      expect(ratioLabels).toContain('portrait (9:16)');
      expect(ratioLabels).toContain('square (1:1)');
      expect(ratioLabels).toContain('landscape (16:9)');
    });

    it('should have correct aspect ratio values in prompts', () => {
      const portrait = ASPECT_RATIOS.find(ratio => ratio.label.includes('Portrait'));
      expect(portrait?.promptValue).toContain('9:16');

      const square = ASPECT_RATIOS.find(ratio => ratio.label.includes('Square'));
      expect(square?.promptValue).toContain('1:1');

      const landscape = ASPECT_RATIOS.find(ratio => ratio.label.includes('Landscape'));
      expect(landscape?.promptValue).toContain('16:9');
    });
  });

  describe('JEWELRY', () => {
    it('should include traditional Indian jewelry types', () => {
      const jewelryLabels = JEWELRY.map(jewelry => jewelry.label.toLowerCase());
      expect(jewelryLabels).toContain('maharashtrian nath');
      expect(jewelryLabels).toContain('kundan choker');
      expect(jewelryLabels).toContain('temple jewelry set');
      expect(jewelryLabels).toContain('polki diamond set');
    });

    it('should have detailed cultural descriptions', () => {
      const nath = JEWELRY.find(jewelry => jewelry.label.includes('Maharashtrian Nath'));
      expect(nath?.promptValue).toContain('Maharashtrian');
      expect(nath?.promptValue).toContain('nath');
      expect(nath?.promptValue).toContain('paisley');
      expect(nath?.promptValue).toContain('Marathi brides');
    });
  });

  describe('Unique IDs', () => {
    const checkUniqueIds = (options: SelectionOption[], arrayName: string) => {
      it(`should have unique IDs in ${arrayName}`, () => {
        const ids = options.map(option => option.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      });
    };

    checkUniqueIds(LOCATIONS, 'LOCATIONS');
    checkUniqueIds(BRIDE_ATTIRE, 'BRIDE_ATTIRE');
    checkUniqueIds(GROOM_ATTIRE, 'GROOM_ATTIRE');
    checkUniqueIds(BRIDE_POSES, 'BRIDE_POSES');
    checkUniqueIds(GROOM_POSES, 'GROOM_POSES');
    checkUniqueIds(STYLES, 'STYLES');
    checkUniqueIds(ASPECT_RATIOS, 'ASPECT_RATIOS');
    checkUniqueIds(JEWELRY, 'JEWELRY');
    checkUniqueIds(HAIRSTYLES, 'HAIRSTYLES');
    checkUniqueIds(GROOM_HAIRSTYLES, 'GROOM_HAIRSTYLES');
  });

  describe('Image URLs', () => {
    const checkImageUrls = (options: SelectionOption[], arrayName: string) => {
      it(`should have valid image URLs in ${arrayName}`, () => {
        options.forEach(option => {
          if (option.id === 'none') {
            expect(option.imageUrl).toContain('data:image/svg+xml');
          } else {
            expect(option.imageUrl).toMatch(/\.(jpg|jpeg|png)$/i);
            expect(option.imageUrl).toContain('/images/');
          }
        });
      });
    };

    checkImageUrls(LOCATIONS, 'LOCATIONS');
    checkImageUrls(BRIDE_ATTIRE, 'BRIDE_ATTIRE');
    checkImageUrls(GROOM_ATTIRE, 'GROOM_ATTIRE');
    checkImageUrls(BRIDE_POSES, 'BRIDE_POSES');
    checkImageUrls(GROOM_POSES, 'GROOM_POSES');
    checkImageUrls(STYLES, 'STYLES');
    checkImageUrls(ASPECT_RATIOS, 'ASPECT_RATIOS');
    checkImageUrls(JEWELRY, 'JEWELRY');
    checkImageUrls(HAIRSTYLES, 'HAIRSTYLES');
    checkImageUrls(GROOM_HAIRSTYLES, 'GROOM_HAIRSTYLES');
  });
});