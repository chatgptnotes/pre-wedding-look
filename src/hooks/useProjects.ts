import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/databaseService';
import { PreWeddingProject } from '../lib/supabase';

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<PreWeddingProject[]>([]);
  const [currentProject, setCurrentProject] = useState<PreWeddingProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setProjects([]);
      setCurrentProject(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await DatabaseService.getUserProjects(user.id);
    
    if (error) {
      setError('Failed to fetch projects');
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
    
    setLoading(false);
  };

  const createProject = async (name: string, brideName?: string, groomName?: string) => {
    if (!user) return { error: 'User not authenticated' };

    const { data, error } = await DatabaseService.createProject(name, brideName, groomName);
    
    if (error) {
      setError('Failed to create project');
      return { error };
    }

    if (data) {
      setProjects(prev => [data, ...prev]);
      setCurrentProject(data);
    }

    return { data, error };
  };

  const updateProject = async (projectId: string, updates: Partial<PreWeddingProject>) => {
    const { data, error } = await DatabaseService.updateProject(projectId, updates);
    
    if (error) {
      setError('Failed to update project');
      return { error };
    }

    if (data) {
      setProjects(prev => prev.map(p => p.id === projectId ? data : p));
      if (currentProject?.id === projectId) {
        setCurrentProject(data);
      }
    }

    return { data, error };
  };

  const deleteProject = async (projectId: string) => {
    const { error } = await DatabaseService.deleteProject(projectId);
    
    if (error) {
      setError('Failed to delete project');
      return { error };
    }

    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
    }

    return { error: null };
  };

  const saveGeneratedImage = async (
    projectId: string,
    imageUrl: string,
    imageType: 'bride' | 'groom' | 'couple',
    configUsed: any
  ) => {
    const { data, error } = await DatabaseService.saveGeneratedImage(
      projectId,
      imageUrl,
      imageType,
      configUsed
    );

    if (error) {
      console.error('Error saving generated image:', error);
    }

    return { data, error };
  };

  return {
    projects,
    currentProject,
    setCurrentProject,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    saveGeneratedImage,
    refreshProjects: fetchProjects,
  };
};