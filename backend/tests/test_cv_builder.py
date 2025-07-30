"""
Tests for CV Builder app

These tests ensure the CV data models and API endpoints work correctly.
"""

import pytest
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from apps.cv_builder.models import CVProfile, PersonalInfo, WorkExperience, Education
from apps.authentication.backends import SupabaseService


class CVBuilderModelTests(TestCase):
    """Test CV Builder models"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
    def test_cv_profile_creation(self):
        """Test creating a CV profile"""
        cv_profile = CVProfile.objects.create(
            user=self.user,
            template_name='classic-0',
            summary='Test summary'
        )
        
        self.assertEqual(cv_profile.user, self.user)
        self.assertEqual(cv_profile.template_name, 'classic-0')
        self.assertEqual(cv_profile.summary, 'Test summary')
        self.assertTrue(cv_profile.show_summary)
        
    def test_personal_info_creation(self):
        """Test creating personal information"""
        cv_profile = CVProfile.objects.create(user=self.user)
        
        personal_info = PersonalInfo.objects.create(
            cv_profile=cv_profile,
            first_name='John',
            last_name='Doe',
            email='john.doe@example.com',
            phone='+1234567890',
            title='Software Engineer'
        )
        
        self.assertEqual(personal_info.full_name, 'John Doe')
        self.assertEqual(personal_info.email, 'john.doe@example.com')
        
    def test_work_experience_creation(self):
        """Test creating work experience"""
        cv_profile = CVProfile.objects.create(user=self.user)
        
        work_exp = WorkExperience.objects.create(
            cv_profile=cv_profile,
            position='Senior Developer',
            company='Tech Corp',
            location='San Francisco, CA',
            start_date='2020-01',
            end_date='2023-01',
            current=False,
            description='Developed web applications'
        )
        
        self.assertEqual(work_exp.position, 'Senior Developer')
        self.assertEqual(work_exp.company, 'Tech Corp')
        self.assertFalse(work_exp.current)
        
    def test_education_creation(self):
        """Test creating education entry"""
        cv_profile = CVProfile.objects.create(user=self.user)
        
        education = Education.objects.create(
            cv_profile=cv_profile,
            institution='University of Technology',
            degree='Bachelor of Science',
            field='Computer Science',
            location='Boston, MA',
            start_date='2016-09',
            end_date='2020-05',
            current=False
        )
        
        self.assertEqual(education.institution, 'University of Technology')
        self.assertEqual(education.degree, 'Bachelor of Science')
        self.assertEqual(education.field, 'Computer Science')


class CVBuilderAPITests(APITestCase):
    """Test CV Builder API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client = APIClient()
        
    def test_cv_data_endpoint_unauthenticated(self):
        """Test CV data endpoint without authentication"""
        response = self.client.get('/api/cv/data/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_cv_data_endpoint_authenticated(self):
        """Test CV data endpoint with authentication"""
        # This would require mocking Supabase authentication
        # For now, we'll use Django's session authentication
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/api/cv/data/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should return empty CV data for new user
        data = response.json()
        self.assertIsNone(data['cv_data'])
        self.assertEqual(data['selected_template'], 'classic-0')
        
    def test_create_cv_data(self):
        """Test creating CV data"""
        self.client.force_authenticate(user=self.user)
        
        cv_data = {
            'cv_data': {
                'template_name': 'modern-0',
                'summary': 'Test professional summary',
            },
            'visibility': {
                'summary': True,
                'workExperience': True,
                'education': True,
                'projects': True,
                'skills': True,
                'interests': True,
                'references': True,
            },
            'selected_template': 'modern-0'
        }
        
        response = self.client.post('/api/cv/data/', cv_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['message'], 'CV data saved successfully')
        
    def test_templates_endpoint(self):
        """Test templates endpoint"""
        response = self.client.get('/api/cv/templates/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertIn('templates', data)
        self.assertIsInstance(data['templates'], list)
        
        # Should have at least the default templates
        template_names = [t['name'] for t in data['templates']]
        self.assertIn('classic-0', template_names)
        self.assertIn('modern-0', template_names)


@pytest.mark.django_db
class TestCVProfileViewSet:
    """Test CV Profile ViewSet using pytest"""
    
    def test_cv_profile_creation(self):
        """Test creating CV profile via API"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        cv_profile = CVProfile.objects.create(
            user=user,
            template_name='classic-0',
            summary='Test summary'
        )
        
        assert cv_profile.user == user
        assert cv_profile.template_name == 'classic-0'
        assert cv_profile.summary == 'Test summary'
        
    def test_cv_profile_str_representation(self):
        """Test string representation of CV profile"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            first_name='John',
            last_name='Doe'
        )
        
        cv_profile = CVProfile.objects.create(user=user)
        
        assert str(cv_profile) == "CV Profile for John Doe"