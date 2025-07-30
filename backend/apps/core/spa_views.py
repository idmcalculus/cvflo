"""
SPA (Single Page Application) views for serving the React client
Equivalent to the Node.js express.static + fallback middleware
"""

import os
from django.http import HttpResponse, Http404
from django.conf import settings
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt


@method_decorator(csrf_exempt, name='dispatch')
class SPAView(View):
    """
    Serve the React SPA index.html for client-side routing
    Equivalent to the Node.js fallback middleware in app.ts
    """
    
    def get(self, request, *args, **kwargs):
        """Serve index.html for all non-API routes"""
        index_path = os.path.join(settings.CLIENT_BUILD_DIR, 'index.html')
        
        try:
            with open(index_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return HttpResponse(content, content_type='text/html')
        except FileNotFoundError:
            # If build doesn't exist, show helpful message
            return HttpResponse(
                """
                <html>
                <head><title>CVFlo - Build Required</title></head>
                <body style="font-family: Arial, sans-serif; padding: 50px; text-align: center;">
                    <h1>🚧 Client Build Required</h1>
                    <p>The React client hasn't been built yet.</p>
                    <p>Run: <code>python manage.py build_client</code></p>
                    <p>Or: <code>python manage.py dev_full</code> for full development setup</p>
                    <hr>
                    <p><strong>API is available at:</strong> <a href="/api/">/api/</a></p>
                    <p><strong>Admin interface:</strong> <a href="/admin/">/admin/</a></p>
                </body>
                </html>
                """,
                content_type='text/html',
                status=503
            )
        except Exception as e:
            raise Http404(f"Error serving SPA: {str(e)}")


class HealthCheckView(View):
    """Simple health check endpoint"""
    
    def get(self, request):
        return HttpResponse("OK", content_type='text/plain')