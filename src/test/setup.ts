import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables for tests
Object.assign(process.env, {
  VITE_GEMINI_API_KEY: 'test-gemini-api-key',
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-supabase-anon-key',
});

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock intersection observer
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
global.IntersectionObserver = mockIntersectionObserver;

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock File and FileReader
global.FileReader = class MockFileReader {
  result: string | ArrayBuffer | null = null;
  readAsDataURL = vi.fn((file: File) => {
    this.result = `data:image/jpeg;base64,mock-base64-data`;
    this.onload && this.onload({} as ProgressEvent<FileReader>);
  });
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
} as any;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});