import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, PencilIcon, TrashIcon, PhotoIcon, SwatchIcon, MapPinIcon } from '@heroicons/react/24/solid';
import { DatabaseService } from '../services/databaseService';
import { AuthService, ADMIN_FEATURES, AdminFeature } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import AIIntegrationDocumentation from './AIIntegrationDocumentation';
import VideoDemoScript from './VideoDemoScript';
import VisualEffectsLibrary from './VisualEffectsLibrary';
import CountryModelsManager from './admin/CountryModelsManager';
import StyleApplicationPanel from './admin/StyleApplicationPanel';

type AdminSection = 'locations' | 'attire' | 'jewelry' | 'poses' | 'styles' | 'hairstyles' | 'regional-styles' | 'ai-integration' | 'video-demo' | 'visual-effects' | 'user-management' | 'system-settings' | 'analytics' | 'country-models' | 'style-application';

interface AdminItem {
  id: string;
  name: string;
  promptValue: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RegionalStyle {
  id: string;
  name: string;
  region: string;
  description: string;
  brideAttire: string;
  groomAttire: string;
  colors: string[];
  jewelry: string;
  backdrop: string;
  rituals: string[];
  icon: string;
  flag: string;
}

const ADMIN_SECTIONS = [
  // Content Management (Available to both Admin and SuperAdmin)
  { 
    id: 'locations' as AdminSection, 
    name: 'Locations & Backgrounds', 
    icon: <MapPinIcon className="w-5 h-5" />,
    color: 'from-blue-500 to-cyan-600',
    description: 'Manage romantic locations and backgrounds for photo shoots',
    requiredRole: 'admin' as const
  },
  { 
    id: 'attire' as AdminSection, 
    name: 'Wedding Attire', 
    icon: <SwatchIcon className="w-5 h-5" />,
    color: 'from-purple-500 to-pink-600',
    description: 'Bride and groom traditional and modern outfit options',
    requiredRole: 'admin' as const
  },
  { 
    id: 'jewelry' as AdminSection, 
    name: 'Jewelry & Accessories', 
    icon: <span className="text-sm">💎</span>,
    color: 'from-amber-500 to-orange-600',
    description: 'Traditional and contemporary jewelry collections',
    requiredRole: 'admin' as const
  },
  { 
    id: 'poses' as AdminSection, 
    name: 'Poses & Expressions', 
    icon: <span className="text-sm">🤳</span>,
    color: 'from-rose-500 to-pink-600',
    description: 'Romantic poses and natural expressions',
    requiredRole: 'admin' as const
  },
  { 
    id: 'styles' as AdminSection, 
    name: 'Art & Photography Styles', 
    icon: <PhotoIcon className="w-5 h-5" />,
    color: 'from-indigo-500 to-purple-600',
    description: 'Cinematic, artistic, and photography style presets',
    requiredRole: 'admin' as const
  },
  { 
    id: 'hairstyles' as AdminSection, 
    name: 'Hairstyles & Makeup', 
    icon: <span className="text-sm">💇</span>,
    color: 'from-emerald-500 to-teal-600',
    description: 'Traditional and modern hairstyle and makeup options',
    requiredRole: 'admin' as const
  },
  { 
    id: 'regional-styles' as AdminSection, 
    name: 'Regional & Cultural Styles', 
    icon: <span className="text-sm">🏛️</span>,
    color: 'from-orange-500 to-red-600',
    description: 'Cultural wedding traditions and regional authenticity',
    requiredRole: 'admin' as const
  },
  {
    id: 'ai-integration' as AdminSection,
    name: 'AI Integration Overview',
    icon: <span className="text-sm">🤖</span>,
    color: 'from-cyan-500 to-blue-600',
    description: 'Professional AI integration documentation and technical overview',
    requiredRole: 'admin' as const
  },
  {
    id: 'video-demo' as AdminSection,
    name: 'Video Demo Script',
    icon: <span className="text-sm">🎬</span>,
    color: 'from-red-500 to-pink-600',
    description: 'Create engaging video demonstration script (2 minutes or less)',
    requiredRole: 'admin' as const
  },
  {
    id: 'visual-effects' as AdminSection,
    name: 'Visual Effects Library',
    icon: <span className="text-sm">✨</span>,
    color: 'from-violet-500 to-purple-600',
    description: 'Higgsfield.ai visual effects, animations and actions for video enhancement',
    requiredRole: 'admin' as const
  },
  
  // SuperAdmin Only Sections
  { 
    id: 'user-management' as AdminSection, 
    name: 'User Management', 
    icon: <span className="text-sm">👥</span>,
    color: 'from-indigo-600 to-blue-700',
    description: 'Manage admin users, roles and permissions',
    requiredRole: 'superadmin' as const
  },
  { 
    id: 'system-settings' as AdminSection, 
    name: 'System Settings', 
    icon: <span className="text-sm">⚙️</span>,
    color: 'from-gray-600 to-slate-700',
    description: 'Configure system-wide settings and preferences',
    requiredRole: 'superadmin' as const
  },
  { 
    id: 'analytics' as AdminSection, 
    name: 'Analytics & Reports', 
    icon: <span className="text-sm">📊</span>,
    color: 'from-green-600 to-emerald-700',
    description: 'View usage statistics, user analytics, and generate reports',
    requiredRole: 'superadmin' as const
  },
  // Gallery Management (New Features)
  { 
    id: 'country-models' as AdminSection, 
    name: 'Country Models Manager', 
    icon: <span className="text-sm">🌍</span>,
    color: 'from-violet-500 to-purple-600',
    description: 'Upload and manage model faces for different countries. One bride + one groom per country.',
    requiredRole: 'admin' as const
  },
  { 
    id: 'style-application' as AdminSection, 
    name: 'Style Application System', 
    icon: <span className="text-sm">🎨</span>,
    color: 'from-rose-500 to-pink-600',
    description: 'Apply styles to country models with one-click generation. Create gallery images.',
    requiredRole: 'admin' as const
  }
];

interface AdminPageProps {
  onBack?: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onBack }) => {
  const { user } = useAuth();
  
  // Check admin permissions on component mount
  useEffect(() => {
    try {
      AuthService.requireAdmin(user);
    } catch (error) {
      alert('Access denied. Redirecting to home.');
      onBack?.();
    }
  }, [user, onBack]);
  
  // Get user role info
  const userInfo = AuthService.getUserDisplayInfo(user);
  const isSuperAdmin = AuthService.isSuperAdmin(user);
  
  const [activeSection, setActiveSection] = useState<AdminSection>('locations');
  const [items, setItems] = useState<AdminItem[]>([]);
  const [regionalStyles, setRegionalStyles] = useState<RegionalStyle[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for adding/editing items
  const [formData, setFormData] = useState({
    name: '',
    promptValue: '',
    description: '',
    imageUrl: '',
    category: '',
    isActive: true
  });

  // Load items for current section
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      // Enhanced comprehensive placeholder content system
      const getPlaceholderContent = (section: AdminSection): AdminItem[] => {
        const now = new Date().toISOString();
        
        switch (section) {
          case 'locations':
            return [
              {
                id: '1',
                name: 'Taj Mahal Sunrise',
                promptValue: 'romantic sunrise at Taj Mahal with golden lighting and misty atmosphere',
                description: 'Iconic monument with romantic morning light - perfect for dreamy couple portraits',
                imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400',
                category: 'monuments',
                isActive: true,
                createdAt: now,
                updatedAt: now
              },
              {
                id: '2',
                name: 'Beach Sunset Paradise',
                promptValue: 'romantic beach sunset with waves and golden hour lighting, tropical paradise',
                description: 'Peaceful ocean view with warm sunset colors - ideal for romantic silhouettes',
                imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
                category: 'nature',
                isActive: true,
                createdAt: now,
                updatedAt: now
              },
              {
                id: '3',
                name: 'Royal Palace Gardens',
                promptValue: 'lush royal palace gardens with fountain and flowering trees, majestic architecture',
                description: 'Elegant palace gardens with intricate details and royal ambiance',
                imageUrl: 'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=400',
                category: 'heritage',
                isActive: true,
                createdAt: now,
                updatedAt: now
              },
              {
                id: '4',
                name: 'Himalayan Mountain Vista',
                promptValue: 'breathtaking himalayan mountain vista with snow peaks and valley views',
                description: 'Majestic mountain backdrop for adventurous couples',
                imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
                category: 'nature',
                isActive: true,
                createdAt: now,
                updatedAt: now
              }
            ];
          
          case 'attire':
            return [
              {
                id: '1',
                name: 'Classic Red Lehenga',
                promptValue: 'traditional red silk lehenga with gold embroidery and intricate beadwork',
                description: 'Timeless bridal lehenga in rich red with golden accents',
                imageUrl: 'https://images.unsplash.com/photo-1583391733981-0236c6a4c41d?w=400',
                category: 'bride-traditional',
                isActive: true,
                createdAt: now,
                updatedAt: now
              },
              {
                id: '2',
                name: 'Royal Blue Sherwani',
                promptValue: 'elegant royal blue silk sherwani with gold buttons and churidar',
                description: 'Sophisticated groom sherwani in royal blue with traditional cuts',
                imageUrl: 'https://images.unsplash.com/photo-1594736797933-d0d2a6a7dbc9?w=400',
                category: 'groom-traditional',
                isActive: true,
                createdAt: now,
                updatedAt: now
              },
              {
                id: '3',
                name: 'Pastel Pink Anarkali',
                promptValue: 'flowing pastel pink anarkali with silver embellishments and dupatta',
                description: 'Graceful anarkali suit perfect for engagement ceremonies',
                imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400',
                category: 'bride-modern',
                isActive: true,
                createdAt: now,
                updatedAt: now
              }
            ];
          
          case 'jewelry':
            return [
              {
                id: '1',
                name: 'Kundan Bridal Set',
                promptValue: 'elaborate kundan necklace set with matching earrings and maang tikka',
                description: 'Traditional Kundan jewelry with precious stones and gold work',
                imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400',
                category: 'bridal-sets',
                isActive: true,
                createdAt: now,
                updatedAt: now
              },
              {
                id: '2',
                name: 'Pearl Choker Elegance',
                promptValue: 'elegant pearl choker with diamond accents and matching earrings',
                description: 'Sophisticated pearl jewelry for modern brides',
                imageUrl: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400',
                category: 'modern-sets',
                isActive: true,
                createdAt: now,
                updatedAt: now
              }
            ];
          
          case 'poses':
            return [
              {
                id: '1',
                name: 'Romantic Embrace',
                promptValue: 'couple in romantic embrace with bride looking over shoulder, groom behind',
                description: 'Intimate pose showcasing connection and elegance',
                imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
                category: 'romantic',
                isActive: true,
                createdAt: now,
                updatedAt: now
              },
              {
                id: '2',
                name: 'Playful Laughter',
                promptValue: 'couple laughing together, candid joy with natural expressions',
                description: 'Candid moments capturing pure happiness and chemistry',
                imageUrl: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400',
                category: 'candid',
                isActive: true,
                createdAt: now,
                updatedAt: now
              }
            ];
          
          case 'styles':
            return [
              {
                id: '1',
                name: 'Vintage Romance',
                promptValue: 'vintage romantic style with soft sepia tones and classic film aesthetic',
                description: 'Timeless vintage photography style with warm, dreamy tones',
                imageUrl: 'https://images.unsplash.com/photo-1584361853901-dd1904195037?w=400',
                category: 'artistic',
                isActive: true,
                createdAt: now,
                updatedAt: now
              },
              {
                id: '2',
                name: 'Modern Minimalist',
                promptValue: 'clean modern minimalist style with crisp lines and contemporary aesthetic',
                description: 'Contemporary style focusing on clean compositions and modern appeal',
                imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400',
                category: 'contemporary',
                isActive: true,
                createdAt: now,
                updatedAt: now
              }
            ];
          
          case 'hairstyles':
            return [
              {
                id: '1',
                name: 'Classic Bridal Bun',
                promptValue: 'elegant low bun with flowers and traditional hair accessories',
                description: 'Timeless bridal hairstyle with floral accents',
                imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
                category: 'bridal',
                isActive: true,
                createdAt: now,
                updatedAt: now
              },
              {
                id: '2',
                name: 'Romantic Waves',
                promptValue: 'soft romantic waves with side part and subtle hair jewelry',
                description: 'Flowing hairstyle perfect for modern pre-wedding shoots',
                imageUrl: 'https://images.unsplash.com/photo-1594824883615-ad78e4a2c3e3?w=400',
                category: 'modern',
                isActive: true,
                createdAt: now,
                updatedAt: now
              }
            ];
          
          case 'user-management':
            return [
              {
                id: '1',
                name: 'Admin Users',
                promptValue: 'admin-user-management',
                description: 'Manage admin user roles and permissions',
                imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
                category: 'users',
                isActive: true,
                createdAt: now,
                updatedAt: now
              },
              {
                id: '2',
                name: 'Permission Settings',
                promptValue: 'permission-settings',
                description: 'Configure access levels and feature permissions',
                imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
                category: 'permissions',
                isActive: true,
                createdAt: now,
                updatedAt: now
              }
            ];
          
          case 'system-settings':
            return [
              {
                id: '1',
                name: 'AI Model Configuration',
                promptValue: 'ai-model-settings',
                description: 'Configure AI generation parameters and quality settings',
                imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
                category: 'ai-config',
                isActive: true,
                createdAt: now,
                updatedAt: now
              },
              {
                id: '2',
                name: 'Application Settings',
                promptValue: 'app-settings',
                description: 'System-wide application configuration and features',
                imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
                category: 'app-config',
                isActive: true,
                createdAt: now,
                updatedAt: now
              }
            ];
          
          case 'analytics':
            return [
              {
                id: '1',
                name: 'User Analytics',
                promptValue: 'user-analytics',
                description: 'Track user engagement, feature usage, and growth metrics',
                imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
                category: 'user-metrics',
                isActive: true,
                createdAt: now,
                updatedAt: now
              },
              {
                id: '2',
                name: 'Generation Reports',
                promptValue: 'generation-reports',
                description: 'AI generation statistics and performance analytics',
                imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
                category: 'ai-metrics',
                isActive: true,
                createdAt: now,
                updatedAt: now
              }
            ];
          
          case 'ai-integration':
          case 'video-demo':
          case 'visual-effects':
          case 'country-models':
          case 'style-application':
            return []; // Special cases - render custom components
          
          default:
            return [];
        }
      };
      
      const mockItems: AdminItem[] = getPlaceholderContent(activeSection);
      setItems(mockItems);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  }, [activeSection]);

  useEffect(() => {
    loadItems();
  }, [activeSection, loadItems]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newItem: AdminItem = {
        id: editingItem?.id || Date.now().toString(),
        ...formData,
        createdAt: editingItem?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingItem) {
        // Update existing item
        setItems(prev => prev.map(item => item.id === editingItem.id ? newItem : item));
      } else {
        // Add new item
        setItems(prev => [...prev, newItem]);
      }

      // Reset form
      setFormData({
        name: '',
        promptValue: '',
        description: '',
        imageUrl: '',
        category: '',
        isActive: true
      });
      setEditingItem(null);
      setShowAddModal(false);

      alert(editingItem ? 'Item updated successfully!' : 'Item added successfully!');
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item. Please try again.');
    }
  }, [formData, editingItem]);

  const handleEdit = useCallback((item: AdminItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      promptValue: item.promptValue,
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      category: item.category || '',
      isActive: item.isActive
    });
    setShowAddModal(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  }, []);

  const toggleItemStatus = useCallback((id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, isActive: !item.isActive } : item
    ));
  }, []);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter sections based on user role
  const availableSections = ADMIN_SECTIONS.filter(section => {
    if (section.requiredRole === 'superadmin') {
      return isSuperAdmin;
    }
    return true; // Admin and superadmin can access admin-level sections
  });

  const currentSection = availableSections.find(section => section.id === activeSection);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40">
      {/* Modern Header with Role-Based Styling */}
      <div className={`${
        isSuperAdmin 
          ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600' 
          : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600'
        } text-white shadow-2xl`}>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4 backdrop-blur-sm">
                <span className="text-2xl">{isSuperAdmin ? '👑' : '⚙️'}</span>
              </div>
              <div>
                <div className="flex items-center mb-1">
                  <h1 className="text-3xl font-bold mr-3">
                    {isSuperAdmin ? 'Super Admin Dashboard' : 'Admin Dashboard'}
                  </h1>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isSuperAdmin 
                      ? 'bg-yellow-400 text-yellow-900' 
                      : 'bg-blue-400 text-blue-900'
                  }`}>
                    {userInfo.roleLabel}
                  </div>
                </div>
                <p className="text-white/80">
                  {isSuperAdmin 
                    ? 'Full system access: Content, users, settings & analytics' 
                    : 'Manage styles, locations, and creative options'}
                </p>
                <div className="flex items-center mt-2 text-white/60 text-sm">
                  <span className="mr-4">👋 Welcome, {userInfo.name}</span>
                  <span>📧 {userInfo.email}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl p-3 border border-white/20 text-white hover:text-white transition-all duration-300 flex items-center"
                  title="Back to Creative Studio"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              )}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
                <span className="text-white/90 text-sm font-medium">
                  {isSuperAdmin ? '🌟 Master Control Panel' : '🎨 Content Management System'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 sticky top-8">
              <h3 className="text-lg font-bold text-slate-800 mb-6">
                {isSuperAdmin ? 'Master Controls' : 'Content Sections'}
              </h3>
              <div className="space-y-2">
                {/* Content Management Sections */}
                {availableSections.filter(s => s.requiredRole === 'admin').map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-300 ${
                      activeSection === section.id
                        ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      {section.icon}
                      <span className="ml-3 font-semibold">{section.name}</span>
                    </div>
                    <p className={`text-xs ${
                      activeSection === section.id ? 'text-white/80' : 'text-slate-500'
                    }`}>
                      {section.description}
                    </p>
                  </button>
                ))}
                
                {/* SuperAdmin Only Sections */}
                {isSuperAdmin && availableSections.some(s => s.requiredRole === 'superadmin') && (
                  <>
                    <div className="flex items-center my-6">
                      <div className="flex-1 border-t border-slate-300"></div>
                      <div className="px-4 text-xs font-bold text-slate-500 bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                        👑 SUPER ADMIN
                      </div>
                      <div className="flex-1 border-t border-slate-300"></div>
                    </div>
                    {availableSections.filter(s => s.requiredRole === 'superadmin').map(section => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full text-left p-4 rounded-2xl transition-all duration-300 border-2 ${
                          activeSection === section.id
                            ? `bg-gradient-to-r ${section.color} text-white shadow-lg border-yellow-400/50`
                            : 'bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 text-slate-700 border-yellow-200/50'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          {section.icon}
                          <span className="ml-3 font-semibold">{section.name}</span>
                          {activeSection !== section.id && (
                            <span className="ml-auto text-yellow-600 text-xs">👑</span>
                          )}
                        </div>
                        <p className={`text-xs ${
                          activeSection === section.id ? 'text-white/80' : 'text-slate-600'
                        }`}>
                          {section.description}
                        </p>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Special Sections with Custom Components */}
            {activeSection === 'ai-integration' ? (
              <AIIntegrationDocumentation />
            ) : activeSection === 'video-demo' ? (
              <VideoDemoScript />
            ) : activeSection === 'visual-effects' ? (
              <VisualEffectsLibrary />
            ) : activeSection === 'country-models' ? (
              <CountryModelsManager />
            ) : activeSection === 'style-application' ? (
              <StyleApplicationPanel isAdmin={true} />
            ) : (
              <>
            {/* Section Header */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-12 h-12 bg-gradient-to-r ${currentSection?.color} rounded-2xl flex items-center justify-center mr-4`}>
                    {currentSection?.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{currentSection?.name}</h2>
                    <p className="text-slate-600">{currentSection?.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setFormData({
                      name: '',
                      promptValue: '',
                      description: '',
                      imageUrl: '',
                      category: '',
                      isActive: true
                    });
                    setShowAddModal(true);
                  }}
                  className={`bg-gradient-to-r ${currentSection?.color} text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center`}
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Add New Item
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search ${currentSection?.name.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                  🔍
                </div>
              </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-2 text-center py-12">
                  <div className="inline-block w-8 h-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
                  <p className="mt-4 text-slate-600">Loading items...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="col-span-2 text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">No items found</h3>
                  <p className="text-slate-600 mb-6">
                    {searchTerm ? 'No items match your search.' : 'Start by adding your first item.'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className={`bg-gradient-to-r ${currentSection?.color} text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300`}
                    >
                      Add First Item
                    </button>
                  )}
                </div>
              ) : (
                filteredItems.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300"
                  >
                    {/* Item Image */}
                    {item.imageUrl && (
                      <div className="w-full h-32 bg-slate-100 rounded-2xl mb-4 overflow-hidden">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Item Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-slate-800 mb-1">{item.name}</h4>
                        {item.category && (
                          <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleItemStatus(item.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            item.isActive 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {item.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p className="text-slate-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                    )}

                    {/* Prompt Value */}
                    <div className="bg-slate-50 rounded-xl p-3 mb-4">
                      <h5 className="text-xs font-semibold text-slate-500 mb-1">AI PROMPT</h5>
                      <p className="text-sm text-slate-700 font-mono line-clamp-3">{item.promptValue}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        Updated {new Date(item.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-xl transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
      </>
        )}
          </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAddModal(false);
                setEditingItem(null);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className={`bg-gradient-to-r ${currentSection?.color} text-white p-6`}>
                <h3 className="text-2xl font-bold">
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h3>
                <p className="text-white/80">
                  {editingItem ? 'Update the details below' : `Add a new ${currentSection?.name.toLowerCase()} option`}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter item name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Optional category"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    AI Prompt Value *
                  </label>
                  <textarea
                    required
                    value={formData.promptValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, promptValue: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter the AI prompt that will be used for generation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={2}
                    placeholder="Optional description for users"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Optional preview image URL"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm font-medium text-slate-700">
                    Active (visible to users)
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingItem(null);
                    }}
                    className="px-6 py-3 text-slate-600 hover:text-slate-800 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`bg-gradient-to-r ${currentSection?.color} text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300`}
                  >
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;