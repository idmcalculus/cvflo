import type { Request, Response, NextFunction } from 'express';
import { CVData, SectionVisibility } from '../types/cv.ts';
import { createAppLogger } from '../utils/logger.ts';
import { AppError, BadRequestError, InternalServerError, NotFoundError } from '../utils/errors.ts';
import { supabaseService } from '../services/supabaseService.ts';

/**
 * CV Controller class for handling CV data operations
 */
export class CVController {
  constructor() {
    this.getCVData = this.getCVData.bind(this);
    this.saveCVData = this.saveCVData.bind(this);
    this.updateCVData = this.updateCVData.bind(this);
    this.deleteCVData = this.deleteCVData.bind(this);
  }

  /**
   * Get CV data for the authenticated user
   */
  public async getCVData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const { data, error } = await supabaseService
        .getClient()
        .from('cv_data')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw new InternalServerError(`Failed to fetch CV data: ${error.message}`);
      }

      // If no CV data exists, return empty structure
      if (!data) {
        res.json({
          cvData: null,
          visibility: null,
          selectedTemplate: 'classic-0',
          message: 'No CV data found'
        });
        return;
      }

      res.json({
        cvData: data.cv_content,
        visibility: data.cv_content.visibility,
        selectedTemplate: data.template_name || 'classic-0',
        lastUpdated: data.updated_at
      });

      createAppLogger().info('CV data retrieved successfully', {
        userId,
        templateName: data.template_name
      });
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      } else {
        const message = error instanceof Error ? error.message : 'Failed to retrieve CV data';
        return next(new InternalServerError(message));
      }
    }
  }

  /**
   * Save/Create CV data for the authenticated user
   */
  public async saveCVData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { cvData, visibility, selectedTemplate } = req.body;
      
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      if (!cvData) {
        throw new BadRequestError('CV data is required');
      }

      // Prepare the data to store
      const cvContent = {
        ...cvData,
        visibility: visibility || {
          summary: true,
          workExperience: true,
          education: true,
          projects: true,
          skills: true,
          interests: true,
          references: true,
        }
      };

      // Use upsert to create or update
      const { data, error } = await supabaseService
        .getClient()
        .from('cv_data')
        .upsert({
          user_id: userId,
          cv_content: cvContent,
          template_name: selectedTemplate || 'classic-0',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        throw new InternalServerError(`Failed to save CV data: ${error.message}`);
      }

      res.json({
        success: true,
        message: 'CV data saved successfully',
        data: {
          id: data.id,
          lastUpdated: data.updated_at
        }
      });

      createAppLogger().info('CV data saved successfully', {
        userId,
        templateName: selectedTemplate,
        dataSize: JSON.stringify(cvContent).length
      });
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      } else {
        const message = error instanceof Error ? error.message : 'Failed to save CV data';
        return next(new InternalServerError(message));
      }
    }
  }

  /**
   * Update CV data for the authenticated user
   */
  public async updateCVData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { cvData, visibility, selectedTemplate } = req.body;
      
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      // Check if CV data exists
      const { data: existingData, error: fetchError } = await supabaseService
        .getClient()
        .from('cv_data')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new InternalServerError(`Failed to check existing CV data: ${fetchError.message}`);
      }

      if (!existingData) {
        throw new NotFoundError('CV data not found. Use POST to create new CV data.');
      }

      // Prepare the data to update
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (cvData) {
        updateData.cv_content = {
          ...cvData,
          visibility: visibility || {
            summary: true,
            workExperience: true,
            education: true,
            projects: true,
            skills: true,
            interests: true,
            references: true,
          }
        };
      }

      if (selectedTemplate) {
        updateData.template_name = selectedTemplate;
      }

      const { data, error } = await supabaseService
        .getClient()
        .from('cv_data')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new InternalServerError(`Failed to update CV data: ${error.message}`);
      }

      res.json({
        success: true,
        message: 'CV data updated successfully',
        data: {
          id: data.id,
          lastUpdated: data.updated_at
        }
      });

      createAppLogger().info('CV data updated successfully', {
        userId,
        templateName: selectedTemplate
      });
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      } else {
        const message = error instanceof Error ? error.message : 'Failed to update CV data';
        return next(new InternalServerError(message));
      }
    }
  }

  /**
   * Delete CV data for the authenticated user
   */
  public async deleteCVData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const { error } = await supabaseService
        .getClient()
        .from('cv_data')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw new InternalServerError(`Failed to delete CV data: ${error.message}`);
      }

      res.json({
        success: true,
        message: 'CV data deleted successfully'
      });

      createAppLogger().info('CV data deleted successfully', { userId });
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      } else {
        const message = error instanceof Error ? error.message : 'Failed to delete CV data';
        return next(new InternalServerError(message));
      }
    }
  }
}