"""
Django management command for production-style startup
Equivalent to the Node.js "start:full" script
"""

import subprocess
import sys
from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Build client and start Django production server (equivalent to Node.js start:full)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--port',
            type=int,
            default=8000,
            help='Port to run Django server on (default: 8000)',
        )
        parser.add_argument(
            '--host',
            type=str,
            default='0.0.0.0',
            help='Host to run Django server on (default: 0.0.0.0)',
        )
        parser.add_argument(
            '--gunicorn',
            action='store_true',
            help='Use Gunicorn for production serving',
        )

    def handle(self, *args, **options):
        """Build client and start production server"""
        
        self.stdout.write(self.style.SUCCESS('🚀 CVFlo Production Setup'))
        self.stdout.write('=' * 50)

        try:
            # Step 1: Build client
            self.stdout.write('📦 Step 1: Building React client...')
            call_command('build_client', '--clean')

            # Step 2: Collect static files
            self.stdout.write('📁 Step 2: Collecting static files...')
            call_command('collectstatic', '--noinput')

            # Step 3: Start server
            if options['gunicorn']:
                self.stdout.write('🚀 Step 3: Starting Gunicorn server...')
                self.stdout.write(
                    self.style.SUCCESS(
                        f'🌐 Production server will be available at: http://{options["host"]}:{options["port"]}/\n'
                    )
                )
                subprocess.run([
                    'gunicorn', 'cvflo.wsgi:application',
                    '--bind', f'{options["host"]}:{options["port"]}',
                    '--workers', '3',
                    '--timeout', '120',
                ])
            else:
                self.stdout.write('🚀 Step 3: Starting Django production server...')
                self.stdout.write(
                    self.style.SUCCESS(
                        f'🌐 Server will be available at: http://{options["host"]}:{options["port"]}/\n'
                    )
                )
                subprocess.run([
                    sys.executable, 'manage.py', 'runserver', 
                    f'{options["host"]}:{options["port"]}',
                    '--insecure'  # Allow serving static files in non-debug mode
                ])

        except KeyboardInterrupt:
            self.stdout.write(self.style.SUCCESS('\n👋 Production server stopped'))
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error during production setup: {str(e)}')
            )