import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedApi } from './useAuthenticatedApi';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { CVData, SectionVisibility } from '../types/cv.types';

// Query Keys
export const queryKeys = {
  userProfile: (userId?: string) => ['user', 'profile', userId] as const,
  cvData: (userId?: string) => ['cv', 'data', userId] as const,
  templates: ['templates'] as const,
  pdf: (data: unknown) => ['pdf', 'generate', data] as const,
} as const;

// User Profile Queries
export const useUserProfile = () => {
  const { apiRequest } = useAuthenticatedApi();
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.userProfile(user?.id),
    queryFn: async () => {
      const response = await apiRequest<{firstName: string, lastName: string, email: string}>(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/user/profile/`);
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Update User Profile Mutation
export const useUpdateUserProfile = () => {
  const { apiRequest } = useAuthenticatedApi();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profileData: {firstName: string, lastName: string, email: string}) => {
      const response = await apiRequest(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/user/profile/`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      return response;
    },
    onSuccess: (data) => {
      // Update the cached user profile data
      queryClient.setQueryData(queryKeys.userProfile(user?.id), data);
      toast.success('Profile updated successfully!');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
    },
  });
};

// CV Data Queries
export const useCVData = () => {
  const { apiRequest } = useAuthenticatedApi();
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.cvData(user?.id),
    queryFn: async () => {
      const response = await apiRequest<{
        cvData: CVData;
        visibility: SectionVisibility;
        selectedTemplate: string;
        lastUpdated?: string;
        message?: string;
      }>(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/cv/data/`);
      return response;
    },
    enabled: !!user, // Only run when user is authenticated
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2,
  });
};

// Save CV Data Mutation
export const useSaveCVData = () => {
  const { apiRequest } = useAuthenticatedApi();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ cvData, visibility, selectedTemplate }: {
      cvData: CVData;
      visibility: SectionVisibility;
      selectedTemplate: string;
    }) => {
      const response = await apiRequest(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/cv/data/`, {
        method: 'POST',
        body: JSON.stringify({ cvData, visibility, selectedTemplate }),
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch CV data
      queryClient.invalidateQueries({ queryKey: queryKeys.cvData(user?.id) });
      toast.success('CV saved successfully!');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save CV';
      toast.error(errorMessage);
    },
  });
};

// Update CV Data Mutation
export const useUpdateCVData = () => {
  const { apiRequest } = useAuthenticatedApi();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ cvData, visibility, selectedTemplate }: {
      cvData?: CVData;
      visibility?: SectionVisibility;
      selectedTemplate?: string;
    }) => {
      const url = `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/cv/data/`;
      console.log('Updating CV data with URL:', url);
      const response = await apiRequest(url, {
        method: 'PUT',
        body: JSON.stringify({ cvData, visibility, selectedTemplate }),
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch CV data
      queryClient.invalidateQueries({ queryKey: queryKeys.cvData(user?.id) });
      toast.success('CV updated successfully!');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update CV';
      toast.error(errorMessage);
    },
  });
};

// Helper function to format error messages for users
const formatPdfError = (errorText: string): string => {
  try {
    // Try to parse JSON error response
    const errorObj = JSON.parse(errorText);
    
    if (errorObj.message) {
      const message = errorObj.message;
      
      // Check for specific error patterns and provide user-friendly messages
      if (message.includes('Failed to launch the browser process')) {
        return 'PDF generation service is temporarily unavailable. Please try again in a few moments.';
      }
      
      if (message.includes('timeout')) {
        return 'PDF generation is taking longer than expected. Please try again with a simpler CV layout.';
      }
      
      if (message.includes('memory') || message.includes('Memory')) {
        return 'Your CV is too large to process. Please try reducing the content or using a simpler template.';
      }
      
      if (message.includes('navigation') || message.includes('Navigation')) {
        return 'There was an issue processing your CV content. Please check your data and try again.';
      }
      
      // If it's a technical error, provide a generic message
      if (message.includes('ERROR:') || message.includes('stack trace')) {
        return 'We encountered a technical issue while generating your PDF. Our team has been notified. Please try again later.';
      }
      
      // Return the original message if it's already user-friendly
      return message;
    }
  } catch {
    // If not JSON, check for common error patterns in plain text
    if (errorText.includes('browser process')) {
      return 'PDF generation service is temporarily unavailable. Please try again in a few moments.';
    }
    
    if (errorText.includes('timeout')) {
      return 'PDF generation timed out. Please try again.';
    }
  }
  
  // Fallback for unknown errors
  return 'Unable to generate PDF at this time. Please try again later.';
};

// PDF Generation Mutation with retry logic
export const useGeneratePDF = () => {
  const { authenticatedFetch } = useAuthenticatedApi();
  
  return useMutation({
    mutationFn: async ({ htmlContent, styles, cvData, templateName }: { 
      htmlContent: string; 
      styles: string; 
      cvData: CVData; 
      templateName: string; 
    }) => {
      // Retry logic for transient failures
      let lastError: Error | null = null;
      const maxRetries = 2;
      
      for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
          const response = await authenticatedFetch(`/api/generate-pdf-from-html`, {
            method: 'POST',
            body: JSON.stringify({
              htmlContent,
              styles,
              cvData,
              templateName,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            const error = new Error(errorText);
            
            // Check if error is retryable
            const isRetryable = errorText.includes('browser process') || 
                               errorText.includes('temporarily unavailable') ||
                               errorText.includes('service encountered an issue');
            
            if (attempt <= maxRetries && isRetryable) {
              console.log(`PDF generation attempt ${attempt} failed, retrying...`);
              lastError = error;
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, attempt * 1000));
              continue;
            }
            
            // Format error for user display
            const userFriendlyMessage = formatPdfError(errorText);
            throw new Error(userFriendlyMessage);
          }

          return response.blob();
        } catch (error) {
          lastError = error as Error;
          
          // Check if we should retry
          if (attempt <= maxRetries && lastError.message.includes('service is temporarily unavailable')) {
            console.log(`PDF generation attempt ${attempt} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            continue;
          }
          
          // Final attempt failed, throw the error
          throw lastError;
        }
      }
      
      // Should never reach here, but just in case
      throw lastError || new Error('PDF generation failed after multiple attempts');
    },
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${variables.cvData.personalInfo?.firstName || 'CV'}_${variables.cvData.personalInfo?.lastName || 'Resume'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF generated and downloaded successfully! 🎉', {
        duration: 5000,
        icon: '📄',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unable to generate PDF at this time';
      toast.error(errorMessage, {
        duration: 8000, // Longer duration for error messages
        style: {
          maxWidth: '500px',
        },
      });
      
      // Log the full error for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.error('PDF Generation Error:', error);
      }
    },
  });
};

// Templates Query
export const useTemplates = () => {
  const { apiRequest } = useAuthenticatedApi();
  
  return useQuery({
    queryKey: queryKeys.templates,
    queryFn: async () => {
      const response = await apiRequest<{templates: string[]}>(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/templates/`);
      return response;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - templates don't change often
  });
};

// Password Change Mutation
export const useChangePassword = () => {
  const { apiRequest } = useAuthenticatedApi();
  
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/user/change-password/`, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return response;
    },
    onSuccess: () => {
      toast.success('Password changed successfully!');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      toast.error(errorMessage);
    },
  });
};