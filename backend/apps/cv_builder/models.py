"""
Django models for CV Builder app

These models are equivalent to the TypeScript interfaces defined in the Node.js server.
They provide the database schema for storing CV data with proper relationships and validation.
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator, URLValidator
import uuid

# Use Django's built-in JSONField (works with both SQLite and PostgreSQL)
try:
    from django.db.models import JSONField
except ImportError:
    # Fallback for older Django versions
    from django.contrib.postgres.fields import JSONField


class CVProfile(models.Model):
    """
    Main CV profile model that acts as a container for all CV data
    Equivalent to the CVData interface in TypeScript
    Maps to Supabase cv_data table
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.IntegerField()  # Reference to Django auth.User.id (integer)
    cv_content = models.JSONField(default=dict)  # Store all CV data as JSON like Supabase
    template_name = models.CharField(max_length=50, default='classic-0')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cv_data'  # Use Supabase table name
        verbose_name = 'CV Profile'
        verbose_name_plural = 'CV Profiles'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"CV Profile {self.id}"


# Additional models to match Supabase schema

class PDFGenerationLog(models.Model):
    """
    PDF Generation Log model to match Supabase pdf_generations table
    Maps to Supabase pdf_generations table
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.IntegerField()  # Reference to Django auth.User.id (integer)
    template_name = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'pdf_generations'  # Use Supabase table name
        verbose_name = 'PDF Generation Log'
        verbose_name_plural = 'PDF Generation Logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"PDF generation {self.id}"


class UserProfile(models.Model):
    """
    User Profile model to match Supabase user_profiles table
    Maps to Supabase user_profiles table
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'  # Use Supabase table name
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"User Profile {self.email or self.id}"