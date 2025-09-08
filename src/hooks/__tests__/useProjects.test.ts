import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProjects } from '../useProjects';
import { DatabaseService } from '../../services/databaseService';
import { PreWeddingProject } from '../../lib/supabase';
import { ReactNode } from 'react';

// Mock the AuthContext
const mockUser = { id: 'test-user-id', email: 'test@example.com' };
const mockUseAuth = vi.fn(() => ({ user: mockUser }));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock DatabaseService
vi.mock('../../services/databaseService', () => ({
  DatabaseService: {
    getUserProjects: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    saveGeneratedImage: vi.fn()
  }
}));

describe('useProjects', () => {
  const mockProjects: PreWeddingProject[] = [
    {
      id: 'project-1',
      user_id: 'test-user-id',
      project_name: 'Project 1',
      bride_name: 'Bride 1',
      groom_name: 'Groom 1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 'project-2',
      user_id: 'test-user-id',
      project_name: 'Project 2',
      bride_name: 'Bride 2',
      groom_name: 'Groom 2',
      created_at: '2025-01-02T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser });
  });

  describe('initial state', () => {
    it('should initialize with default values', async () => {
      (DatabaseService.getUserProjects as Mock).mockResolvedValue({ 
        data: [], 
        error: null 
      });

      const { result } = renderHook(() => useProjects());

      expect(result.current.projects).toEqual([]);
      expect(result.current.currentProject).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('fetchProjects', () => {
    it('should fetch projects successfully when user is authenticated', async () => {
      (DatabaseService.getUserProjects as Mock).mockResolvedValue({ 
        data: mockProjects, 
        error: null 
      });

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(DatabaseService.getUserProjects).toHaveBeenCalledWith('test-user-id');
      expect(result.current.projects).toEqual(mockProjects);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch errors', async () => {
      (DatabaseService.getUserProjects as Mock).mockResolvedValue({ 
        data: null, 
        error: { message: 'Failed to fetch' } 
      });

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch projects');
      expect(result.current.projects).toEqual([]);
    });

    it('should not fetch projects when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({ user: null });

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(DatabaseService.getUserProjects).not.toHaveBeenCalled();
      expect(result.current.projects).toEqual([]);
      expect(result.current.currentProject).toBeNull();
    });
  });

  describe('createProject', () => {
    it('should create project successfully', async () => {
      const newProject = { ...mockProjects[0], id: 'new-project' };
      
      (DatabaseService.getUserProjects as Mock).mockResolvedValue({ 
        data: [], 
        error: null 
      });
      (DatabaseService.createProject as Mock).mockResolvedValue({ 
        data: newProject, 
        error: null 
      });

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createResult: any;
      await act(async () => {
        createResult = await result.current.createProject('Test Project', 'Test Bride', 'Test Groom');
      });

      expect(DatabaseService.createProject).toHaveBeenCalledWith('Test Project', 'Test Bride', 'Test Groom');
      expect(createResult).toEqual({ data: newProject, error: null });
      expect(result.current.projects).toContain(newProject);
      expect(result.current.currentProject).toBe(newProject);
    });

    it('should handle create errors', async () => {
      const mockError = { message: 'Create failed' };
      
      (DatabaseService.getUserProjects as Mock).mockResolvedValue({ 
        data: [], 
        error: null 
      });
      (DatabaseService.createProject as Mock).mockResolvedValue({ 
        data: null, 
        error: mockError 
      });

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createResult: any;
      await act(async () => {
        createResult = await result.current.createProject('Test Project');
      });

      expect(createResult).toEqual({ error: mockError });
      expect(result.current.error).toBe('Failed to create project');
    });

    it('should return error when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({ user: null });

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createResult: any;
      await act(async () => {
        createResult = await result.current.createProject('Test Project');
      });

      expect(createResult).toEqual({ error: 'User not authenticated' });
    });
  });

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      const updatedProject = { ...mockProjects[0], project_name: 'Updated Project' };
      
      (DatabaseService.getUserProjects as Mock).mockResolvedValue({ 
        data: mockProjects, 
        error: null 
      });
      (DatabaseService.updateProject as Mock).mockResolvedValue({ 
        data: updatedProject, 
        error: null 
      });

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Set current project
      act(() => {
        result.current.setCurrentProject(mockProjects[0]);
      });

      let updateResult: any;
      await act(async () => {
        updateResult = await result.current.updateProject('project-1', { project_name: 'Updated Project' });
      });

      expect(DatabaseService.updateProject).toHaveBeenCalledWith('project-1', { project_name: 'Updated Project' });
      expect(updateResult).toEqual({ data: updatedProject, error: null });
      
      const updatedProjectInList = result.current.projects.find(p => p.id === 'project-1');
      expect(updatedProjectInList?.project_name).toBe('Updated Project');
      expect(result.current.currentProject?.project_name).toBe('Updated Project');
    });

    it('should handle update errors', async () => {
      const mockError = { message: 'Update failed' };
      
      (DatabaseService.getUserProjects as Mock).mockResolvedValue({ 
        data: mockProjects, 
        error: null 
      });
      (DatabaseService.updateProject as Mock).mockResolvedValue({ 
        data: null, 
        error: mockError 
      });

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult: any;
      await act(async () => {
        updateResult = await result.current.updateProject('project-1', { project_name: 'Updated Project' });
      });

      expect(updateResult).toEqual({ error: mockError });
      expect(result.current.error).toBe('Failed to update project');
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      (DatabaseService.getUserProjects as Mock).mockResolvedValue({ 
        data: mockProjects, 
        error: null 
      });
      (DatabaseService.deleteProject as Mock).mockResolvedValue({ 
        error: null 
      });

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Set current project
      act(() => {
        result.current.setCurrentProject(mockProjects[0]);
      });

      let deleteResult: any;
      await act(async () => {
        deleteResult = await result.current.deleteProject('project-1');
      });

      expect(DatabaseService.deleteProject).toHaveBeenCalledWith('project-1');
      expect(deleteResult).toEqual({ error: null });
      expect(result.current.projects).not.toContain(mockProjects[0]);
      expect(result.current.currentProject).toBeNull();
    });

    it('should handle delete errors', async () => {
      const mockError = { message: 'Delete failed' };
      
      (DatabaseService.getUserProjects as Mock).mockResolvedValue({ 
        data: mockProjects, 
        error: null 
      });
      (DatabaseService.deleteProject as Mock).mockResolvedValue({ 
        error: mockError 
      });

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let deleteResult: any;
      await act(async () => {
        deleteResult = await result.current.deleteProject('project-1');
      });

      expect(deleteResult).toEqual({ error: mockError });
      expect(result.current.error).toBe('Failed to delete project');
    });
  });

  describe('saveGeneratedImage', () => {
    it('should save generated image successfully', async () => {
      const mockImageData = {
        id: 'image-1',
        project_id: 'project-1',
        image_url: 'https://example.com/image.jpg',
        image_type: 'bride' as const,
        config_used: {} as any,
        created_at: '2025-01-01T00:00:00Z'
      };

      (DatabaseService.getUserProjects as Mock).mockResolvedValue({ 
        data: [], 
        error: null 
      });
      (DatabaseService.saveGeneratedImage as Mock).mockResolvedValue({ 
        data: mockImageData, 
        error: null 
      });

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let saveResult: any;
      await act(async () => {
        saveResult = await result.current.saveGeneratedImage(
          'project-1',
          'https://example.com/image.jpg',
          'bride',
          {} as any
        );
      });

      expect(DatabaseService.saveGeneratedImage).toHaveBeenCalledWith(
        'project-1',
        'https://example.com/image.jpg',
        'bride',
        {}
      );
      expect(saveResult).toEqual({ data: mockImageData, error: null });
    });
  });

  describe('refreshProjects', () => {
    it('should refresh projects when called', async () => {
      (DatabaseService.getUserProjects as Mock)
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: mockProjects, error: null });

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.projects).toEqual([]);

      await act(async () => {
        await result.current.refreshProjects();
      });

      expect(result.current.projects).toEqual(mockProjects);
      expect(DatabaseService.getUserProjects).toHaveBeenCalledTimes(2);
    });
  });
});