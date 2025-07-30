"""
Django management command to build the React client
Equivalent to the Node.js "build:client" script
"""

import os
import shutil
import subprocess
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings


class Command(BaseCommand):
    help = 'Build the React client and move assets to Django public/ directory'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clean',
            action='store_true',
            help='Clean public directory before building',
        )

    def handle(self, *args, **options):
        """Build React client - equivalent to Node.js build:client + setup:public"""
        
        # Define paths
        backend_dir = Path(settings.BASE_DIR)
        client_dir = backend_dir.parent / 'client'
        public_dir = backend_dir / 'public'
        client_dist_dir = client_dir / 'dist'

        self.stdout.write(self.style.SUCCESS('🚀 Building React Client...'))

        # Validate client directory exists
        if not client_dir.exists():
            raise CommandError(f'Client directory not found: {client_dir}')

        # Step 1: Clean public directory if requested
        if options['clean'] and public_dir.exists():
            self.stdout.write('🧹 Cleaning public directory...')
            shutil.rmtree(public_dir)

        # Step 2: Install client dependencies
        self.stdout.write('📦 Installing client dependencies...')
        try:
            subprocess.run(
                ['bun', 'install'], 
                cwd=client_dir, 
                check=True, 
                capture_output=True, 
                text=True
            )
        except subprocess.CalledProcessError as e:
            raise CommandError(f'Failed to install client dependencies: {e.stderr}')
        except FileNotFoundError:
            raise CommandError('Bun not found. Please install Bun: https://bun.sh/')

        # Step 3: Build React client
        self.stdout.write('⚛️  Building React application...')
        try:
            result = subprocess.run(
                ['bun', 'run', 'build'], 
                cwd=client_dir, 
                check=True, 
                capture_output=True, 
                text=True
            )
            self.stdout.write(f'Build output: {result.stdout}')
        except subprocess.CalledProcessError as e:
            raise CommandError(f'Failed to build React client: {e.stderr}')

        # Step 4: Move build files to Django public directory
        self.stdout.write('📁 Moving build files to Django public directory...')
        
        if not client_dist_dir.exists():
            raise CommandError(f'Client build directory not found: {client_dist_dir}')

        # Create public directory
        public_dir.mkdir(exist_ok=True)

        # Move all files from client/dist to backend/public
        try:
            for item in client_dist_dir.iterdir():
                dest = public_dir / item.name
                if dest.exists():
                    if dest.is_dir():
                        shutil.rmtree(dest)
                    else:
                        dest.unlink()
                
                if item.is_dir():
                    shutil.copytree(item, dest)
                else:
                    shutil.copy2(item, dest)

            # Clean up client dist directory
            shutil.rmtree(client_dist_dir)
            
        except Exception as e:
            raise CommandError(f'Failed to move build files: {str(e)}')

        # Step 5: Verify build
        index_file = public_dir / 'index.html'
        if not index_file.exists():
            raise CommandError('Build verification failed: index.html not found in public directory')

        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Client build completed successfully!\n'
                f'📍 Build files available in: {public_dir}\n'
                f'🌐 Start Django server: python manage.py runserver\n'
                f'📱 Access app at: http://localhost:8000/'
            )
        )