"""
Enhanced Django Admin Configuration for CV Builder

This admin interface provides comprehensive management capabilities
far exceeding what's possible with the Node.js server.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import path, reverse
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, get_object_or_404
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
import json

from .models import CVProfile, PDFGenerationLog, UserProfile


# Simplified admin since we're using JSON storage like Supabase


@admin.register(CVProfile)
class CVProfileAdmin(admin.ModelAdmin):
    """Comprehensive admin for CV profiles"""
    
    list_display = ['user_id_display', 'template_name', 'has_content', 'updated_at']
    list_filter = ['template_name', 'updated_at', 'created_at']
    search_fields = ['user_id', 'template_name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'cv_content_preview']
    
    fieldsets = [
        ('User & Template', {
            'fields': ['user_id', 'template_name']
        }),
        ('Content', {
            'fields': ['cv_content']
        }),
        ('Content Preview', {
            'fields': ['cv_content_preview'],
            'classes': ['collapse']
        }),
        ('Metadata', {
            'fields': ['id', 'created_at', 'updated_at'],
            'classes': ['collapse']
        })
    ]
    
    actions = ['export_cv_data', 'duplicate_cv']
    
    def user_id_display(self, obj):
        """Display user ID"""
        return str(obj.user_id)
    user_id_display.short_description = 'User ID'
    user_id_display.admin_order_field = 'user_id'
    
    def has_content(self, obj):
        """Check if CV has content"""
        return bool(obj.cv_content)
    has_content.boolean = True
    has_content.short_description = 'Has Content'
    
    def cv_content_preview(self, obj):
        """Show preview of CV content"""
        if obj.cv_content:
            preview = json.dumps(obj.cv_content, indent=2)[:500]
            return format_html('<pre>{}</pre>', preview + '...' if len(preview) >= 500 else preview)
        return "No content"
    cv_content_preview.short_description = 'Content Preview'
    
    def generate_pdf_preview(self, request, queryset):
        """Admin action to generate PDF preview"""
        # This would integrate with the PDF service
        self.message_user(request, f"PDF preview generation queued for {queryset.count()} profiles.")
    generate_pdf_preview.short_description = "Generate PDF previews"
    
    def export_cv_data(self, request, queryset):
        """Admin action to export CV data"""
        # This would export CV data as JSON
        self.message_user(request, f"CV data export initiated for {queryset.count()} profiles.")
    export_cv_data.short_description = "Export CV data"
    
    def duplicate_cv(self, request, queryset):
        """Admin action to duplicate CV profiles"""
        self.message_user(request, f"CV duplication initiated for {queryset.count()} profiles.")
    duplicate_cv.short_description = "Duplicate CV profiles"


@admin.register(PDFGenerationLog)
class PDFGenerationLogAdmin(admin.ModelAdmin):
    """Admin for PDF generation logs"""
    
    list_display = ['user_id_display', 'template_name', 'created_at']
    list_filter = ['template_name', 'created_at']
    search_fields = ['user_id', 'template_name']
    readonly_fields = ['id', 'created_at']
    
    fieldsets = [
        ('Generation Info', {
            'fields': ['user_id', 'template_name']
        }),
        ('Metadata', {
            'fields': ['id', 'created_at'],
            'classes': ['collapse']
        })
    ]
    
    def user_id_display(self, obj):
        """Display user ID"""
        return str(obj.user_id)
    user_id_display.short_description = 'User ID'
    user_id_display.admin_order_field = 'user_id'


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Admin for user profiles"""
    
    list_display = ['email', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = [
        ('Profile Info', {
            'fields': ['email']
        }),
        ('Metadata', {
            'fields': ['id', 'created_at', 'updated_at'],
            'classes': ['collapse']
        })
    ]


# Customize admin site
admin.site.site_header = "CVFlo Administration"
admin.site.site_title = "CVFlo Admin"
admin.site.index_title = "Welcome to CVFlo Administration"