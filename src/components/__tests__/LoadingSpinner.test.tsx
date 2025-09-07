import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default message', () => {
    render(<LoadingSpinner />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render with custom message', () => {
    render(<LoadingSpinner message="Generating your magical photo..." />);
    
    expect(screen.getByText('Generating your magical photo...')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('should render with default medium size', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByText('Loading...').previousSibling?.firstChild as HTMLElement;
    expect(spinner).toHaveClass('w-10', 'h-10', 'animate-spin');
  });

  it('should render with small size', () => {
    render(<LoadingSpinner size="sm" />);
    
    const spinner = screen.getByText('Loading...').previousSibling?.firstChild as HTMLElement;
    expect(spinner).toHaveClass('w-6', 'h-6', 'animate-spin');
    
    const text = screen.getByText('Loading...');
    expect(text).toHaveClass('text-sm');
  });

  it('should render with large size', () => {
    render(<LoadingSpinner size="lg" />);
    
    const spinner = screen.getByText('Loading...').previousSibling?.firstChild as HTMLElement;
    expect(spinner).toHaveClass('w-16', 'h-16', 'animate-spin');
    
    const text = screen.getByText('Loading...');
    expect(text).toHaveClass('text-lg');
  });

  it('should have correct container styling', () => {
    const { container } = render(<LoadingSpinner />);
    
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass(
      'min-h-screen',
      'bg-gradient-to-br',
      'from-rose-50',
      'via-pink-50',
      'to-orange-50',
      'flex',
      'items-center',
      'justify-center'
    );
  });

  it('should have spinning animation classes', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByText('Loading...').previousSibling?.firstChild as HTMLElement;
    expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'border-4', 'border-rose-200', 'border-t-rose-600');
  });

  it('should have centered text with correct styling', () => {
    render(<LoadingSpinner message="Test message" />);
    
    const text = screen.getByText('Test message');
    expect(text).toHaveClass('mt-4', 'text-gray-600', 'font-medium', 'text-base');
  });

  it('should handle empty message', () => {
    render(<LoadingSpinner message="" />);
    
    // Should render empty message
    const text = screen.getByText('');
    expect(text).toBeInTheDocument();
  });

  it('should have inner decorative element', () => {
    const { container } = render(<LoadingSpinner />);
    
    // Check for the inner decorative circle
    const innerElement = container.querySelector('.bg-rose-100.rounded-full');
    expect(innerElement).toBeInTheDocument();
  });

  it('should handle very long messages', () => {
    const longMessage = 'This is a very long loading message that might wrap to multiple lines and should still be displayed correctly without breaking the layout';
    render(<LoadingSpinner message={longMessage} />);
    
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('should maintain relative positioning for nested elements', () => {
    const { container } = render(<LoadingSpinner />);
    
    const relativeDiv = container.querySelector('.relative');
    expect(relativeDiv).toBeInTheDocument();
    expect(relativeDiv).toHaveClass('relative');
    
    const absoluteDiv = container.querySelector('.absolute');
    expect(absoluteDiv).toBeInTheDocument();
    expect(absoluteDiv).toHaveClass('absolute', 'inset-0', 'flex', 'items-center', 'justify-center');
  });
});