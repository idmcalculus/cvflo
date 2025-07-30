import fs from 'fs/promises';
import path from 'path';
import Handlebars from 'handlebars';
import { CVData, SectionVisibility, SectionSettings } from '../types/cv.ts';
import { createAppLogger } from '../utils/logger.ts';
import { DataFilterService } from './dataFilterService.ts';

interface TemplateData {
  personalInfo: any;
  summary: string;
  workExperience: any[];
  education: any[];
  projects: any[];
  skills: any[];
  interests: any[];
  references: any[];
  visibility: SectionVisibility;
  sectionSettings: SectionSettings;
}

/**
 * Handlebars Template Service - Modern template processing using Handlebars
 * Replaces the custom template engine with a standard, well-supported solution
 */
export class HandlebarsTemplateService {
  private logger = createAppLogger();
  private templatesPath: string;
  private templateCache = new Map<string, HandlebarsTemplateDelegate>();
  private dataFilterService = new DataFilterService();

  constructor() {
    this.templatesPath = path.join(process.cwd(), 'templates');
    this.registerHelpers();
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHelpers(): void {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (dateStr?: string, defaultValue = '') => {
      if (!dateStr) return defaultValue;
      try {
        const date = new Date(dateStr);
        // Adjust for timezone to prevent off-by-one day errors
        const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
        return utcDate.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
      } catch {
        return dateStr; // Return original string if format is invalid
      }
    });

    // HTML escaping helper (for safe HTML output)
    Handlebars.registerHelper('escapeHtml', (str: string | undefined) => {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    });

    // Array length helper
    Handlebars.registerHelper('length', (array: any[]) => {
      return Array.isArray(array) ? array.length : 0;
    });

    // Join array with separator
    Handlebars.registerHelper('join', (array: any[], separator = ', ') => {
      if (!Array.isArray(array)) return '';
      return array.map(item => typeof item === 'object' ? item.name || item : item).join(separator);
    });

    // Check if array has elements
    Handlebars.registerHelper('hasItems', (array: any[]) => {
      return Array.isArray(array) && array.length > 0;
    });

    // Conditional helper for better readability
    Handlebars.registerHelper('ifEquals', function(this: any, arg1: any, arg2: any, options: any) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    // Current date helper
    Handlebars.registerHelper('ifCurrent', function(this: any, current: boolean, options: any) {
      return current ? 'Present' : options.fn(this);
    });

    // Technologies list helper for projects
    Handlebars.registerHelper('technologiesList', (technologies: string[], separator = ', ') => {
      if (!Array.isArray(technologies) || technologies.length === 0) return '';
      return technologies.join(separator);
    });

    Handlebars.registerHelper('groupSkills', (skills: any[]) => {
      if (!Array.isArray(skills)) return [];
      const groups = skills.reduce((acc, skill) => {
        const category = skill.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = { category, skills: [] };
        }
        acc[category].skills.push(skill);
        return acc;
      }, {});
      return Object.values(groups);
    });

    Handlebars.registerHelper('multiply', (a: number, b: number) => {
      return (a || 0) * (b || 0);
    });

    // URL validation helper
    Handlebars.registerHelper('isUrl', (str: string) => {
      if (!str) return false;
      try {
        new URL(str);
        return true;
      } catch {
        // Try adding https:// prefix if it looks like a URL
        if (str.includes('.') && !str.includes(' ')) {
          try {
            new URL('https://' + str);
            return true;
          } catch {
            return false;
          }
        }
        return false;
      }
    });

    // Logical OR helper for multiple conditions
    Handlebars.registerHelper('or', function(...args) {
      // Remove the last argument which is the Handlebars options object
      const values = args.slice(0, -1);
      return values.some(value => !!value);
    });
  }

  /**
   * Load and compile template from file system
   */
  private async loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.html`);
      const templateSource = await fs.readFile(templatePath, 'utf-8');
      
      // Compile the template
      const compiledTemplate = Handlebars.compile(templateSource);
      
      // Cache the compiled template for better performance
      this.templateCache.set(templateName, compiledTemplate);
      
      this.logger.info(`Handlebars template compiled and cached: ${templateName}`);
      return compiledTemplate;
    } catch (error) {
      this.logger.error(`Failed to load template: ${templateName}`, { error });
      throw new Error(`Template not found: ${templateName}`);
    }
  }

  /**
   * Format dates in an array of objects that have startDate and endDate properties
   */
  private formatDatesInArray(items: any[]): any[] {
    return items.map(item => ({
      ...item,
      formattedStartDate: this.formatDate(item.startDate),
      formattedEndDate: this.formatDate(item.endDate),
    }));
  }

  /**
   * Format date string (helper method)
   */
  private formatDate(dateStr?: string, defaultValue = ''): string {
    if (!dateStr) return defaultValue;
    try {
      const date = new Date(dateStr);
      // Adjust for timezone to prevent off-by-one day errors
      const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
      return utcDate.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    } catch {
      return dateStr; // Return original string if format is invalid
    }
  }

  /**
   * Get list of available templates
   */
  public async getAvailableTemplates(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.templatesPath);
      return files
        .filter(file => file.endsWith('.html'))
        .map(file => file.replace('.html', ''));
    } catch (error) {
      this.logger.error('Failed to list templates', { error });
      return [];
    }
  }

  /**
   * Render CV using specified Handlebars template
   */
  public async renderCV(templateName: string, cvData: CVData, visibility: SectionVisibility): Promise<string> {
    try {
      const template = await this.loadTemplate(templateName);
      
      // Filter data based on visibility settings
      const filteredData = this.dataFilterService.filterCVData(cvData, visibility);
      
      const templateData: TemplateData = {
        personalInfo: filteredData.personalInfo,
        summary: filteredData.summary || '',
        workExperience: this.formatDatesInArray(filteredData.workExperience || []),
        education: this.formatDatesInArray(filteredData.education || []),
        projects: this.formatDatesInArray(filteredData.projects || []),
        skills: filteredData.skills || [],
        interests: filteredData.interests || [],
        references: filteredData.references || [],
        visibility: {
          // Use the filtered has flags - only show sections with both visibility=true AND content
          summary: filteredData.hasSummary,
          workExperience: filteredData.hasWorkExperience,
          education: filteredData.hasEducation,
          projects: filteredData.hasProjects,
          skills: filteredData.hasSkills,
          interests: filteredData.hasInterests,
          references: filteredData.hasReferences,
        },
        sectionSettings: cvData.sectionSettings || {
          skills: { showProficiencyLevels: false }
        }
      };

      // Debug logging
      this.logger.info('Handlebars template data visibility flags:', templateData.visibility);
      this.logger.info('Handlebars template data arrays:', {
        workExperience: templateData.workExperience?.length || 0,
        education: templateData.education?.length || 0,
        skills: templateData.skills?.length || 0
      });

      const rendered = template(templateData);
      
      this.logger.info(`CV rendered successfully with Handlebars template: ${templateName}`);
      return rendered;
    } catch (error) {
      this.logger.error(`Failed to render CV with Handlebars template: ${templateName}`, { error });
      throw error;
    }
  }

  /**
   * Clear template cache (useful for development)
   */
  public clearCache(): void {
    this.templateCache.clear();
    this.logger.info('Handlebars template cache cleared');
  }
}
