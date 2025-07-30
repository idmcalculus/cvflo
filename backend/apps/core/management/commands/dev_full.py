"""
Django management command for full development setup
Equivalent to the Node.js "dev:full" script
"""

import subprocess
import sys
from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Build client and start Django development server (equivalent to Node.js dev:full)'

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
            default='127.0.0.1',
            help='Host to run Django server on (default: 127.0.0.1)',
        )

    def handle(self, *args, **options):
        """Build client and start development server"""
        
        self.stdout.write(self.style.SUCCESS('🚀 CVFlo Full Development Setup'))
        self.stdout.write('=' * 50)

        try:
            # Step 1: Build client
            self.stdout.write('📦 Step 1: Building React client...')
            call_command('build_client', '--clean')

            # Step 2: Start Django development server
            self.stdout.write('🚀 Step 2: Starting Django development server...')
            self.stdout.write(
                self.style.SUCCESS(
                    f'🌐 Server will be available at: http://{options["host"]}:{options["port"]}/\n'
                    f'📱 React app served from Django\n'
                    f'🔧 API available at: http://{options["host"]}:{options["port"]}/api/\n'
                    f'⚙️  Admin available at: http://{options["host"]}:{options["port"]}/admin/\n'
                )
            )

            # Use subprocess to start server so we can pass the correct arguments
            subprocess.run([
                sys.executable, 'manage.py', 'runserver', 
                f'{options["host"]}:{options["port"]}'
            ])

        except KeyboardInterrupt:
            self.stdout.write(self.style.SUCCESS('\n👋 Development server stopped'))
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error during development setup: {str(e)}')
            )