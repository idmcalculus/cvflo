import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createAppLogger } from '../utils/logger.ts';
import { InternalServerError, BadRequestError } from '../utils/errors.ts';

const logger = createAppLogger();

// Database Types
export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface CVData {
  id: string;
  user_id: string;
  cv_content: any;
  template_name: string;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  aud: string;
  role?: string;
}

/**
 * Supabase Service - Server-side Supabase client with service role
 * Handles user authentication verification and database operations
 */
class SupabaseService {
  private supabase: SupabaseClient;
  private readonly supabaseUrl: string;
  private readonly serviceRoleKey: string;

  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || '';
    this.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!this.supabaseUrl || !this.serviceRoleKey) {
      throw new Error(
        'Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
      );
    }

    // Create Supabase client with service role key for server-side operations
    this.supabase = createClient(this.supabaseUrl, this.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    logger.info('Supabase service initialized', { url: this.supabaseUrl });
  }

  /**
   * Verify JWT token and get user information
   */
  async verifyToken(token: string): Promise<AuthUser> {
    try {
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error || !data.user) {
        throw new BadRequestError('Invalid or expired token');
      }

      return {
        id: data.user.id,
        email: data.user.email,
        aud: data.user.aud,
        role: data.user.role,
      };
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      logger.error('Token verification failed', { error });
      throw new BadRequestError('Token verification failed');
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get user profile', { userId, error });
      throw new InternalServerError('Failed to get user profile');
    }
  }

  /**
   * Create or update user profile
   */
  async upsertUserProfile(user: AuthUser): Promise<UserProfile> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .upsert(
          {
            id: user.id,
            email: user.email,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'id',
          }
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to upsert user profile', { userId: user.id, error });
      throw new InternalServerError('Failed to create/update user profile');
    }
  }

  /**
   * Save CV data for a user
   */
  async saveCVData(userId: string, cvContent: any, templateName: string): Promise<CVData> {
    try {
      const { data, error } = await this.supabase
        .from('cv_data')
        .upsert(
          {
            user_id: userId,
            cv_content: cvContent,
            template_name: templateName,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to save CV data', { userId, error });
      throw new InternalServerError('Failed to save CV data');
    }
  }

  /**
   * Get CV data for a user
   */
  async getCVData(userId: string): Promise<CVData | null> {
    try {
      const { data, error } = await this.supabase
        .from('cv_data')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get CV data', { userId, error });
      throw new InternalServerError('Failed to get CV data');
    }
  }

  /**
   * Track PDF generation for analytics and rate limiting
   */
  async trackPDFGeneration(userId: string, templateName: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('pdf_generations')
        .insert({
          user_id: userId,
          template_name: templateName,
          created_at: new Date().toISOString(),
        });

      if (error) {
        // Don't throw error for analytics tracking failure
        logger.warn('Failed to track PDF generation', { userId, templateName, error });
      }
    } catch (error) {
      logger.warn('Failed to track PDF generation', { userId, templateName, error });
    }
  }

  /**
   * Get PDF generation count for rate limiting
   */
  async getPDFGenerationCount(userId: string, windowMs: number): Promise<number> {
    try {
      const since = new Date(Date.now() - windowMs).toISOString();
      
      const { count, error } = await this.supabase
        .from('pdf_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', since);

      if (error) {
        logger.warn('Failed to get PDF generation count', { userId, error });
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.warn('Failed to get PDF generation count', { userId, error });
      return 0;
    }
  }

  /**
   * Get the Supabase client instance for direct operations
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Health check for Supabase connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      return !error;
    } catch (error) {
      logger.error('Supabase health check failed', { error });
      return false;
    }
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();

// Export supabase client for backward compatibility
export const supabase = supabaseService.getClient();