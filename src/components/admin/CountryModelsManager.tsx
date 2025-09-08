import React, { useState, useEffect } from 'react';
import { GalleryService } from '../../services/galleryService';
import type { Country, CountryModel, ModelRole, CountryWithModels } from '../../types/gallery';

interface PendingUpload {
  countryIso: string;
  role: ModelRole;
  file: File;
  previewUrl: string;
}

const CountryModelsManager: React.FC = () => {
  const [countries, setCountries] = useState<CountryWithModels[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('IN');
  const [loading, setLoading] = useState(false);
  const [uploadingRole, setUploadingRole] = useState<ModelRole | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [saving, setSaving] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);

  useEffect(() => {
    loadCountriesWithModels();
    // Check if we're in demo mode
    const checkDemoMode = () => {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const forceDemoMode = import.meta.env.VITE_FORCE_DEMO_MODE === 'true';
      setIsDemoMode(!(url && anonKey) || forceDemoMode);
    };
    checkDemoMode();
  }, []);

  const loadCountriesWithModels = async () => {
    try {
      setLoading(true);
      setErrorMessage(''); // Clear any previous errors
      setDatabaseError(null); // Clear database error
      console.log('Debug: Loading countries with models...');
      const data = await GalleryService.getCountriesWithModels();
      console.log('Debug: Loaded countries:', data);
      setCountries(data);
      
      // Check if we got demo data fallback (would indicate database issues)
      if (data.length > 0 && data[0].id === '1a2b3c4d-5e6f-7890-abcd-ef1234567890') {
        console.log('Debug: Detected demo data fallback, likely due to database issues');
        setDatabaseError('Database connection issues detected. Using demo mode.');
        setIsDemoMode(true);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
      setErrorMessage('Failed to load countries');
      setDatabaseError(error.message || 'Unknown database error');
      setIsDemoMode(true); // Force demo mode on error
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    countryIso: string,
    role: ModelRole,
    file: File
  ) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingRole(role);
      setErrorMessage('');
      setSuccessMessage('');

      console.log('Debug: Starting upload for', countryIso, role);

      // Create preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);

      // Add to pending uploads
      const pendingUpload: PendingUpload = {
        countryIso,
        role,
        file,
        previewUrl
      };

      setPendingUploads(prev => {
        // Remove any existing upload for same country/role
        const filtered = prev.filter(p => !(p.countryIso === countryIso && p.role === role));
        return [...filtered, pendingUpload];
      });

      // Create demo model for immediate preview
      const country = countries.find(c => c.iso_code === countryIso);
      if (country) {
        const { url, path, sha256 } = await GalleryService.uploadModelImage(
          file,
          countryIso,
          role
        );

        await GalleryService.createOrUpdateModel(
          country.id,
          role,
          url,
          path,
          sha256,
          {
            uploaded_at: new Date().toISOString(),
            file_name: file.name,
            file_size: file.size
          },
          true // Always save to database in admin panel
        );

        console.log('Debug: Model saved to database with admin client');
        setSuccessMessage(`${role.charAt(0).toUpperCase() + role.slice(1)} model uploaded and saved successfully!`);
        
        // Reload countries to show new model
        await loadCountriesWithModels();
      }
    } catch (error) {
      console.error('Error uploading model:', error);
      setErrorMessage(`Failed to upload ${role} model: ${error.message || 'Unknown error'}`);
    } finally {
      setUploadingRole(null);
    }
  };

  const handleSaveAll = async () => {
    if (pendingUploads.length === 0) {
      setErrorMessage('No pending uploads to save');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      console.log('Debug: Saving all pending uploads to Supabase:', pendingUploads);

      for (const upload of pendingUploads) {
        console.log(`Debug: Saving ${upload.role} model for ${upload.countryIso}`);

        // Get country
        const country = countries.find(c => c.iso_code === upload.countryIso);
        if (!country) {
          throw new Error(`Country not found: ${upload.countryIso}`);
        }

        // Upload to Supabase storage
        const { url, path, sha256 } = await GalleryService.uploadModelImage(
          upload.file,
          upload.countryIso,
          upload.role,
          true // Save to storage
        );

        // Save model to database
        await GalleryService.createOrUpdateModel(
          country.id,
          upload.role,
          url,
          path,
          sha256,
          {
            uploaded_at: new Date().toISOString(),
            file_name: upload.file.name,
            file_size: upload.file.size
          },
          true // Save to database
        );
      }

      // Clear pending uploads
      setPendingUploads([]);
      setSuccessMessage(`Successfully saved ${pendingUploads.length} model(s) to database`);

      // Reload countries to show updated models
      await loadCountriesWithModels();

    } catch (error) {
      console.error('Error saving models:', error);
      setErrorMessage(`Failed to save models: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const currentCountry = countries.find(c => c.iso_code === selectedCountry);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        Country Models Manager
      </h2>

      {/* Demo Mode Warning */}
      {isDemoMode && (
        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-orange-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
            </svg>
            <div>
              <h4 className="font-semibold text-orange-800">Demo Mode Active</h4>
              <p className="text-sm text-orange-700">
                {databaseError 
                  ? `Database connection failed: ${databaseError}. Using demo mode.`
                  : 'Supabase database is not configured. Images are stored temporarily and will not persist between sessions.'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Database Error Warning (when not in demo mode but there are issues) */}
      {!isDemoMode && databaseError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
            </svg>
            <div>
              <h4 className="font-semibold text-red-800">Database Connection Issues</h4>
              <p className="text-sm text-red-700">Error: {databaseError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Country Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Country
        </label>
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          disabled={loading}
        >
          {countries.map(country => (
            <option key={country.id} value={country.iso_code}>
              {country.flag_emoji} {country.name} ({country.imageCount} images)
            </option>
          ))}
        </select>
      </div>

      {/* Current Models Display */}
      {currentCountry && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bride Model */}
          <ModelUploadCard
            country={currentCountry}
            role="bride"
            model={currentCountry.models.bride}
            onUpload={handleFileUpload}
            isUploading={uploadingRole === 'bride'}
          />

          {/* Groom Model */}
          <ModelUploadCard
            country={currentCountry}
            role="groom"
            model={currentCountry.models.groom}
            onUpload={handleFileUpload}
            isUploading={uploadingRole === 'groom'}
          />
        </div>
      )}

      {/* Save All Button */}
      {pendingUploads.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving to Database...
              </div>
            ) : (
              `Save All Models (${pendingUploads.length})`
            )}
          </button>
        </div>
      )}

      {/* Stats Section */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Gallery Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Countries:</span>
            <span className="ml-2 font-semibold">{countries.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Active Models:</span>
            <span className="ml-2 font-semibold">
              {countries.reduce((acc, c) => 
                acc + (c.models.bride ? 1 : 0) + (c.models.groom ? 1 : 0), 0
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Total Images:</span>
            <span className="ml-2 font-semibold">
              {countries.reduce((acc, c) => acc + c.imageCount, 0)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Countries with Models:</span>
            <span className="ml-2 font-semibold">
              {countries.filter(c => c.models.bride || c.models.groom).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ModelUploadCardProps {
  country: CountryWithModels;
  role: ModelRole;
  model?: CountryModel;
  onUpload: (iso: string, role: ModelRole, file: File) => Promise<void>;
  isUploading: boolean;
}

const ModelUploadCard: React.FC<ModelUploadCardProps> = ({
  country,
  role,
  model,
  onUpload,
  isUploading
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await onUpload(country.iso_code, role, e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await onUpload(country.iso_code, role, e.target.files[0]);
    }
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold capitalize">
          {role === 'bride' ? '👰 Bride Model' : '🤵 Groom Model'}
        </h4>
        <span className={`px-2 py-1 text-xs rounded-full ${
          model ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {model ? 'Active' : 'Not Set'}
        </span>
      </div>

      {/* Current Model Display */}
      {model && (
        <div className="mb-4">
          <img
            src={model.source_image_url}
            alt={`${country.name} ${role} model`}
            className="w-full h-48 object-cover rounded-lg"
            onError={(e) => {
              console.log('Image failed to load:', model.source_image_url);
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="mt-2 text-xs text-gray-500">
            <p>Uploaded: {new Date(model.created_at).toLocaleDateString()}</p>
            <p className="truncate">ID: {model.id}</p>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
          dragActive 
            ? 'border-purple-500 bg-purple-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-purple-600 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-600">
              {model ? 'Click or drag to replace' : 'Click or drag to upload'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG up to 5MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CountryModelsManager;