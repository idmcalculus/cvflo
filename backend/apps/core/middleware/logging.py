"""
Logging middleware for request/response logging
Equivalent to Node.js Winston logging functionality
"""

import logging
import time
import json
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('cvflo')

class LoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log requests and responses with timing information
    Equivalent to Express.js logging middleware
    """
    
    def process_request(self, request):
        """Log incoming request and start timing"""
        request._start_time = time.time()
        
        # Don't log health checks and static files in production
        if self.should_skip_logging(request.path):
            return None
        
        logger.info(f'Request started: {request.method} {request.path}', extra={
            'method': request.method,
            'path': request.path,
            'query_params': dict(request.GET),
            'ip': self.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'user_id': getattr(request.user, 'id', None) if hasattr(request, 'user') else None,
        })
        
        return None
    
    def process_response(self, request, response):
        """Log response with timing information"""
        
        if self.should_skip_logging(request.path):
            return response
        
        # Calculate request duration
        duration = 0
        if hasattr(request, '_start_time'):
            duration = time.time() - request._start_time
        
        # Determine log level based on status code
        log_level = logging.INFO
        if response.status_code >= 400:
            log_level = logging.WARNING
        if response.status_code >= 500:
            log_level = logging.ERROR
        
        logger.log(log_level, f'Request completed: {request.method} {request.path} - {response.status_code}', extra={
            'method': request.method,
            'path': request.path,
            'status_code': response.status_code,
            'duration_ms': round(duration * 1000, 2),
            'content_length': len(response.content) if hasattr(response, 'content') else 0,
            'ip': self.get_client_ip(request),
            'user_id': getattr(request.user, 'id', None) if hasattr(request, 'user') else None,
        })
        
        return response
    
    def process_exception(self, request, exception):
        """Log exceptions that occur during request processing"""
        
        duration = 0
        if hasattr(request, '_start_time'):
            duration = time.time() - request._start_time
        
        logger.error(f'Request exception: {request.method} {request.path} - {str(exception)}', extra={
            'method': request.method,
            'path': request.path,
            'exception': str(exception),
            'exception_type': type(exception).__name__,
            'duration_ms': round(duration * 1000, 2),
            'ip': self.get_client_ip(request),
            'user_id': getattr(request.user, 'id', None) if hasattr(request, 'user') else None,
        })
        
        return None
    
    def should_skip_logging(self, path):
        """Determine if we should skip logging for this path"""
        skip_paths = [
            '/health/',
            '/static/',
            '/media/',
            '/favicon.ico',
            '/admin/jsi18n/',
        ]
        
        return any(path.startswith(skip_path) for skip_path in skip_paths)
    
    def get_client_ip(self, request):
        """Get client IP address from request headers"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip