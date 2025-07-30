import { useAuth } from '../contexts/AuthContext';
import { useCallback } from 'react';

interface ApiError {
  error: string;
  code: string;
  message: string;
}

export const useAuthenticatedApi = () => {
  const { getAccessToken, signOut } = useAuth();

  const authenticatedFetch = useCallback(async (
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> => {
    const token = await getAccessToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    // Handle authentication errors
    if (response.status === 401) {
      console.warn('Authentication failed, signing out user');
      await signOut();
      window.location.href = '/auth/login';
      throw new Error('Authentication failed');
    }

    return response;
  }, [getAccessToken, signOut]);

  const apiRequest = useCallback(async <T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const response = await authenticatedFetch(url, options);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If we can't parse the error response, use the default message
      }
      
      throw new Error(errorMessage);
    }

    // Handle different content types
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return response.json();
    } else if (contentType?.includes('text/')) {
      return response.text() as T;
    } else {
      return response.blob() as T;
    }
  }, [authenticatedFetch]);

  return {
    authenticatedFetch,
    apiRequest,
  };
};