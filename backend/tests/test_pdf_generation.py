"""
Tests for PDF Generation service

These tests ensure the PDF generation functionality works correctly.
"""

import pytest
from django.test import TestCase
from unittest.mock import patch, MagicMock
from apps.pdf_generation.services import CVPDFService, PDFGenerationError, TemplateService


class PDFGenerationServiceTests(TestCase):
    """Test PDF generation service"""
    
    def setUp(self):
        """Set up test data"""
        self.pdf_service = CVPDFService()
        
        self.sample_cv_data = {
            'personal_info': {
                'first_name': 'John',
                'last_name': 'Doe',
                'email': 'john.doe@example.com',
                'phone': '+1234567890',
                'title': 'Software Engineer'
            },
            'summary': 'Experienced software engineer with 5+ years of experience.',
            'work_experience': [
                {
                    'position': 'Senior Developer',
                    'company': 'Tech Corp',
                    'location': 'San Francisco, CA',
                    'start_date': '2020-01',
                    'end_date': '2023-01',
                    'current': False,
                    'description': 'Developed web applications using Python and Django.'
                }
            ],
            'education': [
                {
                    'institution': 'University of Technology',
                    'degree': 'Bachelor of Science',
                    'field': 'Computer Science',
                    'location': 'Boston, MA',
                    'start_date': '2016-09',
                    'end_date': '2020-05',
                    'current': False
                }
            ],
            'skills': [
                {'name': 'Python', 'category': 'Programming', 'level': 9},
                {'name': 'Django', 'category': 'Frameworks', 'level': 8}
            ]
        }
        
        self.sample_visibility = {
            'summary': True,
            'workExperience': True,
            'education': True,
            'projects': True,
            'skills': True,
            'interests': True,
            'references': True
        }
    
    def test_get_suggested_filename(self):
        """Test filename generation"""
        filename = self.pdf_service.get_suggested_filename(self.sample_cv_data)
        self.assertEqual(filename, 'John_Doe_Resume.pdf')
        
        # Test with missing personal info
        empty_data = {}
        filename = self.pdf_service.get_suggested_filename(empty_data)
        self.assertEqual(filename, 'CV_Resume.pdf')
    
    def test_get_template_config(self):
        """Test template configuration retrieval"""
        config = self.pdf_service.get_template_config('classic-0')
        self.assertIn('display_name', config)
        self.assertEqual(config['name'], 'classic-0')
        
        # Test fallback for unknown template
        config = self.pdf_service.get_template_config('unknown-template')
        self.assertEqual(config['name'], 'unknown-template')
    
    @patch('apps.pdf_generation.services.render_to_string')
    def test_generate_html(self, mock_render):
        """Test HTML generation"""
        mock_render.return_value = '<html><body>Test CV</body></html>'
        
        html = self.pdf_service.generate_html(
            self.sample_cv_data,
            self.sample_visibility,
            'classic-0'
        )
        
        self.assertEqual(html, '<html><body>Test CV</body></html>')
        mock_render.assert_called_once()
        
        # Check that the context was passed correctly
        call_args = mock_render.call_args
        context = call_args[0][1]  # Second argument is the context
        self.assertEqual(context['cv_data'], self.sample_cv_data)
        self.assertEqual(context['visibility'], self.sample_visibility)
    
    @patch('apps.pdf_generation.services.HTML')
    def test_html_to_pdf_success(self, mock_html):
        """Test successful HTML to PDF conversion"""
        # Mock WeasyPrint HTML object
        mock_html_instance = MagicMock()
        mock_html.return_value = mock_html_instance
        mock_html_instance.write_pdf.return_value = None
        
        # Mock the PDF buffer
        with patch('io.BytesIO') as mock_bytesio:
            mock_buffer = MagicMock()
            mock_buffer.getvalue.return_value = b'fake pdf content'
            mock_bytesio.return_value = mock_buffer
            
            html_content = '<html><body>Test</body></html>'
            pdf_bytes = self.pdf_service.html_to_pdf(html_content, 'classic-0')
            
            self.assertEqual(pdf_bytes, b'fake pdf content')
    
    @patch('apps.pdf_generation.services.HTML')
    def test_html_to_pdf_error(self, mock_html):
        """Test HTML to PDF conversion error handling"""
        mock_html.side_effect = Exception('WeasyPrint error')
        
        with self.assertRaises(PDFGenerationError):
            self.pdf_service.html_to_pdf('<html></html>', 'classic-0')
    
    def test_get_available_templates(self):
        """Test getting available templates"""
        templates = self.pdf_service.get_available_templates()
        
        self.assertIsInstance(templates, list)
        self.assertGreater(len(templates), 0)
        
        # Check template structure
        template = templates[0]
        required_fields = ['name', 'display_name', 'description', 'responsive', 'has_columns']
        for field in required_fields:
            self.assertIn(field, template)


class TemplateServiceTests(TestCase):
    """Test template service"""
    
    def test_get_template_list(self):
        """Test getting template list"""
        templates = TemplateService.get_template_list()
        
        self.assertIsInstance(templates, list)
        self.assertGreater(len(templates), 0)
    
    def test_validate_template(self):
        """Test template validation"""
        # Valid template
        self.assertTrue(TemplateService.validate_template('classic-0'))
        
        # Invalid template
        self.assertFalse(TemplateService.validate_template('nonexistent-template'))
    
    def test_get_template_metadata(self):
        """Test getting template metadata"""
        metadata = TemplateService.get_template_metadata('classic-0')
        
        self.assertIsNotNone(metadata)
        self.assertEqual(metadata['name'], 'classic-0')
        self.assertIn('display_name', metadata)
        
        # Test with invalid template
        metadata = TemplateService.get_template_metadata('invalid-template')
        self.assertIsNone(metadata)


@pytest.mark.django_db
class TestPDFGenerationAPI:
    """Test PDF generation API endpoints using pytest"""
    
    def test_template_endpoint(self, client):
        """Test templates endpoint"""
        response = client.get('/api/pdf/templates/')
        
        assert response.status_code == 200
        data = response.json()
        assert 'templates' in data
        assert isinstance(data['templates'], list)
        
    @pytest.mark.skip(reason="Requires WeasyPrint installation")
    def test_pdf_generation_endpoint(self, client, django_user_model):
        """Test PDF generation endpoint (requires WeasyPrint)"""
        # This test would require WeasyPrint to be properly installed
        # and would test the actual PDF generation endpoint
        pass