import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FavoritesService } from '../services/favoritesService';
import { FavoriteItem } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage?: (imageUrl: string, config: any) => void;
}

const FavoritesModal: React.FC<FavoritesModalProps> = ({ isOpen, onClose, onSelectImage }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'bride' | 'groom' | 'couple'>('all');
  const [editingFavorite, setEditingFavorite] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      loadFavorites();
    }
  }, [isOpen, user]);

  const loadFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await FavoritesService.getUserFavorites(user.id);
      if (error) throw error;
      setFavorites(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      const { error } = await FavoritesService.removeFromFavorites(favoriteId);
      if (error) throw error;
      
      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove favorite');
    }
  };

  const handleEditFavorite = (favorite: FavoriteItem) => {
    setEditingFavorite(favorite.id);
    setEditTitle(favorite.title || '');
    setEditNotes(favorite.notes || '');
  };

  const handleSaveEdit = async () => {
    if (!editingFavorite) return;
    
    try {
      const { error } = await FavoritesService.updateFavorite(editingFavorite, {
        title: editTitle || null,
        notes: editNotes || null,
      });
      
      if (error) throw error;
      
      setFavorites(prev => prev.map(fav => 
        fav.id === editingFavorite 
          ? { ...fav, title: editTitle || null, notes: editNotes || null }
          : fav
      ));
      
      setEditingFavorite(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update favorite');
    }
  };

  const filteredFavorites = favorites.filter(fav => 
    filter === 'all' || fav.image_type === filter
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">My Favorites</h2>
            <p className="text-gray-600">Manage your saved wedding looks</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Filter tabs */}
          <div className="flex space-x-4 mb-6">
            {[
              { key: 'all', label: 'All', icon: '💕' },
              { key: 'bride', label: 'Bride', icon: '👰' },
              { key: 'groom', label: 'Groom', icon: '🤵' },
              { key: 'couple', label: 'Couple', icon: '💑' }
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key as typeof filter)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  filter === key
                    ? 'bg-rose-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{icon}</span>
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner message="Loading favorites..." />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                <p>{error}</p>
                <button
                  onClick={loadFavorites}
                  className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
                >
                  Retry
                </button>
              </div>
            ) : filteredFavorites.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <p className="text-lg font-medium">No favorites yet</p>
                <p className="text-sm">Start creating looks and save your favorites!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFavorites.map((favorite) => (
                  <div key={favorite.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="relative group">
                      <img
                        src={favorite.image_url}
                        alt={favorite.title || `${favorite.image_type} look`}
                        className="w-full h-48 object-cover rounded-lg cursor-pointer"
                        onClick={() => onSelectImage?.(favorite.image_url, favorite.config_used)}
                      />
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <button
                          onClick={() => handleEditFavorite(favorite)}
                          className="bg-blue-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleRemoveFavorite(favorite.id)}
                          className="bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {editingFavorite === favorite.id ? (
                      <div className="mt-3 space-y-2">
                        <input
                          type="text"
                          placeholder="Title"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <textarea
                          placeholder="Notes"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            className="flex-1 bg-green-500 text-white py-1 px-3 rounded-md text-sm hover:bg-green-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingFavorite(null)}
                            className="flex-1 bg-gray-500 text-white py-1 px-3 rounded-md text-sm hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <h4 className="font-semibold text-gray-800 capitalize">
                          {favorite.title || `${favorite.image_type} Look`}
                        </h4>
                        {favorite.notes && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{favorite.notes}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(favorite.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
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

export default FavoritesModal;