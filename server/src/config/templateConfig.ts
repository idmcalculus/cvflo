/**
 * Template-specific PDF generation configuration
 * Allows customization of PDF settings per template
 */
export interface PDFSettings {
  format: 'A4' | 'Letter' | 'Legal';
  margin: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  scale: number;
  viewport: {
    width: number;
    height: number;
  };
  waitTime: number; // Time to wait for rendering in ms
  printBackground: boolean;
}

export interface TemplateConfig {
  name: string;
  displayName: string;
  description: string;
  pdfSettings: PDFSettings;
  responsive: boolean;
  hasColumns: boolean;
}

/**
 * Default PDF settings for templates - optimized for full page width
 * A4 dimensions: 210mm x 297mm = 595.28 x 841.89 points at 72 DPI
 * Using higher DPI for better quality: 816 x 1056 pixels at 98 DPI
 */
const DEFAULT_PDF_SETTINGS: PDFSettings = {
  format: 'A4',
  margin: {
    top: '0mm',
    right: '0mm',  
    bottom: '0mm',
    left: '0mm',
  },
  scale: 1.0,
  viewport: {
    width: 816,   // A4 width optimized for full page utilization 
    height: 1056, // A4 height optimized for full page utilization
  },
  waitTime: 1000,
  printBackground: true,
};

/**
 * Template configurations with specific PDF settings
 */
export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  'classic-0': {
    name: 'classic-0',
    displayName: 'Classic Template',
    description: 'Traditional single-column layout with clean typography',
    responsive: false,
    hasColumns: false,
    pdfSettings: {
      ...DEFAULT_PDF_SETTINGS,
      scale: 1.0,
      margin: {
        top: '0.4in',     // Use template-defined margins for proper spacing
        right: '0.5in',
        bottom: '0.4in',
        left: '0.5in',
      },
      waitTime: 1200,    // Adequate wait time for font loading
    },
  },
  'modern-0': {
    name: 'modern-0',
    displayName: 'Modern Template',
    description: 'Multi-column layout with modern design elements',
    responsive: true,
    hasColumns: true,
    pdfSettings: {
      ...DEFAULT_PDF_SETTINGS,
      scale: 1.0,
      margin: {
        top: '0.4in',     // Use template-defined margins for proper spacing
        right: '0.5in',
        bottom: '0.4in',
        left: '0.5in',
      },
      viewport: {
        width: 816,
        height: 1056,
      },
      waitTime: 1500, // More time for complex layouts
    },
  },
  'modern-1': {
    name: 'modern-1',
    displayName: 'Modern Template v2',
    description: 'Alternative modern layout with sidebar',
    responsive: true,
    hasColumns: true,
    pdfSettings: {
      ...DEFAULT_PDF_SETTINGS,
      scale: 1.0,
      margin: {
        top: '0.4in',     // Use template-defined margins for proper spacing
        right: '0.5in',
        bottom: '0.4in',
        left: '0.5in',
      },
      viewport: {
        width: 816,
        height: 1056,
      },
      waitTime: 1500,
    },
  },
  'academic-0': {
    name: 'academic-0',
    displayName: 'Academic Template',
    description: 'Professional academic layout with publication focus',
    responsive: false,
    hasColumns: false,
    pdfSettings: {
      ...DEFAULT_PDF_SETTINGS,
      scale: 1.0,
      margin: {
        top: '0.4in',     // Use template-defined margins for proper spacing
        right: '0.5in',
        bottom: '0.4in',
        left: '0.5in',
      },
      viewport: {
        width: 816,      // Maintain full width for content
        height: 1056,    // Maintain full height for content
      },
      waitTime: 1500,    // Increased wait time for font loading and rendering
    },
  },
};

/**
 * Get configuration for a specific template
 */
export function getTemplateConfig(templateName: string): TemplateConfig {
  const config = TEMPLATE_CONFIGS[templateName];
  if (!config) {
    // Return default config for unknown templates
    return {
      name: templateName,
      displayName: templateName,
      description: 'Default template configuration',
      responsive: false,
      hasColumns: false,
      pdfSettings: DEFAULT_PDF_SETTINGS,
    };
  }
  return config;
}

/**
 * Get PDF settings for a specific template
 */
export function getTemplatePDFSettings(templateName: string): PDFSettings {
  return getTemplateConfig(templateName).pdfSettings;
}

/**
 * Get all available template configurations
 */
export function getAllTemplateConfigs(): TemplateConfig[] {
  return Object.values(TEMPLATE_CONFIGS);
}

/**
 * Validate template name
 */
export function isValidTemplate(templateName: string): boolean {
  return templateName in TEMPLATE_CONFIGS;
}