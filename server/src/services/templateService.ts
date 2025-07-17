import fs from 'fs/promises';
import path from 'path';
import { CVData, SectionVisibility } from '../types/cv.ts';
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
  helpers: {
    escapeHtml: (str: string | undefined) => string;
    formatDate: (dateStr?: string, defaultValue?: string) => string;
  };
}

/**
 * Template Service - Handles CV template processing
 * Supports placeholder replacement and conditional sections
 */
export class TemplateService {
  private logger = createAppLogger();
  private templatesPath: string;
  private templateCache = new Map<string, string>();
  private dataFilterService = new DataFilterService();

  constructor() {
    this.templatesPath = path.join(process.cwd(), 'templates');
  }

  /**
   * Utility function to escape HTML special characters
   */
  private escapeHtml(str: string | undefined): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Format date string
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
   * Load template from file system
   */
  private async loadTemplate(templateName: string): Promise<string> {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.html`);
      const template = await fs.readFile(templatePath, 'utf-8');
      
      // Cache the template for better performance
      this.templateCache.set(templateName, template);
      
      this.logger.info(`Template loaded: ${templateName}`);
      return template;
    } catch (error) {
      this.logger.error(`Failed to load template: ${templateName}`, { error });
      throw new Error(`Template not found: ${templateName}`);
    }
  }

  /**
   * Process template with data using simple placeholder replacement
   */
  private processTemplate(template: string, data: TemplateData, isRecursive = false): string {
    let processed = template;

    // Debug: Check if template contains visibility conditions (only for top-level calls)
    if (!isRecursive) {
      const visibilityConditions = template.match(/\{\{#if\s+visibility\.\w+\}\}/g);
      this.logger.info('Found visibility conditions in template:', visibilityConditions);
    }

    // Process loops first, then conditionals
    // This ensures that {{#each}} contexts are established before evaluating {{#if this.*}} conditions
    processed = processed.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, arrayPath, itemTemplate) => {
      try {
        const array = this.getNestedValue(data, arrayPath.trim());
        if (!Array.isArray(array)) return '';
        
        return array.map(item => {
          // Create a new data context with the current item
          const itemData = { ...data, this: item };
          return this.processTemplate(itemTemplate, itemData, true); // Mark as recursive
        }).join('');
      } catch {
        return '';
      }
    });

    // Process conditional sections {{#if condition}}...{{/if}} with proper nesting support
    // Do this after loops to handle both visibility and content conditions
    if (!isRecursive) {
      processed = this.processNestedConditionals(processed, data);
    }

    // Process remaining conditionals (for recursive calls or simple conditions)
    // Handle {{#if}}...{{else}}...{{/if}} patterns
    processed = processed.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (match, condition, ifContent, elseContent) => {
      try {
        const shouldShow = this.evaluateCondition(data, condition.trim());
        if (!isRecursive && condition.includes('.length')) {
          this.logger.info(`Length condition: ${condition} = ${shouldShow}`, {
            arrayData: this.getNestedValue(data, condition.replace('.length', ''))
          });
        }
        return shouldShow ? ifContent : (elseContent || '');
      } catch (error) {
        this.logger.error(`Error evaluating condition: ${condition}`, { error });
        return '';
      }
    });

    // Replace simple placeholders like {{personalInfo.firstName}} and {{{this.description}}} - do this last
    // Handle triple braces first (unescaped HTML)
    processed = processed.replace(/\{\{\{([^}]+)\}\}\}/g, (_, path) => {
      try {
        const value = this.getNestedValue(data, path.trim());
        return value != null ? String(value) : '';
      } catch {
        return '';
      }
    });

    // Then handle double braces (escaped HTML)
    processed = processed.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
      try {
        const value = this.getNestedValue(data, path.trim());
        return value != null ? String(value) : '';
      } catch {
        return '';
      }
    });

    return processed;
  }

  /**
   * Process nested conditionals by manually finding matching pairs
   */
  private processNestedConditionals(template: string, data: TemplateData): string {
    this.logger.info('Processing nested conditionals...');

    let processed = template;
    let changed = true;

    // Keep processing until no more conditionals are found
    while (changed) {
      changed = false;

      // Find all conditionals, but prioritize visibility ones first
      const allConditionalsRegex = /\{\{#if\s+([^}]+)\}\}/g;
      let match;

      while ((match = allConditionalsRegex.exec(processed)) !== null) {
        const condition = match[1];
        const startPos = match.index;
        const startTag = match[0];

        // Process visibility conditions first, then other conditions
        if (!condition.startsWith('visibility.') && processed.includes('{{#if visibility.')) {
          continue; // Skip non-visibility if there are still visibility conditions to process
        }

        // Find the matching {{/if}} by counting nesting levels
        let nestingLevel = 1;
        let pos = startPos + startTag.length;
        let endPos = -1;

        while (pos < processed.length && nestingLevel > 0) {
          const ifMatch = processed.substring(pos).match(/^\{\{#if\s+[^}]+\}\}/);
          const endifMatch = processed.substring(pos).match(/^\{\{\/if\}\}/);

          if (ifMatch) {
            nestingLevel++;
            pos += ifMatch[0].length;
          } else if (endifMatch) {
            nestingLevel--;
            if (nestingLevel === 0) {
              endPos = pos;
              break;
            }
            pos += endifMatch[0].length;
          } else {
            pos++;
          }
        }

        if (endPos !== -1) {
          // Extract the content between the tags
          const content = processed.substring(startPos + startTag.length, endPos);
          const fullBlock = processed.substring(startPos, endPos + 7); // +7 for {{/if}}

          try {
            const shouldShow = this.evaluateCondition(data, condition);
            this.logger.info(`Template condition: ${condition} = ${shouldShow}`, {
              contentPreview: content.substring(0, 100).replace(/\s+/g, ' '),
              conditionType: condition.startsWith('visibility.') ? 'visibility' : 'content'
            });

            const replacement = shouldShow ? content : '';
            processed = processed.replace(fullBlock, replacement);
            changed = true;
            break; // Start over to avoid position issues
          } catch (error) {
            this.logger.error(`Error evaluating condition: ${condition}`, { error });
            processed = processed.replace(fullBlock, '');
            changed = true;
            break;
          }
        }
      }
    }

    // Process remaining non-visibility conditionals with simple regex
    processed = processed.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      try {
        const shouldShow = this.evaluateCondition(data, condition.trim());
        return shouldShow ? content : '';
      } catch (error) {
        this.logger.error(`Error evaluating condition: ${condition}`, { error });
        return '';
      }
    });

    return processed;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    if (path === 'this') return obj.this;
    
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        return current[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Evaluate condition for conditional sections
   */
  private evaluateCondition(data: TemplateData, condition: string): boolean {
    try {
      // Handle simple existence checks
      if (!condition.includes(' ')) {
        const value = this.getNestedValue(data, condition);
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'string') return value.trim().length > 0;
        return Boolean(value);
      }

      // Handle array length checks like "workExperience.length > 0" and "workExperience.length"
      const lengthCheckMatch = condition.match(/^([^.]+)\.length(\s*>\s*(\d+))?$/);
      if (lengthCheckMatch) {
        const [, arrayPath, , threshold] = lengthCheckMatch;
        const array = this.getNestedValue(data, arrayPath);
        if (!Array.isArray(array)) return false;
        
        // If no threshold specified, just check if length > 0
        if (!threshold) return array.length > 0;
        
        // Otherwise check against threshold
        return array.length > parseInt(threshold);
      }

      // Handle visibility checks like "visibility.summary"
      const visibilityMatch = condition.match(/^visibility\.(\w+)$/);
      if (visibilityMatch) {
        const [, section] = visibilityMatch;
        return Boolean(data.visibility[section as keyof SectionVisibility]);
      }

      return false;
    } catch {
      return false;
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
   * Render CV using specified template
   */
  public async renderCV(templateName: string, cvData: CVData, visibility: SectionVisibility): Promise<string> {
    try {
      const template = await this.loadTemplate(templateName);
      
      // Filter data based on visibility settings - this eliminates complex template conditions
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
        helpers: {
          escapeHtml: this.escapeHtml,
          formatDate: this.formatDate,
        }
      };

      // Debug logging
      this.logger.info('Template data visibility flags:', templateData.visibility);
      this.logger.info('Template data arrays:', {
        workExperience: templateData.workExperience?.length || 0,
        education: templateData.education?.length || 0,
        skills: templateData.skills?.length || 0
      });

      const rendered = this.processTemplate(template, templateData);
      
      this.logger.info(`CV rendered successfully with template: ${templateName}`);
      return rendered;
    } catch (error) {
      this.logger.error(`Failed to render CV with template: ${templateName}`, { error });
      throw error;
    }
  }

  /**
   * Clear template cache (useful for development)
   */
  public clearCache(): void {
    this.templateCache.clear();
    this.logger.info('Template cache cleared');
  }
}