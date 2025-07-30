import { useSaveCVData } from '../hooks/useApiQuery';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * Utility to migrate CV data from localStorage to database
 * This should run once when a user first logs in after the database persistence feature is deployed
 */

export interface LocalStorageCVData {
  state: {
    data: Record<string, unknown>;
    visibility: Record<string, boolean>;
    selectedTemplate: string;
    activeSection: string;
    defaultTemplate: string;
    ui: Record<string, unknown>;
  };
  version: number;
}

export const MIGRATION_KEY = 'cv-data-migrated';
export const LOCALSTORAGE_KEY = 'cv-storage';

/**
 * Check if CV data needs to be migrated from localStorage
 */
export const needsMigration = (userId?: string): boolean => {
  // Check if migration has already been completed for this user
  const migrationKey = userId ? `${MIGRATION_KEY}-${userId}` : MIGRATION_KEY;
  const migrated = localStorage.getItem(migrationKey);
  if (migrated === 'true') {
    return false;
  }

  // Check if there's localStorage CV data to migrate
  const localData = localStorage.getItem(LOCALSTORAGE_KEY);
  return localData !== null && localData.trim() !== '';
};

/**
 * Get CV data from localStorage
 */
export const getLocalStorageCVData = (): LocalStorageCVData | null => {
  try {
    const localData = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!localData) {
      return null;
    }
    return JSON.parse(localData) as LocalStorageCVData;
  } catch (error) {
    console.error('Error parsing localStorage CV data:', error);
    return null;
  }
};

/**
 * Mark migration as completed
 */
export const markMigrationCompleted = (userId?: string): void => {
  const migrationKey = userId ? `${MIGRATION_KEY}-${userId}` : MIGRATION_KEY;
  localStorage.setItem(migrationKey, 'true');
};

/**
 * Hook to handle CV data migration
 */
export const useCVDataMigration = () => {
  const { user } = useAuth();
  const saveCVData = useSaveCVData();

  const migrateData = async () => {
    if (!user || !needsMigration(user.id)) {
      return;
    }

    try {
      const localData = getLocalStorageCVData();
      if (!localData || !localData.state) {
        console.log('No local CV data found to migrate');
        markMigrationCompleted(user.id);
        return;
      }

      const { data, visibility, selectedTemplate } = localData.state;

      // Check if there's actual CV data (not just default empty state)
      const hasData = (
        data.personalInfo?.firstName ||
        data.personalInfo?.lastName ||
        data.personalInfo?.email ||
        data.summary ||
        data.workExperience?.length > 0 ||
        data.education?.length > 0 ||
        data.projects?.length > 0 ||
        data.skills?.length > 0
      );

      if (!hasData) {
        console.log('No meaningful CV data found to migrate');
        markMigrationCompleted(user.id);
        return;
      }

      // Show migration toast
      toast.loading('Migrating your CV data to the cloud...', { id: 'migration' });

      // Save to database
      await saveCVData.mutateAsync({
        cvData: data,
        visibility: visibility,
        selectedTemplate: selectedTemplate || 'classic-0'
      });

      // Mark as migrated
      markMigrationCompleted();

      // Success toast
      toast.success('Your CV data has been successfully migrated to the cloud! 🎉', {
        id: 'migration',
        duration: 5000
      });

      console.log('CV data migration completed successfully');
    } catch (error) {
      console.error('CV data migration failed:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to migrate your CV data. ';
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage += 'Please check your internet connection and try again.';
        } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
          errorMessage += 'Please sign out and sign back in.';
        } else {
          errorMessage += 'Please try refreshing the page.';
        }
      } else {
        errorMessage += 'Please try refreshing the page.';
      }
      
      toast.error(errorMessage, {
        id: 'migration',
        duration: 10000,
        style: {
          maxWidth: '500px',
        }
      });
      
      // Don't mark as migrated if it failed, so we can retry
    }
  };

  return {
    needsMigration: needsMigration(user?.id),
    migrateData,
    isLoading: saveCVData.isPending
  };
};