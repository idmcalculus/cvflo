"""
Views for CV Builder app

These views provide REST API endpoints for CV data management,
equivalent to the Node.js CVController functionality.
"""

import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.conf import settings
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator

from .models import CVProfile
# Simplified serializers - we're using JSON storage
# from .serializers import CVProfileSerializer

logger = logging.getLogger('cvflo')


# Simplified views - using JSON storage instead of individual model ViewSets


class CVDataView(APIView):
    """
    Main CV data endpoint
    Equivalent to the Node.js CVController methods
    Handles GET/POST/PUT/DELETE /api/cv/data
    """
    
    permission_classes = [AllowAny]  # Temporarily disable auth for testing
    
    def get(self, request):
        """
        Get CV data for authenticated user
        Equivalent to Node.js getCVData method
        """
        try:
            logger.info(f'GET /api/cv/data - Fetching CV data for user: {getattr(request.user, "email", "anonymous")}')
            
            try:
                # Use Django User ID (integer) or default for testing
                user_id = request.user.id if request.user.is_authenticated else 1  # Default user ID for testing
                logger.info(f'Using user_id: {user_id} for CV data retrieval')
                
                cv_profile = CVProfile.objects.get(user_id=user_id)
                
                return Response({
                    'cv_data': cv_profile.cv_content,
                    'visibility': cv_profile.cv_content.get('visibility', {}),
                    'selected_template': cv_profile.template_name,
                    'last_updated': cv_profile.updated_at
                })
                
            except CVProfile.DoesNotExist:
                return Response({
                    'cv_data': None,
                    'visibility': None,
                    'selected_template': 'classic-0',
                    'message': 'No CV data found'
                })
                
        except Exception as e:
            logger.error(f'Failed to retrieve CV data: {str(e)}')
            return Response(
                {'error': 'Failed to retrieve CV data'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @method_decorator(ratelimit(key='user', rate='50/hour', method='POST'))
    def post(self, request):
        """
        Save/Create CV data for authenticated user
        Equivalent to Node.js saveCVData method
        """
        try:
            logger.info(f'POST /api/cv/data - Saving CV data for user: {getattr(request.user, "email", "anonymous")}')
            
            user_id = request.user.id if request.user.is_authenticated else 1  # Default user ID for testing
            logger.info(f'Using user_id: {user_id} for CV data saving')
            
            cv_data = request.data.get('cv_data')
            visibility = request.data.get('visibility', {})
            selected_template = request.data.get('selected_template', 'classic-0')
            
            if not cv_data:
                return Response(
                    {'error': 'CV data is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Combine cv_data and visibility into cv_content
            cv_content = cv_data.copy() if isinstance(cv_data, dict) else {}
            cv_content['visibility'] = visibility
            
            # Get or create CV profile
            cv_profile, created = CVProfile.objects.get_or_create(
                user_id=user_id,
                defaults={
                    'template_name': selected_template,
                    'cv_content': cv_content
                }
            )
            
            if not created:
                # Update existing profile
                cv_profile.cv_content = cv_content
                cv_profile.template_name = selected_template
                cv_profile.save()
            
            logger.info(f'CV data saved successfully for user: {request.user.email}')
            return Response({
                'success': True,
                'message': 'CV data saved successfully',
                'data': {
                    'id': str(cv_profile.id),
                    'last_updated': cv_profile.updated_at
                }
            })
                
        except Exception as e:
            logger.error(f'Failed to save CV data: {str(e)}')
            return Response(
                {'error': 'Failed to save CV data'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @method_decorator(ratelimit(key='user', rate='50/hour', method='PUT'))
    def put(self, request):
        """
        Update CV data for authenticated user
        Equivalent to Node.js updateCVData method
        """
        try:
            logger.info(f'PUT /api/cv/data - Updating CV data for user: {getattr(request.user, "email", "anonymous")}')
            
            user_id = request.user.id if request.user.is_authenticated else 1  # Default user ID for testing
            logger.info(f'Using user_id: {user_id} for CV data updating')
            
            try:
                cv_profile = CVProfile.objects.get(user_id=user_id)
            except CVProfile.DoesNotExist:
                return Response(
                    {'error': 'CV data not found. Use POST to create new CV data.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            cv_data = request.data.get('cv_data')
            visibility = request.data.get('visibility')
            selected_template = request.data.get('selected_template')
            
            # Update CV content
            if cv_data:
                cv_profile.cv_content.update(cv_data)
            
            if visibility:
                cv_profile.cv_content['visibility'] = visibility
            
            if selected_template:
                cv_profile.template_name = selected_template
            
            cv_profile.save()
            
            logger.info(f'CV data updated successfully for user: {request.user.email}')
            return Response({
                'success': True,
                'message': 'CV data updated successfully',
                'data': {
                    'id': str(cv_profile.id),
                    'last_updated': cv_profile.updated_at
                }
            })
            
        except Exception as e:
            logger.error(f'Failed to update CV data: {str(e)}')
            return Response(
                {'error': 'Failed to update CV data'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request):
        """
        Delete CV data for authenticated user
        Equivalent to Node.js deleteCVData method
        """
        try:
            logger.info(f'DELETE /api/cv/data - Deleting CV data for user: {getattr(request.user, "email", "anonymous")}')
            
            user_id = request.user.id if request.user.is_authenticated else 1  # Default user ID for testing
            logger.info(f'Using user_id: {user_id} for CV data deletion')
            
            try:
                cv_profile = CVProfile.objects.get(user_id=user_id)
                cv_profile.delete()
                
                logger.info(f'CV data deleted successfully for user: {request.user.email}')
                return Response({
                    'success': True,
                    'message': 'CV data deleted successfully'
                })
                
            except CVProfile.DoesNotExist:
                return Response(
                    {'error': 'CV data not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Exception as e:
            logger.error(f'Failed to delete CV data: {str(e)}')
            return Response(
                {'error': 'Failed to delete CV data'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TemplateListView(APIView):
    """
    Get available CV templates
    Equivalent to Node.js getTemplates method
    """
    
    permission_classes = []  # Public endpoint
    
    def get(self, request):
        """Get list of available templates"""
        try:
            templates = []
            for template_name, config in settings.CV_TEMPLATES.items():
                templates.append({
                    'name': template_name,
                    'display_name': config['display_name'],
                    'description': config['description'],
                    'responsive': config['responsive'],
                    'has_columns': config['has_columns'],
                })
            
            logger.info(f'Templates list requested, returned {len(templates)} templates')
            return Response({'templates': templates})
            
        except Exception as e:
            logger.error(f'Failed to get templates: {str(e)}')
            return Response(
                {'error': 'Failed to get templates'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )