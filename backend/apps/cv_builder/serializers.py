"""
Serializers for CV Builder app

Simplified serializers for Supabase-compatible JSON storage approach.
"""

from rest_framework import serializers
from .models import CVProfile, PDFGenerationLog, UserProfile


class CVProfileSerializer(serializers.ModelSerializer):
    """Serializer for CVProfile model with JSON content"""
    
    class Meta:
        model = CVProfile
        fields = ['id', 'user_id', 'cv_content', 'template_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class PDFGenerationLogSerializer(serializers.ModelSerializer):
    """Serializer for PDFGenerationLog model"""
    
    class Meta:
        model = PDFGenerationLog
        fields = ['id', 'user_id', 'template_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model"""
    
    class Meta:
        model = UserProfile
        fields = ['id', 'email', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


# Simplified data validation serializers for API endpoints
class CVDataSerializer(serializers.Serializer):
    """Serializer for CV data API requests"""
    cv_data = serializers.JSONField(required=False)
    visibility = serializers.JSONField(required=False)
    selected_template = serializers.CharField(max_length=50, required=False)


class PDFGenerationSerializer(serializers.Serializer):
    """Serializer for PDF generation requests"""
    cv_data = serializers.JSONField()
    visibility = serializers.JSONField(required=False, default=dict)
    template_name = serializers.CharField(max_length=50, default='classic-0')


class HTMLPDFGenerationSerializer(serializers.Serializer):
    """Serializer for HTML to PDF generation requests"""
    html_content = serializers.CharField()
    styles = serializers.CharField(required=False, default='')
    template_name = serializers.CharField(max_length=50, default='classic-0')
    cv_data = serializers.JSONField(required=False)