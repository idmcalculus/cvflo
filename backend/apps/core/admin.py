"""
Django Admin configuration for Core app
"""

from django.contrib import admin

# Core app primarily contains middleware and utilities,
# so there might not be many models to register here.
# But we can customize the admin site further.

# Additional admin site customizations
admin.site.site_url = '/api/'  # Link to API root
admin.site.index_template = 'admin/custom_index.html'  # Custom admin index if needed