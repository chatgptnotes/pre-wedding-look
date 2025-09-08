import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/databaseService';
import { PreWeddingProject, GeneratedImage } from '../lib/supabase';

interface MyProjectsProps {
  onClose: () => void;
  onLoadProject: (project: PreWeddingProject) => void;
}

const MyProjects: React.FC<MyProjectsProps> = ({ onClose, onLoadProject }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<PreWeddingProject[]>([]);
  const [projectImages, setProjectImages] = useState<{ [key: string]: GeneratedImage[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await DatabaseService.getUserProjects(user.id);
      
      if (error) {
        setError('Failed to load projects');
        console.error('Error fetching projects:', error);
        return;
      }

      setProjects(data || []);

      // Fetch images for each project
      const imagePromises = (data || []).map(async (project) => {
        const { data: images } = await DatabaseService.getProjectImages(project.id);
        return { projectId: project.id, images: images || [] };
      });

      const imageResults = await Promise.all(imagePromises);
      const imageMap: { [key: string]: GeneratedImage[] } = {};
      
      imageResults.forEach(({ projectId, images }) => {
        imageMap[projectId] = images;
      });

      setProjectImages(imageMap);
    } catch (err) {
      setError('Failed to load projects');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await DatabaseService.deleteProject(projectId);
      if (error) {
        console.error('Error deleting project:', error);
        return;
      }

      setProjects(prev => prev.filter(p => p.id !== projectId));
      setProjectImages(prev => {
        const { [projectId]: deleted, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const downloadImage = (imageUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 10000,
          margin: 0,
          padding: 0
        }}
      >
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 w-96 max-w-[90vw] shadow-2xl">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 10000,
        margin: 0,
        padding: '1rem'
      }}
    >
      <div 
        className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
        style={{
          width: '100%',
          maxWidth: '90vw',
          maxHeight: '90vh',
          minHeight: '60vh'
        }}
      >
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                My Projects 📸
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {projects.length} project{projects.length !== 1 ? 's' : ''} created
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 hover:bg-rose-100 rounded-full flex items-center justify-center text-gray-500 hover:text-rose-600 transition-all duration-300 text-xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div 
            className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            style={{ maxHeight: 'calc(90vh - 200px)' }}
          >
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📸</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No projects yet</h3>
                <p className="text-gray-500 mb-6">Start creating your first magical pre-wedding photos!</p>
                <button
                  onClick={onClose}
                  className="bg-gradient-to-r from-rose-600 to-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Start Creating
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-gradient-to-r from-white to-rose-50/30 rounded-2xl p-6 border border-rose-100 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{project.project_name}</h3>
                        <p className="text-sm text-gray-500">
                          Created {new Date(project.created_at).toLocaleDateString()}
                        </p>
                        {(project.bride_name || project.groom_name) && (
                          <p className="text-sm text-gray-600 mt-1">
                            {project.bride_name && project.groom_name 
                              ? `${project.bride_name} & ${project.groom_name}`
                              : project.bride_name || project.groom_name}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onLoadProject(project)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Saved Images from Storage */}
                    <div className="space-y-4">
                      {projectImages[project.id] && projectImages[project.id].length > 0 ? (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Saved Images ({projectImages[project.id].length})
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {projectImages[project.id].map((image) => (
                              <div key={image.id} className="relative group">
                                <img
                                  src={image.image_url}
                                  alt={`${image.image_type} photo`}
                                  className="w-full h-24 object-cover rounded-lg shadow-md border-2 border-green-200"
                                />
                                <div className="absolute top-2 left-2">
                                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                    {image.image_type}
                                  </span>
                                </div>
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                  <button
                                    onClick={() => downloadImage(image.image_url, `${image.image_type}-${Date.now()}.jpg`)}
                                    className="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold hover:bg-white transition-all flex items-center"
                                  >
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    Download
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-500 text-sm">No saved images yet</p>
                          <p className="text-gray-400 text-xs mt-1">Generate and save images to see them here</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProjects;