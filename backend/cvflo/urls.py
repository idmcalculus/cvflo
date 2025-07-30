"""
CVFlo URL Configuration

This file defines the main URL patterns for the CVFlo Django application,
replicating the routing structure of the Node.js/Express server.
"""

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from apps.core.spa_views import SPAView, HealthCheckView
from apps.core.static_views import StaticAssetView, FaviconView
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import logging

logger = logging.getLogger('cvflo')

def health_check(request):
    """Health check endpoint equivalent to Node.js /health"""
    import django
    import sys
    from django.db import connection
    
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        health_data = {
            'status': 'healthy',
            'timestamp': str(timezone.now()) if 'timezone' in globals() else None,
            'version': '1.0.0',
            'django_version': django.VERSION,
            'python_version': sys.version,
            'database': 'connected',
        }
        
        logger.info('Health check requested', extra={'status': 'healthy'})
        return JsonResponse(health_data)
    except Exception as e:
        logger.error(f'Health check failed: {str(e)}')
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=503)

# Main URL patterns
urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # Health check (equivalent to Node.js /health)
    path('health/', health_check, name='health_check'),
    
    # Static assets with proper MIME types (BEFORE other patterns)
    path('assets/<path:path>', StaticAssetView.as_view(), name='static_assets'),
    path('favicon.ico', FaviconView.as_view(), name='favicon'),
    
    # API routes (equivalent to Node.js /api/*)
    path('api/', include('apps.core.urls')),
    path('api/cv/', include('apps.cv_builder.urls')),
    # path('api/pdf/', include('apps.pdf_generation.urls')),  # equivalent to /api/generate-pdf - WeasyPrint dependencies needed
    path('api/auth/', include('apps.authentication.urls')),
    
]

# Serve static and media files in development (MUST be before SPA fallback)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    # Note: /assets/ served by StaticAssetView for proper MIME types

# SPA fallback - serve React app for all non-API routes (MUST be last)
urlpatterns += [
    re_path(r'^(?!api/)(?!admin/)(?!static/)(?!media/)(?!health/)(?!assets/).*$', SPAView.as_view(), name='spa'),
]

# Add Django Debug Toolbar if available (development only)
if settings.DEBUG and 'debug_toolbar' in settings.INSTALLED_APPS:
    try:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass

# Custom error handlers (equivalent to Node.js error middleware)
handler404 = 'apps.core.views.custom_404'
handler500 = 'apps.core.views.custom_500'