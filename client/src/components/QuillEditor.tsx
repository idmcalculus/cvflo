import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface QuillEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  theme?: 'snow' | 'bubble';
  modules?: Record<string, unknown>;
  formats?: string[];
  className?: string;
}

export interface QuillEditorRef {
  getEditor: () => Quill | null;
  focus: () => void;
  blur: () => void;
}

// Default modules configuration - shared across all instances
const DEFAULT_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'header': [1, 2, false] }],
    ['clean']
  ]
};

// Default formats to ensure list formatting is supported
const DEFAULT_FORMATS = [
  'bold', 'italic', 'underline', 'header', 'list'
];

const QuillEditor = forwardRef<QuillEditorRef, QuillEditorProps>(({
  value = '',
  onChange,
  placeholder = '',
  readOnly = false,
  theme = 'snow',
  modules,
  formats,
  className = ''
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const isUpdatingRef = useRef(false);

  // Memoize onChange to prevent unnecessary re-renders
  const handleChange = useCallback((content: string) => {
    onChange?.(content);
  }, [onChange]);

  // Memoize modules to prevent unnecessary re-initialization
  const memoizedModules = useMemo(() => {
    return modules || DEFAULT_MODULES;
  }, [modules]);

  // Memoize formats to prevent unnecessary re-initialization
  const memoizedFormats = useMemo(() => {
    return formats || DEFAULT_FORMATS;
  }, [formats]);

  useImperativeHandle(ref, () => ({
    getEditor: () => quillRef.current,
    focus: () => quillRef.current?.focus(),
    blur: () => quillRef.current?.blur()
  }));

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;

    // Capture container reference for cleanup
    const container = containerRef.current;

    // Clear any existing content in the container
    container.innerHTML = '';

    // Initialize Quill
    const quill = new Quill(container, {
      theme,
      modules: memoizedModules,
      formats: memoizedFormats,
      placeholder,
      readOnly
    });

    quillRef.current = quill;

    // Set initial content
    if (value) {
      isUpdatingRef.current = true;
      quill.root.innerHTML = value;
      isUpdatingRef.current = false;
    }

    // Handle text changes will be set up in a separate useEffect

    // Cleanup
    return () => {
      if (quillRef.current) {
        // Remove all event listeners
        quillRef.current.off('text-change');
        // Clear the container HTML to remove all Quill-generated elements
        container.innerHTML = '';
        quillRef.current = null;
      }
    };
  }, [theme, placeholder, readOnly, memoizedModules, memoizedFormats]);

  // Set up text change handler separately
  useEffect(() => {
    if (!quillRef.current) return;

    const handleTextChange = () => {
      if (isUpdatingRef.current) return;
      
      const content = quillRef.current?.root.innerHTML || '';
      handleChange(content);
    };

    quillRef.current.on('text-change', handleTextChange);

    return () => {
      if (quillRef.current) {
        quillRef.current.off('text-change', handleTextChange);
      }
    };
  }, [handleChange]);

  // Update content when value prop changes
  useEffect(() => {
    if (!quillRef.current || isUpdatingRef.current) return;

    const currentContent = quillRef.current.root.innerHTML;
    if (currentContent !== value) {
      isUpdatingRef.current = true;
      quillRef.current.root.innerHTML = value || '';
      isUpdatingRef.current = false;
    }
  }, [value, quillRef, isUpdatingRef]);

  // Update readOnly state
  useEffect(() => {
    if (!quillRef.current) return;
    quillRef.current.enable(!readOnly);
  }, [readOnly]);

  return (
    <div className={`quill-wrapper ${className}`}>
      <div ref={containerRef} />
    </div>
  );
});

QuillEditor.displayName = 'QuillEditor';

export default QuillEditor;
