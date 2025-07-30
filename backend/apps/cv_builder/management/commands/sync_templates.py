"""
Django management command to sync CV templates from settings
"""

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from apps.cv_builder.models import CVTemplate
import json


class Command(BaseCommand):
    help = 'Sync CV templates from settings to database'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force update existing templates',
        )
        parser.add_argument(
            '--template',
            type=str,
            help='Sync specific template only',
        )
    
    def handle(self, *args, **options):
        """Handle the command execution"""
        force_update = options['force']
        specific_template = options['template']
        
        templates_config = getattr(settings, 'CV_TEMPLATES', {})
        
        if not templates_config:
            raise CommandError('No CV_TEMPLATES configuration found in settings')
        
        # Filter to specific template if provided
        if specific_template:
            if specific_template not in templates_config:
                raise CommandError(f'Template "{specific_template}" not found in settings')
            templates_config = {specific_template: templates_config[specific_template]}
        
        synced_count = 0
        updated_count = 0
        skipped_count = 0
        
        for template_name, config in templates_config.items():
            try:
                template, created = CVTemplate.objects.get_or_create(
                    name=template_name,
                    defaults={
                        'display_name': config.get('display_name', template_name.title()),
                        'description': config.get('description', ''),
                        'responsive': config.get('responsive', False),
                        'has_columns': config.get('has_columns', False),
                        'pdf_settings': config.get('pdf_settings', {}),
                        'template_file': f'cv/{template_name}.html',
                        'is_active': True,
                        'is_premium': config.get('is_premium', False),
                    }
                )
                
                if created:
                    synced_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'Created template: {template_name}')
                    )
                elif force_update:
                    # Update existing template
                    template.display_name = config.get('display_name', template_name.title())
                    template.description = config.get('description', '')
                    template.responsive = config.get('responsive', False)
                    template.has_columns = config.get('has_columns', False)
                    template.pdf_settings = config.get('pdf_settings', {})
                    template.template_file = f'cv/{template_name}.html'
                    template.is_premium = config.get('is_premium', False)
                    template.save()
                    
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'Updated template: {template_name}')
                    )
                else:
                    skipped_count += 1
                    self.stdout.write(
                        self.style.NOTICE(f'Skipped existing template: {template_name}')
                    )
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error syncing template {template_name}: {str(e)}')
                )
        
        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f'\nTemplate sync completed:\n'
                f'  Created: {synced_count}\n'
                f'  Updated: {updated_count}\n'
                f'  Skipped: {skipped_count}'
            )
        )
        
        # Check for orphaned templates in database
        db_templates = CVTemplate.objects.values_list('name', flat=True)
        config_templates = set(settings.CV_TEMPLATES.keys())
        orphaned = set(db_templates) - config_templates
        
        if orphaned:
            self.stdout.write(
                self.style.WARNING(
                    f'\nOrphaned templates in database (not in settings): {", ".join(orphaned)}'
                )
            )
            
            if input('Deactivate orphaned templates? [y/N]: ').lower() == 'y':
                deactivated = CVTemplate.objects.filter(name__in=orphaned).update(is_active=False)
                self.stdout.write(
                    self.style.SUCCESS(f'Deactivated {deactivated} orphaned templates')
                )