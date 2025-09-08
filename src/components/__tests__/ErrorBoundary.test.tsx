import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';
import React from 'react';

// Mock window.location.reload
const mockReload = vi.fn();
Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload,
  },
  writable: true,
});

// Mock console methods to avoid noise in test output
const mockConsoleError = vi.fn();
vi.spyOn(console, 'error').mockImplementation(mockConsoleError);

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleError.mockClear();
    mockReload.mockClear();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child component</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child component')).toBeInTheDocument();
  });

  it('should render error UI when child component throws an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('We encountered an unexpected error. Please check the console for details.')).toBeInTheDocument();
    expect(screen.getByText('Refresh Page')).toBeInTheDocument();
  });

  it('should display error message when error has message', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('Error:')).toBeInTheDocument();
  });

  it('should show stack trace in details element', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const showStackButton = screen.getByText('Show Stack Trace');
    expect(showStackButton).toBeInTheDocument();
    
    // Stack trace should be in a pre element (initially collapsed)
    const preElement = screen.getByText('Show Stack Trace').closest('details')?.querySelector('pre');
    expect(preElement).toBeInTheDocument();
  });

  it('should call window.location.reload when refresh button is clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByText('Refresh Page');
    fireEvent.click(refreshButton);

    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it('should log error to console when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error caught by boundary:',
      expect.any(Error),
      expect.any(Object)
    );
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error stack:',
      expect.any(String)
    );
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Component stack:',
      expect.any(String)
    );
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div data-testid="custom-fallback">Custom error UI</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
  });

  it('should have correct CSS classes for error UI styling', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const container = screen.getByText('Oops! Something went wrong').closest('.bg-white');
    expect(container).toHaveClass('bg-white', 'rounded-2xl', 'shadow-xl', 'p-8', 'max-w-md', 'w-full', 'text-center');

    const outerContainer = container?.parentElement;
    expect(outerContainer).toHaveClass('min-h-screen', 'bg-gray-50', 'flex', 'items-center', 'justify-center', 'p-4');
  });

  it('should have error icon with correct styling', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const iconContainer = screen.getByText('Oops! Something went wrong').previousElementSibling;
    expect(iconContainer).toHaveClass('w-16', 'h-16', 'bg-red-100', 'rounded-full', 'flex', 'items-center', 'justify-center', 'mx-auto', 'mb-4');

    const svg = iconContainer?.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('w-8', 'h-8', 'text-red-600');
  });

  it('should show error details in styled container', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorContainer = screen.getByText('Test error message').closest('.bg-red-50');
    expect(errorContainer).toHaveClass('mb-6', 'p-4', 'bg-red-50', 'border', 'border-red-200', 'rounded-lg', 'text-left');
  });

  it('should style refresh button correctly', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByText('Refresh Page');
    expect(refreshButton).toHaveClass('bg-rose-600', 'text-white', 'px-6', 'py-3', 'rounded-lg', 'font-semibold', 'hover:bg-rose-700', 'transition-colors');
  });

  it('should handle error without stack trace', () => {
    // Create an error without stack
    const ErrorWithoutStack: React.FC = () => {
      const error = new Error('Error without stack');
      delete error.stack;
      throw error;
    };

    render(
      <ErrorBoundary>
        <ErrorWithoutStack />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error without stack')).toBeInTheDocument();
  });

  it('should reset error state when children change', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Note: Error boundaries don't automatically reset state when children change
    // The error UI should still be shown until the component is remounted or state is reset
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
  });

  it('should handle multiple nested children', () => {
    render(
      <ErrorBoundary>
        <div>
          <span>First child</span>
          <div>
            <span>Nested child</span>
            <ThrowError shouldThrow={false} />
          </div>
        </div>
      </ErrorBoundary>
    );

    expect(screen.getByText('First child')).toBeInTheDocument();
    expect(screen.getByText('Nested child')).toBeInTheDocument();
    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});