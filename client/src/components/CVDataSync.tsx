import React, { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCVStore } from '../store/cvStore';
import { useCVData, useUpdateCVData } from '../hooks/useApiQuery';
import { useCVDataMigration } from '../utils/migrateCVData';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Component to handle CV data synchronization between localStorage and database
 * This component should be mounted at the app level when user is authenticated
 */
const CVDataSync: React.FC = () => {
  const { user } = useAuth();
  const { data, visibility, selectedTemplate, isDirty, loadFromDatabase, markAsSynced } = useCVStore();
  const queryClient = useQueryClient();
  
  // Database hooks
  const { data: dbData, isLoading: isLoadingDB, error: dbError } = useCVData();
  const updateCVData = useUpdateCVData();
  
  // Migration hook
  const { needsMigration, migrateData, isLoading: isMigrating } = useCVDataMigration();

  // Track if migration has been attempted to prevent repeated calls
  const migrationAttempted = useRef(false);
  const dataLoaded = useRef(false);
  const previousUserId = useRef<string | null>(null);

  // Reset tracking variables when user changes
  useEffect(() => {
    const currentUserId = user?.id || null;
    if (previousUserId.current !== currentUserId) {
      previousUserId.current = currentUserId;
      migrationAttempted.current = false;
      dataLoaded.current = false;
      
      // Invalidate CV data queries to fetch fresh data for the new user
      if (currentUserId) {
        queryClient.invalidateQueries({ queryKey: ['cv', 'data', currentUserId] });
        queryClient.invalidateQueries({ queryKey: ['user', 'profile', currentUserId] });
      }
    }
  }, [user?.id, queryClient]);

  // Memoized migration function to prevent re-renders
  const handleMigration = useCallback(async () => {
    if (migrationAttempted.current || !user || !needsMigration) return;
    
    migrationAttempted.current = true;
    try {
      await migrateData();
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      // Reset flag to allow retry on next app load
      migrationAttempted.current = false;
    }
  }, [user, needsMigration, migrateData]);

  // Load data from database on first mount
  useEffect(() => {
    if (!user || isLoadingDB || isMigrating || dataLoaded.current) return;

    if (needsMigration && !migrationAttempted.current) {
      // Run migration first
      handleMigration();
    } else if (dbData && !needsMigration) {
      // Load from database (whether data exists or not)
      if (dbData.cvData) {
        // User has existing data - load it
        loadFromDatabase(dbData);
      }
      // Whether data exists or not, mark as loaded to prevent re-runs
      dataLoaded.current = true;
    }
  }, [user, dbData, isLoadingDB, needsMigration, isMigrating, loadFromDatabase, handleMigration]);

  // Auto-save dirty changes to database (debounced)
  useEffect(() => {
    if (!user || !isDirty || isMigrating) return;

    const timeoutId = setTimeout(async () => {
      try {
        await updateCVData.mutateAsync({
          cvData: data,
          visibility,
          selectedTemplate
        });
        markAsSynced();
      } catch (error) {
        console.error('Failed to auto-save CV data:', error);
        // Don't show error toast for auto-save failures to avoid spam
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [user, isDirty, data, visibility, selectedTemplate, updateCVData, markAsSynced, isMigrating]);

  // Sync on visibility change (page focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && isDirty && !isMigrating) {
        // Refetch data when page becomes visible to check for conflicts
        queryClient.invalidateQueries({ queryKey: ['cv', 'data', user?.id] });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, isDirty, queryClient, isMigrating]);

  // Handle database errors
  useEffect(() => {
    if (dbError) {
      console.error('Database sync error:', dbError);
      
      // Only show error if user is authenticated and it's not a network issue during initial load
      if (user && !isLoadingDB) {
        console.warn('CV data sync error:', dbError);
        // Don't show toast for every sync error to avoid spam
        // Let individual operations handle their own error feedback
      }
    }
  }, [dbError, user, isLoadingDB]);

  return null; // This component doesn't render anything
};

export default CVDataSync;