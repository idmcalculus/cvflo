"""
Views for PDF Generation app

These views provide REST API endpoints for PDF generation,
equivalent to the Node.js PdfController functionality.
"""

import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from django.conf import settings

from .services import CVPDFService, TemplateService, PDFGenerationError
from apps.cv_builder.serializers import PDFGenerationSerializer, HTMLPDFGenerationSerializer

logger = logging.getLogger('cvflo')


class GeneratePDFView(APIView):
    """
    Generate PDF from CV data
    Equivalent to Node.js generatePdf method
    """
    
    permission_classes = [IsAuthenticated]
    
    @method_decorator(ratelimit(key='user', rate='10/15min', method='POST'))
    def post(self, request):
        """Generate PDF from CV data"""
        try:
            logger.info(f'PDF generation requested by user: {request.user.email}')
            
            # Validate request data
            serializer = PDFGenerationSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            cv_data = serializer.validated_data['cv_data']
            visibility = serializer.validated_data['visibility']
            template_name = serializer.validated_data['template_name']
            
            # Generate PDF using service
            pdf_service = CVPDFService()
            pdf_buffer = pdf_service.generate_pdf(cv_data, visibility, template_name)
            
            # Get suggested filename
            filename = pdf_service.get_suggested_filename(cv_data)
            
            # Create HTTP response with PDF
            response = HttpResponse(pdf_buffer, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Content-Length'] = len(pdf_buffer)
            
            logger.info(f'PDF generated successfully for user: {request.user.email}, size: {len(pdf_buffer)} bytes')
            return response
            
        except PDFGenerationError as e:
            logger.error(f'PDF generation failed: {str(e)}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f'Unexpected error during PDF generation: {str(e)}')
            return Response(
                {'error': 'An unexpected error occurred during PDF generation'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GeneratePreviewView(APIView):
    """
    Generate HTML preview from CV data
    Equivalent to Node.js generatePreview method
    """
    
    permission_classes = [IsAuthenticated]
    
    @method_decorator(ratelimit(key='user', rate='100/5min', method='POST'))
    def post(self, request):
        """Generate HTML preview from CV data"""
        try:
            logger.info(f'Preview generation requested by user: {request.user.email}')
            
            # Validate request data
            serializer = PDFGenerationSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            cv_data = serializer.validated_data['cv_data']
            visibility = serializer.validated_data['visibility']
            template_name = serializer.validated_data['template_name']
            
            # Generate HTML using service
            pdf_service = CVPDFService()
            html_content = pdf_service.generate_html(cv_data, visibility, template_name)
            
            # Return HTML response
            response = HttpResponse(html_content, content_type='text/html')
            
            logger.info(f'Preview generated successfully for user: {request.user.email}')
            return response
            
        except PDFGenerationError as e:
            logger.error(f'Preview generation failed: {str(e)}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f'Unexpected error during preview generation: {str(e)}')
            return Response(
                {'error': 'An unexpected error occurred during preview generation'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GeneratePDFFromHTMLView(APIView):
    """
    Generate PDF from pre-rendered HTML content
    Equivalent to Node.js generatePdfFromHtml method
    """
    
    permission_classes = [IsAuthenticated]
    
    @method_decorator(ratelimit(key='user', rate='10/15min', method='POST'))
    def post(self, request):
        """Generate PDF from HTML content"""
        try:
            logger.info(f'HTML-to-PDF generation requested by user: {request.user.email}')
            
            # Validate request data
            serializer = HTMLPDFGenerationSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            html_content = serializer.validated_data['html_content']
            styles = serializer.validated_data['styles']
            cv_data = serializer.validated_data.get('cv_data')
            template_name = serializer.validated_data['template_name']
            
            logger.info(f'HTML content length: {len(html_content)}, styles length: {len(styles)}')
            
            # Generate PDF using service
            pdf_service = CVPDFService()
            pdf_buffer = pdf_service.generate_pdf_from_html(html_content, styles, template_name)
            
            # Get suggested filename
            filename = 'CV_Resume.pdf'
            if cv_data:
                filename = pdf_service.get_suggested_filename(cv_data)
            
            # Create HTTP response with PDF
            response = HttpResponse(pdf_buffer, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Content-Length'] = len(pdf_buffer)
            
            logger.info(f'PDF generated from HTML successfully for user: {request.user.email}, size: {len(pdf_buffer)} bytes')
            return response
            
        except PDFGenerationError as e:
            logger.error(f'HTML-to-PDF generation failed: {str(e)}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f'Unexpected error during HTML-to-PDF generation: {str(e)}')
            return Response(
                {'error': 'An unexpected error occurred during HTML PDF generation'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TemplateListView(APIView):
    """
    Get available CV templates
    Equivalent to Node.js getTemplates method
    """
    
    permission_classes = []  # Public endpoint
    
    def get(self, request):
        """Get list of available templates"""
        try:
            templates = TemplateService.get_template_list()
            
            logger.info(f'Templates list requested, returned {len(templates)} templates')
            return Response({'templates': templates})
            
        except Exception as e:
            logger.error(f'Failed to get templates: {str(e)}')
            return Response(
                {'error': 'Failed to get templates'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PDFHealthView(APIView):
    """
    Get PDF service health status
    Equivalent to Node.js getHealth method
    """
    
    permission_classes = []  # Public endpoint
    
    def get(self, request):
        """Get PDF service health status"""
        try:
            import sys
            import django
            from django.db import connection
            
            # Test database connection
            db_status = 'connected'
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
            except Exception:
                db_status = 'disconnected'
            
            # Test WeasyPrint availability
            weasyprint_status = 'available'
            try:
                from weasyprint import HTML
            except ImportError:
                weasyprint_status = 'not available'
            
            health_data = {
                'status': 'healthy',
                'timestamp': None,  # Will be set by timezone if available
                'pdf_service': {
                    'engine': 'WeasyPrint',
                    'status': weasyprint_status,
                },
                'database': db_status,
                'version': '1.0.0',
                'django_version': django.VERSION,
                'python_version': sys.version,
            }
            
            # Set timestamp if timezone is available
            try:
                from django.utils import timezone
                health_data['timestamp'] = timezone.now().isoformat()
            except ImportError:
                pass
            
            # Determine overall status
            if db_status != 'connected' or weasyprint_status != 'available':
                health_data['status'] = 'degraded'
                status_code = status.HTTP_206_PARTIAL_CONTENT
            else:
                status_code = status.HTTP_200_OK
            
            logger.info('PDF service health check requested')
            return Response(health_data, status=status_code)
            
        except Exception as e:
            logger.error(f'Health check failed: {str(e)}')
            return Response({
                'status': 'unhealthy',
                'error': str(e)
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)