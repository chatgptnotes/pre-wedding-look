import { useState, useCallback, DragEvent } from 'react';

export interface DragDropState {
  isDragActive: boolean;
  isDragReject: boolean;
}

export interface DragDropHandlers {
  onDragEnter: (e: DragEvent<HTMLElement>) => void;
  onDragLeave: (e: DragEvent<HTMLElement>) => void;
  onDragOver: (e: DragEvent<HTMLElement>) => void;
  onDrop: (e: DragEvent<HTMLElement>) => void;
}

export interface UseDragDropOptions {
  onFilesDrop: (files: FileList) => void;
  accept?: string[];
  maxSize?: number; // in bytes
  multiple?: boolean;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ACCEPT_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const useDragDrop = (options: UseDragDropOptions): DragDropState & DragDropHandlers => {
  const {
    onFilesDrop,
    accept = DEFAULT_ACCEPT_TYPES,
    maxSize = DEFAULT_MAX_SIZE,
    multiple = false
  } = options;

  const [dragState, setDragState] = useState<DragDropState>({
    isDragActive: false,
    isDragReject: false
  });

  const validateFiles = useCallback((files: FileList): { valid: File[], invalid: File[], errors: string[] } => {
    const validFiles: File[] = [];
    const invalidFiles: File[] = [];
    const errors: string[] = [];

    // Check if multiple files are allowed
    if (!multiple && files.length > 1) {
      errors.push('Only one file is allowed');
      return { valid: validFiles, invalid: Array.from(files), errors };
    }

    Array.from(files).forEach(file => {
      // Check file type
      if (!accept.includes(file.type)) {
        invalidFiles.push(file);
        errors.push(`File type ${file.type} is not supported. Supported types: ${accept.join(', ')}`);
        return;
      }

      // Check file size
      if (file.size > maxSize) {
        invalidFiles.push(file);
        errors.push(`File ${file.name} is too large. Maximum size: ${(maxSize / (1024 * 1024)).toFixed(1)}MB`);
        return;
      }

      validFiles.push(file);
    });

    return { valid: validFiles, invalid: invalidFiles, errors };
  }, [accept, maxSize, multiple]);

  const onDragEnter = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer?.items) {
      const files = Array.from(e.dataTransfer.items)
        .filter(item => item.kind === 'file')
        .map(item => item.getAsFile())
        .filter((file): file is File => file !== null);

      const { valid, invalid } = validateFiles({ length: files.length } as FileList);
      
      setDragState({
        isDragActive: true,
        isDragReject: invalid.length > 0 || valid.length === 0
      });
    }
  }, [validateFiles]);

  const onDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Only reset state if we're leaving the main container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragState({
        isDragActive: false,
        isDragReject: false
      });
    }
  }, []);

  const onDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set dropEffect for visual feedback
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = dragState.isDragReject ? 'none' : 'copy';
    }
  }, [dragState.isDragReject]);

  const onDrop = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setDragState({
      isDragActive: false,
      isDragReject: false
    });

    if (e.dataTransfer?.files) {
      const { valid, errors } = validateFiles(e.dataTransfer.files);
      
      if (errors.length > 0) {
        // Show validation errors to user
        alert(`File validation failed:\\n${errors.join('\\n')}`);
        return;
      }

      if (valid.length > 0) {
        // Create a new FileList-like object with valid files
        const validFileList = {
          ...valid,
          length: valid.length,
          item: (index: number) => valid[index] || null,
          [Symbol.iterator]: () => valid[Symbol.iterator]()
        } as FileList;
        
        onFilesDrop(validFileList);
      }
    }
  }, [validateFiles, onFilesDrop]);

  return {
    ...dragState,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop
  };
};

export default useDragDrop;