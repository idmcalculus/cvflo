"""
Supabase Authentication Backend

This module provides Django authentication integration with Supabase,
equivalent to the Node.js Supabase authentication middleware.
"""

import logging
from typing import Optional
from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.models import User
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from supabase import create_client, Client
import jwt
from jwt import DecodeError, ExpiredSignatureError

logger = logging.getLogger('cvflo')


class SupabaseService:
    """
    Service class for Supabase operations
    Equivalent to the Node.js SupabaseService
    """
    
    def __init__(self):
        self.url = settings.SUPABASE_URL
        self.anon_key = settings.SUPABASE_ANON_KEY
        self.service_role_key = settings.SUPABASE_SERVICE_ROLE_KEY
        
        if not all([self.url, self.anon_key]):
            raise ValueError("Supabase URL and ANON_KEY must be configured")
        
        self.client: Client = create_client(self.url, self.anon_key)
        self.admin_client: Client = create_client(self.url, self.service_role_key) if self.service_role_key else None
    
    def verify_token(self, token: str) -> dict:
        """
        Verify JWT token with Supabase
        
        Args:
            token: JWT token to verify
            
        Returns:
            dict: User data from token
            
        Raises:
            AuthenticationFailed: If token is invalid
        """
        try:
            # Verify token with Supabase
            response = self.client.auth.get_user(token)
            
            if not response.user:
                raise AuthenticationFailed('Invalid token')
            
            user_data = {
                'id': response.user.id,
                'email': response.user.email,
                'user_metadata': response.user.user_metadata or {},
                'app_metadata': response.user.app_metadata or {},
            }
            
            logger.info(f'Token verified successfully for user: {user_data["email"]}')
            return user_data
            
        except Exception as e:
            logger.warning(f'Token verification failed: {str(e)}')
            raise AuthenticationFailed('Invalid or expired token')
    
    def get_or_create_django_user(self, supabase_user: dict) -> User:
        """
        Get or create Django user from Supabase user data
        
        Args:
            supabase_user: User data from Supabase
            
        Returns:
            User: Django user instance
        """
        try:
            supabase_id = supabase_user['id']
            email = supabase_user['email']
            user_metadata = supabase_user.get('user_metadata', {})
            
            # Try to find existing user by email or supabase ID
            user = None
            
            # First, try to find by username (which we'll set to supabase ID)
            try:
                user = User.objects.get(username=supabase_id)
            except User.DoesNotExist:
                # Try to find by email
                try:
                    user = User.objects.get(email=email)
                    # Update username to supabase ID if found by email
                    user.username = supabase_id
                    user.save()
                except User.DoesNotExist:
                    pass
            
            # Create new user if not found
            if not user:
                # Extract name from metadata
                full_name = user_metadata.get('full_name', '')
                first_name = user_metadata.get('first_name', '')
                last_name = user_metadata.get('last_name', '')
                
                # If no first/last name in metadata, try to parse full_name
                if not first_name and full_name:
                    name_parts = full_name.split(' ', 1)
                    first_name = name_parts[0]
                    last_name = name_parts[1] if len(name_parts) > 1 else ''
                
                user = User.objects.create_user(
                    username=supabase_id,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                )
                
                logger.info(f'Created new Django user for Supabase user: {email}')
            else:
                logger.debug(f'Found existing Django user for Supabase user: {email}')
            
            return user
            
        except Exception as e:
            logger.error(f'Failed to get or create Django user: {str(e)}')
            raise AuthenticationFailed('Failed to create user')
    
    def upsert_user_profile(self, user_data: dict):
        """
        Create or update user profile in Supabase (if needed)
        Equivalent to the Node.js upsertUserProfile method
        """
        try:
            # This would typically sync additional profile data with Supabase
            # For now, we'll just log the operation
            logger.info(f'User profile sync for user: {user_data.get("email")}')
            
        except Exception as e:
            logger.warning(f'Failed to sync user profile: {str(e)}')


class SupabaseAuthentication(BaseAuthentication):
    """
    DRF Authentication class for Supabase JWT tokens
    Equivalent to the Node.js requireSupabaseAuth middleware
    """
    
    keyword = 'Bearer'
    
    def __init__(self):
        self.supabase_service = SupabaseService()
    
    def authenticate(self, request):
        """
        Authenticate request using Supabase JWT token
        
        Args:
            request: Django request object
            
        Returns:
            tuple: (user, token) if authenticated, None otherwise
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header:
            return None
        
        try:
            token = self.extract_token(auth_header)
            if not token:
                return None
            
            # Verify token with Supabase
            supabase_user = self.supabase_service.verify_token(token)
            
            # Get or create Django user
            django_user = self.supabase_service.get_or_create_django_user(supabase_user)
            
            # Store Supabase user data in request for access in views
            request.supabase_user = supabase_user
            
            return (django_user, token)
            
        except AuthenticationFailed:
            raise
        except Exception as e:
            logger.error(f'Authentication error: {str(e)}')
            raise AuthenticationFailed('Authentication failed')
    
    def extract_token(self, auth_header: str) -> Optional[str]:
        """
        Extract Bearer token from Authorization header
        
        Args:
            auth_header: Authorization header value
            
        Returns:
            str or None: Extracted token
        """
        if not auth_header:
            return None
        
        parts = auth_header.split(' ')
        if len(parts) != 2 or parts[0] != self.keyword:
            return None
        
        return parts[1]
    
    def authenticate_header(self, request):
        """
        Return authentication header for 401 responses
        """
        return self.keyword


class SupabaseBackend(BaseBackend):
    """
    Django authentication backend for Supabase
    Can be used for session-based authentication
    """
    
    def __init__(self):
        self.supabase_service = SupabaseService()
    
    def authenticate(self, request, token=None, **kwargs):
        """
        Authenticate using Supabase token
        
        Args:
            request: Django request object
            token: JWT token
            
        Returns:
            User or None: Django user if authenticated
        """
        if not token:
            return None
        
        try:
            supabase_user = self.supabase_service.verify_token(token)
            return self.supabase_service.get_or_create_django_user(supabase_user)
            
        except AuthenticationFailed:
            return None
    
    def get_user(self, user_id):
        """
        Get user by ID
        
        Args:
            user_id: User ID
            
        Returns:
            User or None: Django user instance
        """
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None


class OptionalSupabaseAuthentication(SupabaseAuthentication):
    """
    Optional Supabase authentication - doesn't fail if no token provided
    Equivalent to the Node.js optionalSupabaseAuth middleware
    """
    
    def authenticate(self, request):
        """
        Authenticate request but don't fail if no token provided
        """
        try:
            result = super().authenticate(request)
            return result
        except AuthenticationFailed:
            # Return None for optional authentication instead of raising exception
            return None