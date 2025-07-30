"""
Authentication URL patterns
"""

from django.urls import path
from . import views

app_name = 'authentication'

urlpatterns = [
    # Authentication endpoints
    path('verify/', views.VerifyTokenView.as_view(), name='verify-token'),
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
]