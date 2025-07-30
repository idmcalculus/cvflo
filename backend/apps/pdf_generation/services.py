"""
PDF Generation Services

This module provides PDF generation functionality using WeasyPrint,
equivalent to the Node.js PdfService that uses Puppeteer.
"""

import logging
import io
from typing import Dict, Any, Optional
from django.template.loader import render_to_string
from django.conf import settings
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration
import tempfile
import os

logger = logging.getLogger('cvflo')


class PDFGenerationError(Exception):
    """Custom exception for PDF generation errors"""
    pass


class CVPDFService:
    """
    Service class for generating CV PDFs using WeasyPrint
    Equivalent to the Node.js PdfService class
    """
    
    def __init__(self):
        self.font_config = FontConfiguration()
        self.templates_dir = settings.PDF_GENERATION['TEMPLATES_DIR']
    
    def generate_pdf(self, cv_data: Dict[str, Any], visibility: Dict[str, bool], 
                    template_name: str = 'classic-0') -> bytes:
        """
        Generate PDF from CV data using specified template
        
        Args:
            cv_data: Dictionary containing CV data
            visibility: Dictionary containing section visibility settings
            template_name: Name of the template to use
            
        Returns:
            bytes: Generated PDF as bytes
            
        Raises:
            PDFGenerationError: If PDF generation fails
        """
        try:
            logger.info(f'Starting PDF generation with template: {template_name}')
            
            # Generate HTML from template
            html_content = self.generate_html(cv_data, visibility, template_name)
            
            # Convert HTML to PDF using WeasyPrint
            pdf_buffer = self.html_to_pdf(html_content, template_name)
            
            logger.info(f'PDF generated successfully, size: {len(pdf_buffer)} bytes')
            return pdf_buffer
            
        except Exception as e:
            logger.error(f'PDF generation failed: {str(e)}')
            raise PDFGenerationError(f'Failed to generate PDF: {str(e)}')
    
    def generate_html(self, cv_data: Dict[str, Any], visibility: Dict[str, bool], 
                     template_name: str) -> str:
        """
        Generate HTML from CV data using Django template system
        
        Args:
            cv_data: Dictionary containing CV data
            visibility: Dictionary containing section visibility settings
            template_name: Name of the template to use
            
        Returns:
            str: Generated HTML content
        """
        try:
            # Prepare template context
            context = {
                'cv_data': cv_data,
                'visibility': visibility,
                'template_name': template_name,
                'personal_info': cv_data.get('personal_info', {}),
                'summary': cv_data.get('summary', ''),
                'work_experience': cv_data.get('work_experience', []),
                'education': cv_data.get('education', []),
                'projects': cv_data.get('projects', []),
                'skills': cv_data.get('skills', []),
                'interests': cv_data.get('interests', []),
                'references': cv_data.get('references', []),
                'skills_settings': cv_data.get('skills_settings', {
                    'show_proficiency_levels': True
                }),
            }
            
            # Render template
            template_path = f'cv/{template_name}.html'
            html_content = render_to_string(template_path, context)
            
            logger.info(f'HTML generated successfully for template: {template_name}')
            return html_content
            
        except Exception as e:
            logger.error(f'HTML generation failed: {str(e)}')
            raise PDFGenerationError(f'Failed to generate HTML: {str(e)}')
    
    def html_to_pdf(self, html_content: str, template_name: str) -> bytes:
        """
        Convert HTML content to PDF using WeasyPrint
        
        Args:
            html_content: HTML content to convert
            template_name: Template name for configuration
            
        Returns:
            bytes: Generated PDF as bytes
        """
        try:
            # Get template configuration
            template_config = self.get_template_config(template_name)
            pdf_settings = template_config.get('pdf_settings', {})
            
            # Create temporary file for HTML (WeasyPrint needs a base URL for relative resources)
            with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False) as tmp_file:
                tmp_file.write(html_content)
                tmp_file_path = tmp_file.name
            
            try:
                # Create HTML object from file
                html_doc = HTML(filename=tmp_file_path, font_config=self.font_config)
                
                # Generate CSS for the template
                css_content = self.get_template_css(template_name)
                css_objects = []
                if css_content:
                    css_objects.append(CSS(string=css_content, font_config=self.font_config))
                
                # Generate PDF with settings
                pdf_buffer = io.BytesIO()
                html_doc.write_pdf(
                    pdf_buffer,
                    stylesheets=css_objects,
                    font_config=self.font_config,
                    presentational_hints=True,
                    optimize_images=True,
                )
                
                return pdf_buffer.getvalue()
                
            finally:
                # Clean up temporary file
                os.unlink(tmp_file_path)
                
        except Exception as e:
            logger.error(f'HTML to PDF conversion failed: {str(e)}')
            raise PDFGenerationError(f'Failed to convert HTML to PDF: {str(e)}')
    
    def generate_pdf_from_html(self, html_content: str, styles: str = '', 
                              template_name: str = 'classic-0') -> bytes:
        """
        Generate PDF from pre-rendered HTML content
        Equivalent to the Node.js generatePdfFromHtml method
        
        Args:
            html_content: Pre-rendered HTML content
            styles: Additional CSS styles
            template_name: Template name for configuration
            
        Returns:
            bytes: Generated PDF as bytes
        """
        try:
            logger.info(f'Generating PDF from HTML content, template: {template_name}')
            
            # Combine template CSS with additional styles
            template_css = self.get_template_css(template_name)
            combined_css = f"{template_css}\n{styles}" if template_css else styles
            
            # Add CSS to HTML if not already present
            if combined_css and '<style>' not in html_content:
                # Insert CSS before closing head tag or at the beginning
                if '</head>' in html_content:
                    html_content = html_content.replace(
                        '</head>', 
                        f'<style>{combined_css}</style></head>'
                    )
                else:
                    html_content = f'<style>{combined_css}</style>{html_content}'
            
            # Convert to PDF
            return self.html_to_pdf(html_content, template_name)
            
        except Exception as e:
            logger.error(f'PDF generation from HTML failed: {str(e)}')
            raise PDFGenerationError(f'Failed to generate PDF from HTML: {str(e)}')
    
    def get_available_templates(self) -> list:
        """
        Get list of available CV templates
        Equivalent to the Node.js getAvailableTemplates method
        
        Returns:
            list: List of available templates with their configurations
        """
        try:
            templates = []
            for template_name, config in settings.CV_TEMPLATES.items():
                templates.append({
                    'name': template_name,
                    'display_name': config['display_name'],
                    'description': config['description'],
                    'responsive': config['responsive'],
                    'has_columns': config['has_columns'],
                })
            
            logger.info(f'Retrieved {len(templates)} available templates')
            return templates
            
        except Exception as e:
            logger.error(f'Failed to get available templates: {str(e)}')
            raise PDFGenerationError(f'Failed to get available templates: {str(e)}')
    
    def get_suggested_filename(self, cv_data: Dict[str, Any]) -> str:
        """
        Generate suggested filename for the PDF
        Equivalent to the Node.js getSuggestedFilename method
        
        Args:
            cv_data: Dictionary containing CV data
            
        Returns:
            str: Suggested filename
        """
        try:
            personal_info = cv_data.get('personal_info', {})
            first_name = personal_info.get('first_name', 'CV')
            last_name = personal_info.get('last_name', 'Resume')
            
            # Clean the filename to remove invalid characters
            filename = f"{first_name}_{last_name}_Resume.pdf"
            filename = "".join(c for c in filename if c.isalnum() or c in "._-")
            
            return filename
            
        except Exception as e:
            logger.warning(f'Failed to generate suggested filename: {str(e)}')
            return 'CV_Resume.pdf'
    
    def get_template_config(self, template_name: str) -> Dict[str, Any]:
        """
        Get configuration for a specific template
        
        Args:
            template_name: Name of the template
            
        Returns:
            dict: Template configuration
        """
        return settings.CV_TEMPLATES.get(template_name, settings.CV_TEMPLATES['classic-0'])
    
    def get_template_css(self, template_name: str) -> str:
        """
        Get CSS content for a specific template
        
        Args:
            template_name: Name of the template
            
        Returns:
            str: CSS content for the template
        """
        try:
            # Try to load template-specific CSS file
            css_path = os.path.join(settings.STATIC_ROOT or settings.BASE_DIR / 'static', 
                                  'css', f'{template_name}.css')
            
            if os.path.exists(css_path):
                with open(css_path, 'r', encoding='utf-8') as f:
                    return f.read()
            
            # Fallback to default CSS
            default_css_path = os.path.join(settings.STATIC_ROOT or settings.BASE_DIR / 'static', 
                                          'css', 'default.css')
            
            if os.path.exists(default_css_path):
                with open(default_css_path, 'r', encoding='utf-8') as f:
                    return f.read()
            
            return ""
            
        except Exception as e:
            logger.warning(f'Failed to load CSS for template {template_name}: {str(e)}')
            return ""


class TemplateService:
    """
    Service for managing CV templates
    Equivalent to the Node.js template service functionality
    """
    
    @staticmethod
    def get_template_list():
        """Get list of all available templates"""
        service = CVPDFService()
        return service.get_available_templates()
    
    @staticmethod
    def validate_template(template_name: str) -> bool:
        """Validate if a template exists and is available"""
        return template_name in settings.CV_TEMPLATES
    
    @staticmethod
    def get_template_metadata(template_name: str) -> Optional[Dict[str, Any]]:
        """Get metadata for a specific template"""
        if template_name in settings.CV_TEMPLATES:
            return settings.CV_TEMPLATES[template_name]
        return None