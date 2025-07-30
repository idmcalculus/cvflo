"""
Django Admin configuration for Authentication app
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html


# Extend the default User admin to show CV-related information
class CVUserAdmin(BaseUserAdmin):
    """
    Extended User admin that shows CV-related information
    """
    
    list_display = BaseUserAdmin.list_display + ('has_cv_profile', 'cv_template', 'last_cv_update')
    list_filter = BaseUserAdmin.list_filter + ('date_joined',)
    
    def has_cv_profile(self, obj):
        """Check if user has a CV profile"""
        try:
            from apps.cv_builder.models import CVProfile
            CVProfile.objects.get(user=obj)
            return True
        except CVProfile.DoesNotExist:
            return False
    has_cv_profile.boolean = True
    has_cv_profile.short_description = 'Has CV'
    
    def cv_template(self, obj):
        """Show user's selected CV template"""
        try:
            from apps.cv_builder.models import CVProfile
            profile = CVProfile.objects.get(user=obj)
            return profile.template_name
        except CVProfile.DoesNotExist:
            return '-'
    cv_template.short_description = 'CV Template'
    
    def last_cv_update(self, obj):
        """Show when user last updated their CV"""
        try:
            from apps.cv_builder.models import CVProfile
            profile = CVProfile.objects.get(user=obj)
            return profile.updated_at.strftime('%Y-%m-%d %H:%M')
        except CVProfile.DoesNotExist:
            return '-'
    last_cv_update.short_description = 'Last CV Update'
    
    actions = list(BaseUserAdmin.actions) + ['create_cv_profiles']
    
    def create_cv_profiles(self, request, queryset):
        """Admin action to create CV profiles for users who don't have them"""
        from apps.cv_builder.models import CVProfile
        created = 0
        for user in queryset:
            profile, created_profile = CVProfile.objects.get_or_create(
                user=user,
                defaults={'template_name': 'classic-0'}
            )
            if created_profile:
                created += 1
        
        self.message_user(request, f'{created} CV profiles were created.')
    create_cv_profiles.short_description = 'Create CV profiles for selected users'


# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, CVUserAdmin)