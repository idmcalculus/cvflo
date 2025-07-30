"""
Django Admin configuration for PDF Generation app
"""

from django.contrib import admin
from django.utils.html import format_html


# Since PDF Generation is primarily a service app, 
# we might want to add some administrative monitoring models here in the future
# For example: PDFGenerationLog, TemplateUsageStats, etc.

class PDFGenerationLogAdmin(admin.ModelAdmin):
    """
    Future admin for PDF generation logging
    This could track PDF generation requests, success/failure rates, etc.
    """
    pass

# For now, we'll register the admin site customization
admin.site.site_header = 'CVFlo Administration'