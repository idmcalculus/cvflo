"""
Enhanced Rate Limiting Middleware

This middleware provides advanced rate limiting capabilities equivalent to
and exceeding the Node.js server implementation.
"""

import logging
import time
from typing import Dict, Optional, Tuple
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
import hashlib

logger = logging.getLogger('cvflo')


class RateLimitExceeded(Exception):
    """Exception raised when rate limit is exceeded"""
    pass


class EnhancedRateLimitMiddleware(MiddlewareMixin):
    """
    Enhanced rate limiting middleware with user-specific and endpoint-specific limits
    Equivalent to the Node.js rate limiting but with Django-specific optimizations
    """
    
    def __init__(self, get_response=None):
        super().__init__(get_response)
        self.rate_limits = getattr(settings, 'ENHANCED_RATE_LIMITS', {
            'default': {'requests': 100, 'window': 3600},  # 100 per hour
            'pdf_generation': {'requests': 10, 'window': 900},  # 10 per 15 minutes
            'preview_generation': {'requests': 100, 'window': 300},  # 100 per 5 minutes
            'api_general': {'requests': 1000, 'window': 3600},  # 1000 per hour
        })
    
    def process_request(self, request):
        """Process incoming request for rate limiting"""
        try:
            # Skip rate limiting for certain paths
            if self._should_skip_rate_limiting(request):
                return None
            
            # Determine rate limit category
            limit_category = self._get_rate_limit_category(request)
            
            # Get rate limit configuration
            rate_limit = self.rate_limits.get(limit_category, self.rate_limits['default'])
            
            # Check rate limit
            is_allowed, remaining, reset_time = self._check_rate_limit(
                request, limit_category, rate_limit
            )
            
            if not is_allowed:
                logger.warning(f'Rate limit exceeded for {self._get_client_identifier(request)} '
                              f'on {request.path}')
                
                return JsonResponse({
                    'error': 'Rate limit exceeded',
                    'limit': rate_limit['requests'],
                    'window': rate_limit['window'],
                    'remaining': 0,
                    'reset_time': reset_time,
                    'retry_after': reset_time - int(time.time())
                }, status=429)
            
            # Add rate limit headers to the request for use in response
            request.rate_limit_info = {
                'limit': rate_limit['requests'],
                'remaining': remaining,
                'reset_time': reset_time,
                'window': rate_limit['window']
            }
            
            return None
            
        except Exception as e:
            logger.error(f'Rate limiting error: {str(e)}')
            # Don't block requests if rate limiting fails
            return None
    
    def process_response(self, request, response):
        """Add rate limit headers to response"""
        try:
            rate_limit_info = getattr(request, 'rate_limit_info', None)
            if rate_limit_info:
                response['X-RateLimit-Limit'] = str(rate_limit_info['limit'])
                response['X-RateLimit-Remaining'] = str(rate_limit_info['remaining'])
                response['X-RateLimit-Reset'] = str(rate_limit_info['reset_time'])
                response['X-RateLimit-Window'] = str(rate_limit_info['window'])
            
            return response
            
        except Exception as e:
            logger.error(f'Error adding rate limit headers: {str(e)}')
            return response
    
    def _should_skip_rate_limiting(self, request) -> bool:
        """Determine if rate limiting should be skipped for this request"""
        skip_paths = ['/admin/', '/health/', '/static/', '/media/']
        return any(request.path.startswith(path) for path in skip_paths)
    
    def _get_rate_limit_category(self, request) -> str:
        """Determine the appropriate rate limit category for the request"""
        path = request.path
        method = request.method
        
        # PDF generation endpoints
        if '/api/pdf/generate-pdf' in path or '/api/pdf/generate-pdf-from-html' in path:
            return 'pdf_generation'
        
        # Preview generation
        if '/api/pdf/generate-preview' in path:
            return 'preview_generation'
        
        # General API endpoints
        if path.startswith('/api/'):
            return 'api_general'
        
        return 'default'
    
    def _get_client_identifier(self, request) -> str:
        """Get unique identifier for the client (user-based or IP-based)"""
        # Use authenticated user if available
        if hasattr(request, 'user') and request.user.is_authenticated:
            return f"user:{request.user.id}"
        
        # Fall back to IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'unknown')
        
        return f"ip:{ip}"
    
    def _check_rate_limit(self, request, category: str, rate_limit: Dict) -> Tuple[bool, int, int]:
        """
        Check if request is within rate limit
        
        Returns:
            Tuple of (is_allowed, remaining_requests, reset_time)
        """
        client_id = self._get_client_identifier(request)
        window = rate_limit['window']
        limit = rate_limit['requests']
        
        # Create cache key
        current_window = int(time.time()) // window
        cache_key = f"rate_limit:{category}:{client_id}:{current_window}"
        
        # Get current count
        current_count = cache.get(cache_key, 0)
        
        if current_count >= limit:
            # Rate limit exceeded
            reset_time = (current_window + 1) * window
            return False, 0, reset_time
        
        # Increment counter
        cache.set(cache_key, current_count + 1, window)
        
        # Calculate remaining and reset time
        remaining = limit - (current_count + 1)
        reset_time = (current_window + 1) * window
        
        return True, remaining, reset_time


class PDFGenerationTracker:
    """
    Track PDF generation for analytics and enhanced rate limiting
    Equivalent to Node.js PDF generation tracking
    """
    
    @staticmethod
    def track_generation(user_id: str, template_name: str, file_size: int = 0,
                        generation_time: float = 0.0, client_ip: str = None):
        """Track PDF generation event"""
        try:
            from apps.cv_builder.models import PDFGenerationLog
            
            PDFGenerationLog.objects.create(
                user_id=user_id,
                template_name=template_name,
                file_size=file_size,
                generation_time=generation_time,
                client_ip=client_ip or 'unknown'
            )
            
            # Update cache-based counters for quick access
            cache_key = f"pdf_count:user:{user_id}:daily"
            current_count = cache.get(cache_key, 0)
            cache.set(cache_key, current_count + 1, 86400)  # 24 hours
            
            logger.info(f'PDF generation tracked: user={user_id}, template={template_name}, '
                       f'size={file_size}, time={generation_time:.2f}s')
            
        except Exception as e:
            logger.error(f'Failed to track PDF generation: {str(e)}')
    
    @staticmethod
    def get_user_generation_stats(user_id: str) -> Dict:
        """Get PDF generation statistics for a user"""
        try:
            from apps.cv_builder.models import PDFGenerationLog
            from django.utils import timezone
            from datetime import timedelta
            
            now = timezone.now()
            today = now.date()
            week_ago = now - timedelta(days=7)
            month_ago = now - timedelta(days=30)
            
            stats = {
                'total_generated': PDFGenerationLog.objects.filter(user_id=user_id).count(),
                'today': PDFGenerationLog.objects.filter(
                    user_id=user_id, 
                    created_at__date=today
                ).count(),
                'this_week': PDFGenerationLog.objects.filter(
                    user_id=user_id, 
                    created_at__gte=week_ago
                ).count(),
                'this_month': PDFGenerationLog.objects.filter(
                    user_id=user_id, 
                    created_at__gte=month_ago
                ).count(),
            }
            
            return stats
            
        except Exception as e:
            logger.error(f'Failed to get generation stats: {str(e)}')
            return {}


class APIMetricsMiddleware(MiddlewareMixin):
    """
    Middleware to collect API usage metrics
    Provides insights beyond what the Node.js server offers
    """
    
    def process_request(self, request):
        """Start timing the request"""
        request._start_time = time.time()
        return None
    
    def process_response(self, request, response):
        """Log API metrics"""
        try:
            if hasattr(request, '_start_time'):
                duration = time.time() - request._start_time
                
                # Log API call metrics
                logger.info('API call metrics', extra={
                    'path': request.path,
                    'method': request.method,
                    'status_code': response.status_code,
                    'duration_ms': round(duration * 1000, 2),
                    'user_id': getattr(request.user, 'id', None) if hasattr(request, 'user') else None,
                    'client_ip': self._get_client_ip(request),
                    'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                })
                
                # Cache API usage statistics
                self._update_api_stats(request, response, duration)
            
            return response
            
        except Exception as e:
            logger.error(f'Error in API metrics middleware: {str(e)}')
            return response
    
    def _get_client_ip(self, request) -> str:
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')
    
    def _update_api_stats(self, request, response, duration):
        """Update cached API statistics"""
        try:
            # Update endpoint usage counter
            endpoint_key = f"api_stats:endpoint:{request.path}:{request.method}"
            current_count = cache.get(endpoint_key, 0)
            cache.set(endpoint_key, current_count + 1, 86400)  # 24 hours
            
            # Update response time statistics
            duration_key = f"api_stats:duration:{request.path}:{request.method}"
            durations = cache.get(duration_key, [])
            durations.append(duration)
            # Keep only last 100 requests for averaging
            if len(durations) > 100:
                durations = durations[-100:]
            cache.set(duration_key, durations, 86400)
            
        except Exception as e:
            logger.error(f'Failed to update API stats: {str(e)}')