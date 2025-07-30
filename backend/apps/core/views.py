"""
Core views for CVFlo Django backend

These views provide system-level functionality and error handling.
"""

import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.db import connection
from django.contrib.auth.models import User
from django.core.cache import cache
import sys
import django

from apps.cv_builder.models import CVProfile
# from apps.pdf_generation.enhanced_services import PDFAnalyticsService, get_pdf_pool  # Temporary disable for setup

logger = logging.getLogger('cvflo')


class SystemHealthView(APIView):
    """
    Comprehensive system health check endpoint
    Exceeds the Node.js server's basic health check
    """
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get comprehensive system health status"""
        try:
            health_data = {
                'status': 'healthy',
                'timestamp': timezone.now().isoformat(),
                'version': '1.0.0',
                'environment': {
                    'django_version': '.'.join(map(str, django.VERSION)),
                    'python_version': sys.version.split()[0],
                },
            }
            
            # Test database connection
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                health_data['database'] = {
                    'status': 'connected',
                    'vendor': connection.vendor,
                }
            except Exception as e:
                health_data['database'] = {
                    'status': 'error',
                    'error': str(e),
                }
                health_data['status'] = 'degraded'
            
            # Test cache
            try:
                cache_key = 'health_check_test'
                cache.set(cache_key, 'test', 60)
                cache_value = cache.get(cache_key)
                cache.delete(cache_key)
                
                health_data['cache'] = {
                    'status': 'working' if cache_value == 'test' else 'error'
                }
            except Exception as e:
                health_data['cache'] = {
                    'status': 'error',
                    'error': str(e),
                }
                health_data['status'] = 'degraded'
            
            # PDF service status
            try:
                from weasyprint import HTML
                pdf_pool = get_pdf_pool()
                health_data['pdf_service'] = {
                    'status': 'available',
                    'engine': 'WeasyPrint',
                    'pool_stats': pdf_pool.get_stats(),
                }
            except ImportError:
                health_data['pdf_service'] = {
                    'status': 'unavailable',
                    'error': 'WeasyPrint not installed',
                }
                health_data['status'] = 'degraded'
            except Exception as e:
                health_data['pdf_service'] = {
                    'status': 'error',
                    'error': str(e),
                }
                health_data['status'] = 'degraded'
            
            # System statistics
            try:
                health_data['statistics'] = {
                    'total_users': User.objects.count(),
                    'total_cv_profiles': CVProfile.objects.count(),
                    'total_pdf_generations': PDFGenerationLog.objects.count(),
                    'pdf_generations_last_24h': PDFGenerationLog.objects.filter(
                        created_at__gte=timezone.now() - timezone.timedelta(days=1)
                    ).count(),
                }
            except Exception as e:
                logger.warning(f'Failed to get system statistics: {str(e)}')
            
            # Determine overall status code
            status_code = status.HTTP_200_OK
            if health_data['status'] == 'degraded':
                status_code = status.HTTP_206_PARTIAL_CONTENT
            elif health_data['status'] == 'unhealthy':
                status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            
            logger.info('System health check completed', extra={'status': health_data['status']})
            return Response(health_data, status=status_code)
            
        except Exception as e:
            logger.error(f'Health check failed: {str(e)}')
            return Response({
                'status': 'unhealthy',
                'timestamp': timezone.now().isoformat(),
                'error': str(e),
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class SystemMetricsView(APIView):
    """
    System metrics endpoint for monitoring and analytics
    Django-specific enhancement not available in Node.js
    """
    
    permission_classes = [AllowAny]  # Could be restricted to admin users
    
    def get(self, request):
        """Get detailed system metrics"""
        try:
            # Get PDF analytics
            pdf_analytics = PDFAnalyticsService.get_system_stats()
            
            # Get cache statistics
            cache_stats = self._get_cache_stats()
            
            # Get database statistics
            db_stats = self._get_database_stats()
            
            metrics = {
                'timestamp': timezone.now().isoformat(),
                'pdf_analytics': pdf_analytics,
                'cache_statistics': cache_stats,
                'database_statistics': db_stats,
                'system_info': {
                    'django_version': '.'.join(map(str, django.VERSION)),
                    'python_version': sys.version.split()[0],
                },
            }
            
            return Response(metrics)
            
        except Exception as e:
            logger.error(f'Failed to get system metrics: {str(e)}')
            return Response(
                {'error': 'Failed to retrieve system metrics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_cache_stats(self):
        """Get cache-related statistics"""
        try:
            # This is a simplified version - in production you'd use specific cache backends
            return {
                'status': 'available',
                'backend': str(cache.__class__.__name__),
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
            }
    
    def _get_database_stats(self):
        """Get database-related statistics"""
        try:
            with connection.cursor() as cursor:
                # Get database size (PostgreSQL specific)
                if connection.vendor == 'postgresql':
                    cursor.execute("""
                        SELECT pg_size_pretty(pg_database_size(current_database())) as size
                    """)
                    db_size = cursor.fetchone()[0]
                else:
                    db_size = 'N/A'
                
                return {
                    'vendor': connection.vendor,
                    'database_size': db_size,
                    'active_connections': len(connection.queries),
                }
        except Exception as e:
            return {
                'error': str(e),
            }


class UserAnalyticsView(APIView):
    """
    User-specific analytics endpoint
    Provides insights for authenticated users about their CV usage
    """
    
    def get(self, request):
        """Get analytics for the authenticated user"""
        try:
            user_id = str(request.user.id)
            insights = PDFAnalyticsService.get_user_insights(user_id)
            
            # Add additional user-specific metrics
            try:
                cv_profile = CVProfile.objects.get(user=request.user)
                insights['cv_profile'] = {
                    'created_at': cv_profile.created_at,
                    'last_updated': cv_profile.updated_at,
                    'current_template': cv_profile.template_name,
                    'sections_count': self._count_cv_sections(cv_profile),
                }
            except CVProfile.DoesNotExist:
                insights['cv_profile'] = None
            
            return Response(insights)
            
        except Exception as e:
            logger.error(f'Failed to get user analytics: {str(e)}')
            return Response(
                {'error': 'Failed to retrieve user analytics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _count_cv_sections(self, cv_profile):
        """Count populated sections in CV profile"""
        count = 0
        if hasattr(cv_profile, 'personal_info'):
            count += 1
        count += cv_profile.work_experiences.count()
        count += cv_profile.education.count()
        count += cv_profile.projects.count()
        count += cv_profile.skills.count()
        count += cv_profile.interests.count()
        count += cv_profile.references.count()
        return count


# Error handlers
def custom_404(request, exception=None):
    """Custom 404 handler"""
    return JsonResponse({
        'error': 'Not Found',
        'message': 'The requested resource was not found.',
        'status_code': 404,
    }, status=404)


def custom_500(request):
    """Custom 500 handler"""
    return JsonResponse({
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred. Please try again later.',
        'status_code': 500,
    }, status=500)


class APIDocumentationView(APIView):
    """
    API documentation endpoint
    Provides self-documenting API capabilities
    """
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get API documentation"""
        api_docs = {
            'title': 'CVFlo API Documentation',
            'version': '1.0.0',
            'description': 'Enhanced Django backend for CVFlo CV Builder application',
            'base_url': request.build_absolute_uri('/api/'),
            'endpoints': {
                'Authentication': {
                    'POST /api/auth/verify-token/': 'Verify Supabase JWT token',
                    'GET /api/auth/profile/': 'Get user profile',
                    'PUT /api/auth/profile/': 'Update user profile',
                    'POST /api/auth/logout/': 'Logout user',
                },
                'CV Management': {
                    'GET /api/cv/data/': 'Get CV data for authenticated user',
                    'POST /api/cv/data/': 'Create/save CV data',
                    'PUT /api/cv/data/': 'Update CV data',
                    'DELETE /api/cv/data/': 'Delete CV data',
                    'GET /api/cv/templates/': 'Get available templates',
                },
                'PDF Generation': {
                    'POST /api/pdf/generate-pdf/': 'Generate PDF from CV data',
                    'POST /api/pdf/generate-preview/': 'Generate HTML preview',
                    'POST /api/pdf/generate-pdf-from-html/': 'Generate PDF from HTML',
                    'GET /api/pdf/templates/': 'Get available templates',
                    'GET /api/pdf/health/': 'PDF service health check',
                },
                'System': {
                    'GET /health/': 'System health check',
                    'GET /api/core/metrics/': 'System metrics (admin)',
                    'GET /api/core/user-analytics/': 'User analytics',
                    'GET /api/core/docs/': 'This documentation',
                },
            },
            'authentication': {
                'type': 'Bearer Token',
                'header': 'Authorization: Bearer <supabase_jwt_token>',
                'description': 'Most endpoints require Supabase JWT authentication',
            },
            'rate_limits': {
                'pdf_generation': '10 requests per 15 minutes per user',
                'preview_generation': '100 requests per 5 minutes per user',
                'api_general': '1000 requests per hour per user',
            },
            'enhanced_features': [
                'Advanced rate limiting with user-specific limits',
                'Comprehensive PDF generation analytics',
                'CV versioning and history tracking',
                'User preferences management',
                'Enhanced Django admin interface',
                'Background task processing for PDFs',
                'Detailed system health monitoring',
                'Advanced caching strategies',
            ],
        }
        
        return Response(api_docs)