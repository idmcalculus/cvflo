"""
Security middleware equivalent to Node.js Helmet and security middleware
"""

import logging
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings

logger = logging.getLogger('cvflo')

class SecurityMiddleware(MiddlewareMixin):
    """
    Security middleware that adds security headers and validates requests
    Equivalent to the Node.js Helmet middleware functionality
    """
    
    def process_response(self, request, response):
        """Add security headers to all responses"""
        
        # Content Security Policy - Allow Supabase and external resources
        supabase_url = getattr(settings, 'SUPABASE_URL', '')
        supabase_domain = supabase_url.replace('https://', '').replace('http://', '') if supabase_url else ''
        
        response['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            f"connect-src 'self' https://{supabase_domain} https://*.supabase.co wss://{supabase_domain} wss://*.supabase.co;"
        )
        
        # Additional security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
        
        # Only add HSTS in production
        if not settings.DEBUG:
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        return response
    
    def process_request(self, request):
        """Process incoming requests for security validation"""
        
        # Log request for security monitoring
        logger.info(f'Request: {request.method} {request.path}', extra={
            'ip': self.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'method': request.method,
            'path': request.path,
        })
        
        # Rate limiting would be handled by django-ratelimit decorators
        # or a dedicated rate limiting middleware
        
        return None
    
    def get_client_ip(self, request):
        """Get client IP address from request headers"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip