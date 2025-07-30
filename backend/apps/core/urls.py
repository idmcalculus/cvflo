"""
Core URL patterns for CVFlo

These URLs provide system-level endpoints and core functionality.
"""

from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    # System health and monitoring
    path('health/', views.SystemHealthView.as_view(), name='system-health'),
    path('metrics/', views.SystemMetricsView.as_view(), name='system-metrics'),
    
    # User analytics
    path('user-analytics/', views.UserAnalyticsView.as_view(), name='user-analytics'),
    
    # API documentation
    path('docs/', views.APIDocumentationView.as_view(), name='api-docs'),
]