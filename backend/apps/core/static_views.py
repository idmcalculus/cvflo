"""
Custom static file serving views with proper MIME types
Ensures React assets are served with correct Content-Type headers
"""

import os
import mimetypes
from django.http import HttpResponse, Http404
from django.conf import settings
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_control
from django.views.decorators.csrf import csrf_exempt


@method_decorator(csrf_exempt, name='dispatch')
@method_decorator(cache_control(max_age=3600), name='dispatch')  # Cache for 1 hour
class StaticAssetView(View):
    """
    Serve static assets with proper MIME types
    Equivalent to Node.js express.static with MIME type detection
    """
    
    def get(self, request, path):
        """Serve static assets from public/assets/ with correct MIME types"""
        
        # Security: prevent directory traversal
        if '..' in path or path.startswith('/'):
            raise Http404("Invalid path")
        
        # Build full file path
        file_path = os.path.join(settings.CLIENT_BUILD_DIR, 'assets', path)
        
        # Check if file exists
        if not os.path.exists(file_path) or not os.path.isfile(file_path):
            raise Http404("File not found")
        
        # Get MIME type
        mime_type, _ = mimetypes.guess_type(file_path)
        if mime_type is None:
            # Set explicit MIME types for common file extensions
            ext = os.path.splitext(path)[1].lower()
            mime_types = {
                '.js': 'application/javascript',
                '.mjs': 'application/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
                '.ico': 'image/x-icon',
                '.woff': 'font/woff',
                '.woff2': 'font/woff2',
                '.ttf': 'font/ttf',
                '.eot': 'application/vnd.ms-fontobject',
                '.map': 'application/json',  # Source maps
            }
            mime_type = mime_types.get(ext, 'application/octet-stream')
        
        try:
            # Read and serve file
            with open(file_path, 'rb') as f:
                content = f.read()
            
            response = HttpResponse(content, content_type=mime_type)
            
            # Add caching headers for production
            if not settings.DEBUG:
                response['Cache-Control'] = 'public, max-age=31536000'  # 1 year
                response['Expires'] = 'Thu, 31 Dec 2037 23:55:55 GMT'
            
            return response
            
        except IOError:
            raise Http404("Could not read file")


@method_decorator(csrf_exempt, name='dispatch')  
class FaviconView(View):
    """Serve favicon.ico from public directory"""
    
    def get(self, request):
        """Serve favicon.ico"""
        favicon_path = os.path.join(settings.CLIENT_BUILD_DIR, 'favicon.ico')
        
        if os.path.exists(favicon_path):
            try:
                with open(favicon_path, 'rb') as f:
                    content = f.read()
                return HttpResponse(content, content_type='image/x-icon')
            except IOError:
                pass
        
        # Return empty 204 response if favicon not found
        return HttpResponse(status=204)