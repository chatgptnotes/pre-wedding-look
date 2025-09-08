import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OptionSelector from '../OptionSelector';
import { SelectionOption } from '../../types';

// Mock ImageWithFallback component
vi.mock('../ImageWithFallback', () => ({
  default: ({ src, alt, className, fallbackText }: { src: string; alt: string; className: string; fallbackText: string }) => (
    <div className={className} data-testid={`image-${alt}`} data-src={src}>
      {fallbackText}
    </div>
  )
}));

describe('OptionSelector', () => {
  const mockOptions: SelectionOption[] = [
    {
      id: 'option1',
      label: 'Red Lehenga',
      imageUrl: '/images/red-lehenga.jpg',
      promptValue: 'a stunning red lehenga'
    },
    {
      id: 'option2',
      label: 'Blue Saree',
      imageUrl: '/images/blue-saree.jpg',
      promptValue: 'an elegant blue saree'
    },
    {
      id: 'option3',
      label: 'Green Dress',
      imageUrl: '/images/green-dress.jpg',
      promptValue: 'a beautiful green dress'
    }
  ];

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with correct label', () => {
    render(
      <OptionSelector
        label="Bride's Attire"
        options={mockOptions}
        selectedValue=""
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText("Bride's Attire")).toBeInTheDocument();
  });

  it('should render all options', () => {
    render(
      <OptionSelector
        label="Test Options"
        options={mockOptions}
        selectedValue=""
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Red Lehenga')).toBeInTheDocument();
    expect(screen.getByText('Blue Saree')).toBeInTheDocument();
    expect(screen.getByText('Green Dress')).toBeInTheDocument();
  });

  it('should render images for each option', () => {
    render(
      <OptionSelector
        label="Test Options"
        options={mockOptions}
        selectedValue=""
        onChange={mockOnChange}
      />
    );

    expect(screen.getByTestId('image-Red Lehenga')).toBeInTheDocument();
    expect(screen.getByTestId('image-Blue Saree')).toBeInTheDocument();
    expect(screen.getByTestId('image-Green Dress')).toBeInTheDocument();
  });

  it('should pass correct props to ImageWithFallback', () => {
    render(
      <OptionSelector
        label="Test Options"
        options={mockOptions}
        selectedValue=""
        onChange={mockOnChange}
      />
    );

    const redLehengaImage = screen.getByTestId('image-Red Lehenga');
    expect(redLehengaImage).toHaveAttribute('data-src', '/images/red-lehenga.jpg');
    expect(redLehengaImage).toHaveClass('w-full', 'h-24', 'object-cover', 'bg-stone-100');
    expect(redLehengaImage).toHaveTextContent('Red Lehenga');
  });

  it('should call onChange with correct promptValue when option is clicked', () => {
    render(
      <OptionSelector
        label="Test Options"
        options={mockOptions}
        selectedValue=""
        onChange={mockOnChange}
      />
    );

    const redLehengaOption = screen.getByText('Red Lehenga').closest('div');
    fireEvent.click(redLehengaOption!);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('a stunning red lehenga');
  });

  it('should highlight selected option with correct styling', () => {
    render(
      <OptionSelector
        label="Test Options"
        options={mockOptions}
        selectedValue="a stunning red lehenga"
        onChange={mockOnChange}
      />
    );

    const selectedOption = screen.getByText('Red Lehenga').closest('div');
    const unselectedOption = screen.getByText('Blue Saree').closest('div');

    // Selected option should have rose border
    expect(selectedOption).toHaveClass('border-rose-500', 'shadow-lg');
    expect(unselectedOption).toHaveClass('border-transparent');

    // Selected option label should have rose background
    const selectedLabel = screen.getByText('Red Lehenga');
    const unselectedLabel = screen.getByText('Blue Saree');
    
    expect(selectedLabel).toHaveClass('bg-rose-500', 'text-white');
    expect(unselectedLabel).toHaveClass('bg-white', 'text-stone-700');
  });

  it('should have hover effects on options', () => {
    render(
      <OptionSelector
        label="Test Options"
        options={mockOptions}
        selectedValue=""
        onChange={mockOnChange}
      />
    );

    const option = screen.getByText('Red Lehenga').closest('div');
    expect(option).toHaveClass('cursor-pointer', 'transform', 'hover:scale-105', 'hover:border-rose-300');
  });

  it('should use grid layout for options', () => {
    render(
      <OptionSelector
        label="Test Options"
        options={mockOptions}
        selectedValue=""
        onChange={mockOnChange}
      />
    );

    const gridContainer = screen.getByText('Red Lehenga').closest('div')?.parentElement;
    expect(gridContainer).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-4', 'gap-4');
  });

  it('should capitalize label text', () => {
    render(
      <OptionSelector
        label="bride's attire"
        options={mockOptions}
        selectedValue=""
        onChange={mockOnChange}
      />
    );

    const labelElement = screen.getByText("bride's attire");
    expect(labelElement).toHaveClass('capitalize');
  });

  it('should handle empty options array', () => {
    render(
      <OptionSelector
        label="Empty Options"
        options={[]}
        selectedValue=""
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Empty Options')).toBeInTheDocument();
    expect(screen.queryByText('Red Lehenga')).not.toBeInTheDocument();
  });

  it('should handle long option labels', () => {
    const longLabelOptions: SelectionOption[] = [
      {
        id: 'long1',
        label: 'This is a very long option label that might wrap',
        imageUrl: '/images/long-option.jpg',
        promptValue: 'a very descriptive prompt value'
      }
    ];

    render(
      <OptionSelector
        label="Long Labels"
        options={longLabelOptions}
        selectedValue=""
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('This is a very long option label that might wrap')).toBeInTheDocument();
  });

  it('should handle selection change correctly', () => {
    const { rerender } = render(
      <OptionSelector
        label="Test Options"
        options={mockOptions}
        selectedValue=""
        onChange={mockOnChange}
      />
    );

    // Initially no selection
    expect(screen.getByText('Red Lehenga')).toHaveClass('bg-white', 'text-stone-700');

    // Rerender with selection
    rerender(
      <OptionSelector
        label="Test Options"
        options={mockOptions}
        selectedValue="a stunning red lehenga"
        onChange={mockOnChange}
      />
    );

    // Now should be selected
    expect(screen.getByText('Red Lehenga')).toHaveClass('bg-rose-500', 'text-white');
  });

  it('should have correct container spacing', () => {
    render(
      <OptionSelector
        label="Test Options"
        options={mockOptions}
        selectedValue=""
        onChange={mockOnChange}
      />
    );

    const container = screen.getByText('Test Options').closest('div');
    expect(container).toHaveClass('mb-8');

    const title = screen.getByText('Test Options');
    expect(title).toHaveClass('text-xl', 'font-semibold', 'text-stone-700', 'mb-4');
  });

  it('should handle clicking on different parts of the option', () => {
    render(
      <OptionSelector
        label="Test Options"
        options={mockOptions}
        selectedValue=""
        onChange={mockOnChange}
      />
    );

    // Click on the image part
    const imageElement = screen.getByTestId('image-Red Lehenga');
    fireEvent.click(imageElement.closest('div')!);
    expect(mockOnChange).toHaveBeenCalledWith('a stunning red lehenga');

    mockOnChange.mockClear();

    // Click on the label part
    const labelElement = screen.getByText('Blue Saree');
    fireEvent.click(labelElement.closest('div')!.parentElement!);
    expect(mockOnChange).toHaveBeenCalledWith('an elegant blue saree');
  });
});