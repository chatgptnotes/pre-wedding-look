import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface Modal {
  type: 'favorites' | 'comparison' | 'profile' | 'consent' | 'report' | null;
  data?: any;
}

interface UIStore {
  // Modals
  activeModal: Modal;
  showFavorites: boolean;
  showComparison: boolean;
  showProfile: boolean;
  showConsent: boolean;
  showReport: boolean;
  
  // Toasts
  toasts: Toast[];
  
  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;
  
  // UI preferences
  theme: 'light' | 'dark' | 'auto';
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  
  // Actions
  openModal: (type: Modal['type'], data?: any) => void;
  closeModal: () => void;
  setShowFavorites: (show: boolean) => void;
  setShowComparison: (show: boolean) => void;
  setShowProfile: (show: boolean) => void;
  setShowConsent: (show: boolean) => void;
  setShowReport: (show: boolean) => void;
  
  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Loading actions
  setGlobalLoading: (loading: boolean, message?: string) => void;
  
  // UI preference actions
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  // Initial state
  activeModal: { type: null },
  showFavorites: false,
  showComparison: false,
  showProfile: false,
  showConsent: false,
  showReport: false,
  toasts: [],
  globalLoading: false,
  loadingMessage: null,
  theme: 'light',
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  
  // Modal actions
  openModal: (type, data) => {
    set({
      activeModal: { type, data },
      showFavorites: type === 'favorites',
      showComparison: type === 'comparison',
      showProfile: type === 'profile',
      showConsent: type === 'consent',
      showReport: type === 'report',
    });
  },
  
  closeModal: () => {
    set({
      activeModal: { type: null },
      showFavorites: false,
      showComparison: false,
      showProfile: false,
      showConsent: false,
      showReport: false,
    });
  },
  
  setShowFavorites: (show) => set({ showFavorites: show }),
  setShowComparison: (show) => set({ showComparison: show }),
  setShowProfile: (show) => set({ showProfile: show }),
  setShowConsent: (show) => set({ showConsent: show }),
  setShowReport: (show) => set({ showReport: show }),
  
  // Toast actions
  addToast: (toast) => {
    const id = Date.now().toString();
    const newToast = { ...toast, id };
    
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));
    
    // Auto-remove toast after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, toast.duration || 5000);
    }
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  
  clearToasts: () => set({ toasts: [] }),
  
  // Loading actions
  setGlobalLoading: (loading, message) => {
    set({
      globalLoading: loading,
      loadingMessage: message || null,
    });
  },
  
  // UI preference actions
  setTheme: (theme) => {
    set({ theme });
    // Apply theme to document
    if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
  
  toggleSidebar: () => {
    set((state) => ({
      sidebarCollapsed: !state.sidebarCollapsed,
    }));
  },
  
  toggleMobileMenu: () => {
    set((state) => ({
      mobileMenuOpen: !state.mobileMenuOpen,
    }));
  },
}));