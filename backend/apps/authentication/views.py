"""
Views for Authentication app

These views provide authentication-related endpoints for Supabase integration.
"""

import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import logout
from .backends import SupabaseService
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger('cvflo')


class VerifyTokenView(APIView):
    """
    Verify Supabase JWT token
    Equivalent to token verification in Node.js middleware
    """
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Verify JWT token"""
        try:
            token = request.data.get('token')
            if not token:
                return Response(
                    {'error': 'Token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify token using Supabase service
            supabase_service = SupabaseService()
            user_data = supabase_service.verify_token(token)
            
            # Get or create Django user
            django_user = supabase_service.get_or_create_django_user(user_data)
            
            logger.info(f'Token verified successfully for user: {user_data["email"]}')
            
            return Response({
                'valid': True,
                'user': {
                    'id': django_user.id,
                    'username': django_user.username,
                    'email': django_user.email,
                    'first_name': django_user.first_name,
                    'last_name': django_user.last_name,
                },
                'supabase_user': {
                    'id': user_data['id'],
                    'email': user_data['email'],
                    'user_metadata': user_data.get('user_metadata', {}),
                }
            })
            
        except AuthenticationFailed as e:
            return Response(
                {'valid': False, 'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            logger.error(f'Token verification failed: {str(e)}')
            return Response(
                {'error': 'Token verification failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserProfileView(APIView):
    """
    Get user profile information
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get authenticated user profile"""
        try:
            user = request.user
            supabase_user = getattr(request, 'supabase_user', {})
            
            profile_data = {
                'django_user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'date_joined': user.date_joined,
                    'last_login': user.last_login,
                },
                'supabase_user': supabase_user,
            }
            
            # Check if user has CV profile
            try:
                from apps.cv_builder.models import CVProfile
                cv_profile = CVProfile.objects.get(user=user)
                profile_data['has_cv_profile'] = True
                profile_data['cv_profile_id'] = str(cv_profile.id)
                profile_data['template_name'] = cv_profile.template_name
            except CVProfile.DoesNotExist:
                profile_data['has_cv_profile'] = False
            
            return Response(profile_data)
            
        except Exception as e:
            logger.error(f'Failed to get user profile: {str(e)}')
            return Response(
                {'error': 'Failed to get user profile'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request):
        """Update user profile"""
        try:
            user = request.user
            data = request.data
            
            # Update allowed fields
            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            
            user.save()
            
            logger.info(f'User profile updated for: {user.email}')
            
            return Response({
                'success': True,
                'message': 'Profile updated successfully',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            })
            
        except Exception as e:
            logger.error(f'Failed to update user profile: {str(e)}')
            return Response(
                {'error': 'Failed to update profile'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LogoutView(APIView):
    """
    Logout user (mainly for session cleanup)
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Logout user"""
        try:
            user_email = request.user.email
            
            # Logout from Django session (if using session authentication)
            logout(request)
            
            logger.info(f'User logged out: {user_email}')
            
            return Response({
                'success': True,
                'message': 'Logged out successfully'
            })
            
        except Exception as e:
            logger.error(f'Logout failed: {str(e)}')
            return Response(
                {'error': 'Logout failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )