"""
PDF Generation URL patterns
Equivalent to the Node.js pdfRoutes.ts
"""

from django.urls import path
from . import views

app_name = 'pdf_generation'

urlpatterns = [
    # Main PDF generation endpoints (equivalent to Node.js routes)
    path('generate-pdf/', views.GeneratePDFView.as_view(), name='generate-pdf'),
    path('generate-preview/', views.GeneratePreviewView.as_view(), name='generate-preview'),
    path('generate-pdf-from-html/', views.GeneratePDFFromHTMLView.as_view(), name='generate-pdf-from-html'),
    
    # Template management
    path('templates/', views.TemplateListView.as_view(), name='templates'),
    
    # Health check for PDF service
    path('health/', views.PDFHealthView.as_view(), name='pdf-health'),
]