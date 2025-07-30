import { CVData, SectionVisibility } from '../types/cv.ts';
import { HandlebarsTemplateService } from '../services/handlebarsTemplateService.ts';

/**
 * HTML Generator utility class
 * Handles generation of HTML templates for PDF using Handlebars
 */
export class HtmlGenerator {
  private templateService: HandlebarsTemplateService;

  constructor() {
    this.templateService = new HandlebarsTemplateService();
  }

  /**
   * Generate HTML content based on CV data and template
   */
  public async generateHTML(data: CVData, visibility: SectionVisibility, templateName = 'classic-0'): Promise<string> {
    try {
      return await this.templateService.renderCV(templateName, data, visibility);
    } catch (error) {
      throw new Error(`Error generating HTML: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get list of available templates
   */
  public async getAvailableTemplates(): Promise<string[]> {
    return await this.templateService.getAvailableTemplates();
  }
}
