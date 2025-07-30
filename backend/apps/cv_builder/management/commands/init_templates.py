"""
Management command to initialize CV templates in the database

This command creates the default CV templates based on the configuration
in Django settings, making them available through the admin interface.
"""

from django.core.management.base import BaseCommand
from django.conf import settings
from apps.cv_builder.models import CVTemplate


class Command(BaseCommand):
    help = 'Initialize CV templates in the database from settings configuration'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force update existing templates',
        )

    def handle(self, *args, **options):
        """Handle the command execution"""
        force_update = options['force']
        created_count = 0
        updated_count = 0

        self.stdout.write('Initializing CV templates...')

        for template_name, config in settings.CV_TEMPLATES.items():
            template_data = {
                'display_name': config['display_name'],
                'description': config['description'],
                'responsive': config['responsive'],
                'has_columns': config['has_columns'],
                'pdf_settings': config['pdf_settings'],
                'template_file': f'cv/{template_name}.html',
                'is_active': True,
                'is_premium': False,
            }

            template, created = CVTemplate.objects.get_or_create(
                name=template_name,
                defaults=template_data
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created template: {template_name}')
                )
            elif force_update:
                # Update existing template
                for key, value in template_data.items():
                    setattr(template, key, value)
                template.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'↻ Updated template: {template_name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'- Template already exists: {template_name}')
                )

        # Summary
        self.stdout.write('')
        self.stdout.write(
            self.style.SUCCESS(f'Templates initialization complete!')
        )
        self.stdout.write(f'Created: {created_count}')
        self.stdout.write(f'Updated: {updated_count}')
        
        if created_count > 0 or updated_count > 0:
            self.stdout.write('')
            self.stdout.write(
                'Templates are now available in the Django admin interface at /admin/cv_builder/cvtemplate/'
            )