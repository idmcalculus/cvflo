"""
CV Builder URL patterns
Equivalent to the Node.js cvRoutes.ts
"""

from django.urls import path
from . import views

app_name = 'cv_builder'

urlpatterns = [
    # Simplified endpoints to match Supabase approach
    path('data/', views.CVDataView.as_view(), name='cv-data'),  # GET/POST/PUT/DELETE /api/cv/data
    path('templates/', views.TemplateListView.as_view(), name='templates'),
]