import { CVData, SectionVisibility } from '../types/cv.ts';
import { TemplateService } from '../services/templateService.ts';

/**
 * HTML Generator utility class
 * Handles generation of HTML templates for PDF using the template system
 */
export class HtmlGenerator {
  private templateService: TemplateService;

  constructor() {
    this.templateService = new TemplateService();
  }

  /**
   * Generate HTML content based on CV data and template
   */
  public async generateHTML(data: CVData, visibility: SectionVisibility, templateName = 'classic'): Promise<string> {
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
