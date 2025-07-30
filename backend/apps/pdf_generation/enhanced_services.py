"""
Enhanced PDF Generation Services

These services provide advanced PDF generation capabilities that exceed
the Node.js Puppeteer implementation using WeasyPrint and Django features.
"""

import logging
import io
import time
import concurrent.futures
from typing import Dict, Any, List, Optional, Tuple
from django.template.loader import render_to_string
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration
import tempfile
import os
from pathlib import Path
import threading
from queue import Queue
import hashlib
import json

logger = logging.getLogger('cvflo')


class PDFGenerationPool:
    """
    PDF Generation Pool for concurrent processing
    Superior to the Node.js Puppeteer pool with better resource management
    """
    
    def __init__(self, pool_size: int = 3):
        self.pool_size = pool_size
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=pool_size)
        self.font_config = FontConfiguration()
        self.generation_count = 0
        self.active_generations = 0
        self._lock = threading.Lock()
        
        logger.info(f'PDF Generation Pool initialized with {pool_size} workers')
    
    def submit_generation(self, generation_func, *args, **kwargs):
        """Submit a PDF generation task to the pool"""
        with self._lock:
            self.active_generations += 1
            self.generation_count += 1
        
        future = self.executor.submit(self._wrapped_generation, generation_func, *args, **kwargs)
        return future
    
    def _wrapped_generation(self, generation_func, *args, **kwargs):
        """Wrapper for generation function with cleanup"""
        try:
            return generation_func(*args, **kwargs)
        finally:
            with self._lock:
                self.active_generations -= 1
    
    def get_stats(self) -> Dict[str, Any]:
        """Get pool statistics"""
        return {
            'pool_size': self.pool_size,
            'active_generations': self.active_generations,
            'total_generations': self.generation_count,
            'available_workers': self.pool_size - self.active_generations,
        }
    
    def shutdown(self):
        """Shutdown the generation pool"""
        self.executor.shutdown(wait=True)


# Global PDF generation pool
_pdf_pool = None

def get_pdf_pool() -> PDFGenerationPool:
    """Get or create the global PDF generation pool"""
    global _pdf_pool
    if _pdf_pool is None:
        pool_size = getattr(settings, 'PDF_GENERATION_POOL_SIZE', 3)
        _pdf_pool = PDFGenerationPool(pool_size)
    return _pdf_pool


class EnhancedCVPDFService:
    """
    Enhanced PDF service with features exceeding the Node.js implementation
    """
    
    def __init__(self):
        self.font_config = FontConfiguration()
        self.templates_dir = settings.PDF_GENERATION['TEMPLATES_DIR']
        self.cache_timeout = getattr(settings, 'PDF_CACHE_TIMEOUT', 3600)  # 1 hour
        
    def generate_pdf_async(self, cv_data: Dict[str, Any], visibility: Dict[str, bool], 
                          template_name: str = 'classic-0', user_id: str = None) -> concurrent.futures.Future:
        """
        Generate PDF asynchronously using the generation pool
        
        Args:
            cv_data: Dictionary containing CV data
            visibility: Dictionary containing section visibility settings
            template_name: Name of the template to use
            user_id: User ID for tracking
            
        Returns:
            Future: Future object for the PDF generation task
        """
        pool = get_pdf_pool()
        return pool.submit_generation(
            self._generate_pdf_sync, cv_data, visibility, template_name, user_id
        )
    
    def generate_pdf_batch(self, requests: List[Dict[str, Any]]) -> List[bytes]:
        """
        Generate multiple PDFs in parallel
        Feature not available in the Node.js implementation
        
        Args:
            requests: List of PDF generation requests
            
        Returns:
            List of generated PDF bytes
        """
        logger.info(f'Starting batch PDF generation for {len(requests)} requests')
        
        pool = get_pdf_pool()
        futures = []
        
        for request in requests:
            future = pool.submit_generation(
                self._generate_pdf_sync,
                request['cv_data'],
                request['visibility'],
                request.get('template_name', 'classic-0'),
                request.get('user_id')
            )
            futures.append(future)
        
        # Wait for all generations to complete
        results = []
        for future in concurrent.futures.as_completed(futures):
            try:
                result = future.result(timeout=60)  # 60 second timeout per PDF
                results.append(result)
            except Exception as e:
                logger.error(f'Batch PDF generation failed: {str(e)}')
                results.append(None)
        
        logger.info(f'Batch PDF generation completed: {len(results)} results')
        return results
    
    def generate_pdf_with_cache(self, cv_data: Dict[str, Any], visibility: Dict[str, bool], 
                               template_name: str = 'classic-0') -> Tuple[bytes, bool]:
        """
        Generate PDF with intelligent caching
        
        Args:
            cv_data: Dictionary containing CV data
            visibility: Dictionary containing section visibility settings  
            template_name: Name of the template to use
            
        Returns:
            Tuple of (pdf_bytes, was_cached)
        """
        # Create cache key based on content hash
        cache_key = self._generate_cache_key(cv_data, visibility, template_name)
        
        # Try to get from cache
        cached_pdf = cache.get(cache_key)
        if cached_pdf:
            logger.info(f'PDF served from cache: {cache_key[:8]}...')
            return cached_pdf, True
        
        # Generate new PDF
        start_time = time.time()
        pdf_data = self._generate_pdf_sync(cv_data, visibility, template_name)
        generation_time = time.time() - start_time
        
        # Cache the PDF
        cache.set(cache_key, pdf_data, self.cache_timeout)
        
        logger.info(f'PDF generated and cached in {generation_time:.2f}s: {cache_key[:8]}...')
        return pdf_data, False
    
    def _generate_pdf_sync(self, cv_data: Dict[str, Any], visibility: Dict[str, bool], 
                          template_name: str, user_id: str = None) -> bytes:
        """
        Synchronous PDF generation with enhanced error handling and metrics
        """
        start_time = time.time()
        
        try:
            # Track generation start
            if user_id:
                from apps.core.middleware.rate_limiting import PDFGenerationTracker
                client_ip = None  # Would be passed from request in real usage
            
            # Generate HTML with enhanced template context
            html_content = self._generate_enhanced_html(cv_data, visibility, template_name)
            
            # Convert to PDF with optimized settings
            pdf_data = self._html_to_pdf_optimized(html_content, template_name)
            
            generation_time = time.time() - start_time
            
            # Track successful generation
            if user_id:
                PDFGenerationTracker.track_generation(
                    user_id=user_id,
                    template_name=template_name,
                    file_size=len(pdf_data),
                    generation_time=generation_time
                )
            
            logger.info(f'PDF generated successfully in {generation_time:.2f}s, '
                       f'size: {len(pdf_data)} bytes')
            
            return pdf_data
            
        except Exception as e:
            generation_time = time.time() - start_time
            
            # Track failed generation
            if user_id:
                self._track_failed_generation(user_id, template_name, str(e), generation_time)
            
            logger.error(f'PDF generation failed after {generation_time:.2f}s: {str(e)}')
            raise
    
    def _generate_enhanced_html(self, cv_data: Dict[str, Any], visibility: Dict[str, bool], 
                               template_name: str) -> str:
        """
        Generate HTML with enhanced context and preprocessing
        """
        # Enhanced context with computed fields
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
            # Enhanced computed fields
            'has_social_links': self._has_social_links(cv_data.get('personal_info', {})),
            'skills_by_category': self._group_skills_by_category(cv_data.get('skills', [])),
            'total_experience_years': self._calculate_experience_years(cv_data.get('work_experience', [])),
            'generation_timestamp': timezone.now(),
        }
        
        # Apply content filters and enhancements
        context = self._apply_content_filters(context, template_name)
        
        # Render template
        template_path = f'cv/{template_name}.html'
        html_content = render_to_string(template_path, context)
        
        return html_content
    
    def _html_to_pdf_optimized(self, html_content: str, template_name: str) -> bytes:
        """
        Convert HTML to PDF with optimized settings and performance
        """
        try:
            # Get template-specific configuration
            template_config = self._get_template_config(template_name)
            
            # Create optimized temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False) as tmp_file:
                tmp_file.write(html_content)
                tmp_file_path = tmp_file.name
            
            try:
                # Create HTML object with optimized settings
                html_doc = HTML(
                    filename=tmp_file_path, 
                    font_config=self.font_config,
                    media_type='print'  # Optimize for print media
                )
                
                # Get optimized CSS
                css_objects = self._get_optimized_css(template_name)
                
                # Generate PDF with enhanced settings
                pdf_buffer = io.BytesIO()
                html_doc.write_pdf(
                    pdf_buffer,
                    stylesheets=css_objects,
                    font_config=self.font_config,
                    presentational_hints=True,
                    optimize_images=True,
                    # Enhanced PDF optimization
                    pdf_version='1.7',
                    pdf_forms=False,
                    pdf_identifier=False,
                    pdf_variant='pdf/a-1b' if template_config.get('archival', False) else None,
                )
                
                return pdf_buffer.getvalue()
                
            finally:
                # Clean up temporary file
                os.unlink(tmp_file_path)
                
        except Exception as e:
            logger.error(f'Optimized PDF generation failed: {str(e)}')
            raise
    
    def _get_optimized_css(self, template_name: str) -> List[CSS]:
        """Get optimized CSS objects for template"""
        css_objects = []
        
        try:
            # Base CSS for all templates
            base_css = self._get_base_pdf_css()
            if base_css:
                css_objects.append(CSS(string=base_css, font_config=self.font_config))
            
            # Template-specific CSS
            template_css = self._get_template_css(template_name)
            if template_css:
                css_objects.append(CSS(string=template_css, font_config=self.font_config))
            
            # Print-optimized CSS
            print_css = self._get_print_optimization_css(template_name)
            if print_css:
                css_objects.append(CSS(string=print_css, font_config=self.font_config))
            
        except Exception as e:
            logger.warning(f'Failed to load optimized CSS: {str(e)}')
        
        return css_objects
    
    def _get_base_pdf_css(self) -> str:
        """Get base CSS optimizations for all PDFs"""
        return """
        /* Enhanced PDF base styles */
        * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
        }
        
        @page {
            margin: 0.5in;
            size: A4;
            orphans: 3;
            widows: 3;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        /* Print optimizations */
        .no-print { display: none !important; }
        .page-break { page-break-before: always; }
        .avoid-break { page-break-inside: avoid; }
        
        /* Enhanced typography */
        h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid;
            margin-top: 1.2em;
            margin-bottom: 0.6em;
        }
        
        p, li {
            orphans: 2;
            widows: 2;
        }
        
        /* Link styling for print */
        a {
            text-decoration: none;
            color: inherit;
        }
        
        a[href]:after {
            content: " (" attr(href) ")";
            font-size: 0.8em;
            color: #666;
        }
        
        a[href^="mailto:"]:after,
        a[href^="tel:"]:after {
            content: "";
        }
        """
    
    def _get_print_optimization_css(self, template_name: str) -> str:
        """Get print-specific CSS optimizations"""
        template_config = self._get_template_config(template_name)
        
        css = """
        /* Template-specific print optimizations */
        .container { width: 100% !important; max-width: none !important; }
        .shadow, .shadow-lg, .shadow-md { box-shadow: none !important; }
        .rounded, .rounded-lg { border-radius: 0 !important; }
        """
        
        # Add template-specific optimizations
        if template_config.get('has_columns'):
            css += """
            .column-layout {
                column-gap: 0.8in;
                column-rule: 1px solid #eee;
            }
            """
        
        return css
    
    def _generate_cache_key(self, cv_data: Dict[str, Any], visibility: Dict[str, bool], 
                           template_name: str) -> str:
        """Generate cache key for PDF"""
        # Create deterministic hash of content
        content_str = json.dumps({
            'cv_data': cv_data,
            'visibility': visibility,
            'template_name': template_name,
        }, sort_keys=True)
        
        hash_obj = hashlib.sha256(content_str.encode())
        return f"pdf_cache:{hash_obj.hexdigest()}"
    
    def _has_social_links(self, personal_info: Dict[str, Any]) -> bool:
        """Check if user has any social media links"""
        social_fields = ['linkedin', 'github', 'x', 'facebook', 'instagram', 'youtube', 'medium']
        return any(personal_info.get(field) for field in social_fields)
    
    def _group_skills_by_category(self, skills: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group skills by category"""
        grouped = {}
        for skill in skills:
            category = skill.get('category', 'Other')
            if category not in grouped:
                grouped[category] = []
            grouped[category].append(skill)
        return grouped
    
    def _calculate_experience_years(self, work_experience: List[Dict[str, Any]]) -> float:
        """Calculate total years of experience"""
        # This is a simplified calculation
        # In a real implementation, you'd parse dates properly
        return len(work_experience) * 1.5  # Rough estimate
    
    def _apply_content_filters(self, context: Dict[str, Any], template_name: str) -> Dict[str, Any]:
        """Apply content filters based on template requirements"""
        # Template-specific content adjustments
        template_config = self._get_template_config(template_name)
        
        if template_config.get('academic', False):
            # Academic templates might need different formatting
            context['academic_mode'] = True
        
        return context
    
    def _get_template_config(self, template_name: str) -> Dict[str, Any]:
        """Get configuration for a specific template"""
        return settings.CV_TEMPLATES.get(template_name, settings.CV_TEMPLATES['classic-0'])
    
    def _get_template_css(self, template_name: str) -> str:
        """Get CSS content for a specific template"""
        try:
            css_path = Path(settings.BASE_DIR) / 'static' / 'css' / f'{template_name}.css'
            if css_path.exists():
                return css_path.read_text(encoding='utf-8')
            return ""
        except Exception as e:
            logger.warning(f'Failed to load CSS for template {template_name}: {str(e)}')
            return ""
    
    def _track_failed_generation(self, user_id: str, template_name: str, 
                                error_message: str, generation_time: float):
        """Track failed PDF generation"""
        try:
            from apps.cv_builder.models import PDFGenerationLog
            from django.contrib.auth.models import User
            
            user = User.objects.get(id=user_id)
            PDFGenerationLog.objects.create(
                user=user,
                template_name=template_name,
                generation_time=generation_time,
                status='failed',
                error_message=error_message[:1000]  # Truncate long error messages
            )
        except Exception as e:
            logger.error(f'Failed to track failed generation: {str(e)}')


class PDFAnalyticsService:
    """
    Service for PDF generation analytics and insights
    Django-specific enhancement not available in Node.js version
    """
    
    @staticmethod
    def get_system_stats() -> Dict[str, Any]:
        """Get system-wide PDF generation statistics"""
        try:
            from apps.cv_builder.models import PDFGenerationLog
            from django.db.models import Count, Avg, Sum
            from django.utils import timezone
            from datetime import timedelta
            
            now = timezone.now()
            last_30_days = now - timedelta(days=30)
            
            stats = PDFGenerationLog.objects.filter(created_at__gte=last_30_days).aggregate(
                total_generations=Count('id'),
                successful_generations=Count('id', filter=models.Q(status='success')),
                avg_generation_time=Avg('generation_time'),
                total_file_size=Sum('file_size'),
            )
            
            # Template popularity
            template_stats = PDFGenerationLog.objects.filter(
                created_at__gte=last_30_days
            ).values('template_name').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Success rate
            success_rate = 0
            if stats['total_generations']:
                success_rate = (stats['successful_generations'] / stats['total_generations']) * 100
            
            return {
                'period': '30 days',
                'total_generations': stats['total_generations'] or 0,
                'successful_generations': stats['successful_generations'] or 0,
                'success_rate': round(success_rate, 2),
                'avg_generation_time': round(stats['avg_generation_time'] or 0, 2),
                'total_file_size_mb': round((stats['total_file_size'] or 0) / (1024 * 1024), 2),
                'popular_templates': list(template_stats[:5]),
                **get_pdf_pool().get_stats()
            }
            
        except Exception as e:
            logger.error(f'Failed to get system stats: {str(e)}')
            return {}
    
    @staticmethod
    def get_user_insights(user_id: str) -> Dict[str, Any]:
        """Get detailed insights for a specific user"""
        try:
            from apps.cv_builder.models import PDFGenerationLog
            from django.contrib.auth.models import User
            
            user = User.objects.get(id=user_id)
            logs = PDFGenerationLog.objects.filter(user=user)
            
            if not logs.exists():
                return {'message': 'No PDF generation history found'}
            
            # Basic stats
            total_pdfs = logs.count()
            successful_pdfs = logs.filter(status='success').count()
            avg_generation_time = logs.aggregate(avg_time=models.Avg('generation_time'))['avg_time']
            
            # Template preferences
            template_usage = logs.values('template_name').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Recent activity
            recent_activity = logs.order_by('-created_at')[:10].values(
                'template_name', 'status', 'generation_time', 'created_at'
            )
            
            return {
                'user_email': user.email,
                'total_pdfs_generated': total_pdfs,
                'successful_generations': successful_pdfs,
                'success_rate': round((successful_pdfs / total_pdfs) * 100, 2),
                'avg_generation_time': round(avg_generation_time or 0, 2),
                'favorite_template': template_usage[0]['template_name'] if template_usage else None,
                'template_usage': list(template_usage),
                'recent_activity': list(recent_activity),
            }
            
        except Exception as e:
            logger.error(f'Failed to get user insights: {str(e)}')
            return {'error': str(e)}