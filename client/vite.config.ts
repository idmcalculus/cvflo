import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'query-vendor': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          'ui-vendor': ['lucide-react', 'react-hot-toast'],
          'editor-vendor': ['@tinymce/tinymce-react', 'tinymce'],
          'supabase-vendor': ['@supabase/supabase-js', '@supabase/auth-ui-react', '@supabase/auth-ui-shared'],
          'utils-vendor': ['zustand', 'react-hook-form', 'pdf-lib'],
          
          // App chunks
          'auth-components': [
            './src/components/Auth/AuthPage.tsx',
            './src/components/Auth/LoginForm.tsx',
            './src/components/Auth/SignUpForm.tsx',
            './src/components/Auth/AuthCallback.tsx',
            './src/components/Auth/UpdatePasswordForm.tsx',
            './src/contexts/AuthContext.tsx',
          ],
          'form-components': [
            './src/components/Form/PersonalInfoForm.tsx',
            './src/components/Form/WorkExperienceForm.tsx',
            './src/components/Form/EducationForm.tsx',
            './src/components/Form/ProjectsForm.tsx',
            './src/components/Form/SkillsForm.tsx',
            './src/components/Form/InterestsForm.tsx',
            './src/components/Form/ReferencesForm.tsx',
            './src/components/Form/SummaryForm.tsx',
          ],
          'preview-components': [
            './src/components/Preview/TemplatePreview.tsx',
            './src/components/PDF/DownloadPdfButton.tsx',
          ],
        },
      },
    },
    // Increase chunk size warning limit to 600kB
    chunkSizeWarningLimit: 600,
  },
});
