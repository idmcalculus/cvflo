import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import type { Editor as TinyMCEEditor } from 'tinymce';

interface RichTextEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  theme?: 'snow' | 'bubble';
  modules?: Record<string, unknown>;
  formats?: string[];
  className?: string;
}

export interface RichTextEditorRef {
  getEditor: () => TinyMCEEditor | null;
  focus: () => void;
  blur: () => void;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  value = '',
  onChange,
  placeholder = '',
  readOnly = false,
  className = ''
}, ref) => {
  const editorRef = useRef<TinyMCEEditor | null>(null);

  useImperativeHandle(ref, () => ({
    getEditor: () => editorRef.current,
    focus: () => editorRef.current?.focus(),
    blur: () => editorRef.current?.getBody().blur()
  }));

  const handleEditorChange = (content: string) => {
    onChange?.(content);
  };

  const handleInit = (evt: unknown, editor: TinyMCEEditor) => {
    editorRef.current = editor;
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      <Editor
        apiKey="v0itms336a4snutijx52kpveh4lwhs1o8sso9e741dwb9s3r"
        value={value}
        onEditorChange={handleEditorChange}
        onInit={handleInit}
        disabled={readOnly}
        init={{
          height: 200,
          menubar: false,
          plugins: [
            'lists', 'link', 'charmap', 'anchor',
            'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor bullist numlist | alignleft aligncenter ' +
            'alignright alignjustify | outdent indent | removeformat help',
          content_style: `
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
              font-size: 14px; 
              line-height: 1.5; 
              color: #374151;
              margin: 8px;
            }
            ul { list-style-type: disc; padding-left: 20px; margin: 0.5rem 0; }
            ol { list-style-type: decimal; padding-left: 20px; margin: 0.5rem 0; }
            li { margin: 0.25rem 0; line-height: 1.5; }
            ul ul { list-style-type: circle; margin: 0.25rem 0; }
            ul ul ul { list-style-type: square; margin: 0.25rem 0; }
            ol ol { list-style-type: lower-alpha; margin: 0.25rem 0; }
            ol ol ol { list-style-type: lower-roman; margin: 0.25rem 0; }
          `,
          placeholder: placeholder,
          branding: false,
          resize: false,
          statusbar: false,
          browser_spellcheck: true,
          contextmenu: false,
          paste_as_text: true,
          valid_elements: 'p,br,strong,b,em,i,ul,ol,li,h1,h2,h3,h4,h5,h6',
          forced_root_block: 'p',
          force_br_newlines: false,
          remove_trailing_brs: true,
          convert_urls: false,
          relative_urls: false,
          setup: (editor: TinyMCEEditor) => {
            editor.on('init', () => {
              if (placeholder && !value) {
                editor.setContent(`<p style="color: #9ca3af; font-style: italic;">${placeholder}</p>`);
              }
            });
            
            editor.on('focus', () => {
              if (!value && placeholder) {
                const content = editor.getContent();
                if (content.includes(placeholder)) {
                  editor.setContent('');
                }
              }
            });

            editor.on('blur', () => {
              const content = editor.getContent({ format: 'text' }).trim();
              if (!content && placeholder) {
                editor.setContent(`<p style="color: #9ca3af; font-style: italic;">${placeholder}</p>`);
              }
            });
          }
        }}
      />
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;