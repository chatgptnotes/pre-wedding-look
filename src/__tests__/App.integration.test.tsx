import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock the geminiService
vi.mock('../services/geminiService', () => ({
  generatePersonalizedImage: vi.fn()
}));

// Mock the databaseService
vi.mock('../services/databaseService', () => ({
  DatabaseService: {
    createProject: vi.fn(),
    getUserProjects: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    saveGeneratedImage: vi.fn()
  }
}));

// Mock the AuthContext
const mockUser = { id: 'test-user-id', email: 'test@example.com' };
vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({ 
    user: mockUser, 
    loading: false 
  })
}));

import { generatePersonalizedImage } from '../services/geminiService';
import { DatabaseService } from '../services/databaseService';

describe('App Integration Tests', () => {
  const mockGeneratePersonalizedImage = generatePersonalizedImage as Mock;
  const mockCreateProject = DatabaseService.createProject as Mock;
  
  const navigateToBrideStage = async () => {
    const getStartedButton = screen.getByText(/Enter Creative Studio|Start Your Journey/i);
    fireEvent.click(getStartedButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Start Classic Mode/i)).toBeInTheDocument();
    });

    const classicModeButton = screen.getByText(/Start Classic Mode/i);
    fireEvent.click(classicModeButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Step 1: Style the Bride/i)).toBeInTheDocument();
    });
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful image generation
    mockGeneratePersonalizedImage.mockResolvedValue('data:image/jpeg;base64,mock-generated-image');
    
    // Mock successful project creation
    mockCreateProject.mockResolvedValue({
      data: {
        id: 'test-project-id',
        user_id: 'test-user-id',
        project_name: 'Test Project',
        created_at: '2025-01-01T00:00:00Z'
      },
      error: null
    });
  });

  describe('Landing Page Flow', () => {
    it('should show landing page initially', () => {
      render(<App />);
      
      expect(screen.getByText(/Enter Creative Studio|Start Your Journey/i)).toBeInTheDocument();
      expect(screen.getByText(/Next-Generation AI Photo Studio/i)).toBeInTheDocument();
      expect(screen.getByText(/Create. Transform./i)).toBeInTheDocument();
    });

    it('should navigate to bride stage when get started is clicked', async () => {
      render(<App />);
      
      // Click main get started button to enter tabs interface
      const getStartedButton = screen.getByText(/Enter Creative Studio|Start Your Journey/i);
      fireEvent.click(getStartedButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Classic Pre-Wedding Mode/i)).toBeInTheDocument();
        expect(screen.getByText(/Start Classic Mode/i)).toBeInTheDocument();
      });

      // Click the classic mode button to enter bride stage
      const classicModeButton = screen.getByText(/Start Classic Mode/i);
      fireEvent.click(classicModeButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Step 1: Style the Bride/i)).toBeInTheDocument();
        expect(screen.getByText(/Upload Bride's Photo/i)).toBeInTheDocument();
      });
    });
  });

  describe('Bride Stage Flow', () => {
    beforeEach(async () => {
      render(<App />);
      await navigateToBrideStage();
    });

    it('should show bride upload and styling options', () => {
      expect(screen.getByText(/Upload Bride's Photo/i)).toBeInTheDocument();
      expect(screen.getByText(/Bride's Attire/i)).toBeInTheDocument();
      expect(screen.getByText(/Bride's Hairstyle/i)).toBeInTheDocument();
      expect(screen.getByText(/Bride's Jewelry/i)).toBeInTheDocument();
    });

    it('should have style bride button disabled initially', () => {
      const styleBrideButton = screen.getByText(/Style Bride/i);
      expect(styleBrideButton).toBeDisabled();
    });

    it('should enable style bride button when image is uploaded', async () => {
      // Mock file upload
      const file = new File(['test'], 'bride.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Upload Bride's Photo/i);
      
      await userEvent.upload(fileInput, file);
      
      await waitFor(() => {
        const styleBrideButton = screen.getByText(/Style Bride/i);
        expect(styleBrideButton).toBeEnabled();
      });
    });

    it('should call image generation when style bride is clicked with uploaded image', async () => {
      // Mock file upload
      const file = new File(['test'], 'bride.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Upload Bride's Photo/i);
      
      await userEvent.upload(fileInput, file);
      
      await waitFor(() => {
        const styleBrideButton = screen.getByText(/Style Bride/i);
        expect(styleBrideButton).toBeEnabled();
      });

      const styleBrideButton = screen.getByText(/Style Bride/i);
      fireEvent.click(styleBrideButton);

      await waitFor(() => {
        expect(mockGeneratePersonalizedImage).toHaveBeenCalledWith(
          expect.any(Object), // config
          expect.stringContaining('data:image/jpeg;base64,'), // bride image
          null // no groom image
        );
      });
    });

    it('should show loading state during image generation', async () => {
      // Make image generation take some time
      mockGeneratePersonalizedImage.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const file = new File(['test'], 'bride.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Upload Bride's Photo/i);
      
      await userEvent.upload(fileInput, file);
      
      const styleBrideButton = screen.getByText(/Style Bride/i);
      fireEvent.click(styleBrideButton);

      expect(screen.getByText(/Styling.../i)).toBeInTheDocument();
    });

    it('should enable continue to groom button after successful generation', async () => {
      const file = new File(['test'], 'bride.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Upload Bride's Photo/i);
      
      await userEvent.upload(fileInput, file);
      
      const styleBrideButton = screen.getByText(/Style Bride/i);
      fireEvent.click(styleBrideButton);

      await waitFor(() => {
        const continueButton = screen.getByText(/Continue to Groom/i);
        expect(continueButton).toBeEnabled();
      });
    });
  });

  describe('Groom Stage Flow', () => {
    beforeEach(async () => {
      render(<App />);
      await navigateToBrideStage();

      // Upload bride image and generate
      const brideFile = new File(['test'], 'bride.jpg', { type: 'image/jpeg' });
      const brideFileInput = screen.getByLabelText(/Upload Bride's Photo/i);
      await userEvent.upload(brideFileInput, brideFile);
      
      const styleBrideButton = screen.getByText(/Style Bride/i);
      fireEvent.click(styleBrideButton);

      await waitFor(() => {
        const continueButton = screen.getByText(/Continue to Groom/i);
        fireEvent.click(continueButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Step 2: Style the Groom/i)).toBeInTheDocument();
      });
    });

    it('should show groom styling options', () => {
      expect(screen.getByText(/Upload Groom's Photo/i)).toBeInTheDocument();
      expect(screen.getByText(/Groom's Attire/i)).toBeInTheDocument();
      expect(screen.getByText(/Groom's Hairstyle/i)).toBeInTheDocument();
    });

    it('should generate groom image and enable continue to scene', async () => {
      const groomFile = new File(['test'], 'groom.jpg', { type: 'image/jpeg' });
      const groomFileInput = screen.getByLabelText(/Upload Groom's Photo/i);
      await userEvent.upload(groomFileInput, groomFile);
      
      const styleGroomButton = screen.getByText(/Style Groom/i);
      fireEvent.click(styleGroomButton);

      await waitFor(() => {
        expect(mockGeneratePersonalizedImage).toHaveBeenCalledWith(
          expect.any(Object),
          null, // no bride image in groom generation
          expect.stringContaining('data:image/jpeg;base64,')
        );
      });

      await waitFor(() => {
        const continueButton = screen.getByText(/Continue to Scene/i);
        expect(continueButton).toBeEnabled();
      });
    });
  });

  describe('Couple Stage Flow', () => {
    beforeEach(async () => {
      render(<App />);
      await navigateToBrideStage();

      // Complete bride stage
      const brideFile = new File(['test'], 'bride.jpg', { type: 'image/jpeg' });
      const brideFileInput = screen.getByLabelText(/Upload Bride's Photo/i);
      await userEvent.upload(brideFileInput, brideFile);
      
      const styleBrideButton = screen.getByText(/Style Bride/i);
      fireEvent.click(styleBrideButton);

      await waitFor(() => {
        const continueButton = screen.getByText(/Continue to Groom/i);
        fireEvent.click(continueButton);
      });

      // Complete groom stage
      await waitFor(() => {
        expect(screen.getByText(/Step 2: Style the Groom/i)).toBeInTheDocument();
      });

      const groomFile = new File(['test'], 'groom.jpg', { type: 'image/jpeg' });
      const groomFileInput = screen.getByLabelText(/Upload Groom's Photo/i);
      await userEvent.upload(groomFileInput, groomFile);
      
      const styleGroomButton = screen.getByText(/Style Groom/i);
      fireEvent.click(styleGroomButton);

      await waitFor(() => {
        const continueButton = screen.getByText(/Continue to Scene/i);
        fireEvent.click(continueButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Step 3: Create the Scene/i)).toBeInTheDocument();
      });
    });

    it('should show couple scene options and generated images', () => {
      expect(screen.getByText(/Step 3: Create the Scene/i)).toBeInTheDocument();
      expect(screen.getByText(/Styled Bride/i)).toBeInTheDocument();
      expect(screen.getByText(/Styled Groom/i)).toBeInTheDocument();
      expect(screen.getByText(/Choose a Location/i)).toBeInTheDocument();
      expect(screen.getByText(/Bride's Pose/i)).toBeInTheDocument();
      expect(screen.getByText(/Groom's Pose/i)).toBeInTheDocument();
    });

    it('should generate couple scene when generate scene is clicked', async () => {
      const generateSceneButton = screen.getByText(/Generate Scene/i);
      fireEvent.click(generateSceneButton);

      await waitFor(() => {
        expect(mockGeneratePersonalizedImage).toHaveBeenCalledWith(
          expect.any(Object),
          expect.stringContaining('data:image/jpeg;base64,'), // bride image
          expect.stringContaining('data:image/jpeg;base64,') // groom image
        );
      });
    });

    it('should show magic creation button', () => {
      expect(screen.getByText(/Magic Creation/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show error message when image generation fails', async () => {
      mockGeneratePersonalizedImage.mockRejectedValue(new Error('Generation failed'));
      
      render(<App />);
      await navigateToBrideStage();

      // Upload image and try to generate
      const file = new File(['test'], 'bride.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Upload Bride's Photo/i);
      await userEvent.upload(fileInput, file);
      
      const styleBrideButton = screen.getByText(/Style Bride/i);
      fireEvent.click(styleBrideButton);

      await waitFor(() => {
        expect(screen.getByText(/Generation failed/i)).toBeInTheDocument();
      });
    });

    it('should show error when trying to generate without uploaded image', async () => {
      render(<App />);
      await navigateToBrideStage();

      // Try to generate without uploading image - button should be disabled
      const styleBrideButton = screen.getByText(/Style Bride/i);
      expect(styleBrideButton).toBeDisabled();
    });
  });

  describe('Start Over Functionality', () => {
    it('should reset to landing page when start over is clicked', async () => {
      render(<App />);
      await navigateToBrideStage();

      // Click start over
      const startOverButton = screen.getByText(/Start Over/i);
      fireEvent.click(startOverButton);

      await waitFor(() => {
        expect(screen.getByText(/Enter Creative Studio|Start Your Journey/i)).toBeInTheDocument();
        expect(screen.queryByText(/Step 1: Style the Bride/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Configuration Changes', () => {
    it('should update configuration when option selectors are changed', async () => {
      render(<App />);
      await navigateToBrideStage();

      // Check for option selectors (this will depend on the actual OptionSelector implementation)
      expect(screen.getByText(/Bride's Attire/i)).toBeInTheDocument();
      expect(screen.getByText(/Bride's Hairstyle/i)).toBeInTheDocument();
      expect(screen.getByText(/Bride's Jewelry/i)).toBeInTheDocument();
    });
  });
});