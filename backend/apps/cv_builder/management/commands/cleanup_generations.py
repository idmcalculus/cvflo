"""
Django management command to cleanup old PDF generation logs
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.cv_builder.models import PDFGenerationLog
from django.db.models import Count


class Command(BaseCommand):
    help = 'Cleanup old PDF generation logs and manage database size'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=90,
            help='Delete logs older than this many days (default: 90)',
        )
        parser.add_argument(
            '--keep-failed',
            action='store_true',
            help='Keep failed generation logs for analysis',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )
        parser.add_argument(
            '--stats',
            action='store_true',
            help='Show statistics before cleanup',
        )
    
    def handle(self, *args, **options):
        """Handle the command execution"""
        days_threshold = options['days']
        keep_failed = options['keep_failed']
        dry_run = options['dry_run']
        show_stats = options['stats']
        
        cutoff_date = timezone.now() - timedelta(days=days_threshold)
        
        # Show statistics if requested
        if show_stats:
            self.show_statistics(cutoff_date)
        
        # Build query for logs to delete
        logs_query = PDFGenerationLog.objects.filter(created_at__lt=cutoff_date)
        
        if keep_failed:
            logs_query = logs_query.filter(status='success')
            status_msg = "successful"
        else:
            status_msg = "all"
        
        logs_to_delete = logs_query.count()
        
        if logs_to_delete == 0:
            self.stdout.write(
                self.style.SUCCESS(f'No logs older than {days_threshold} days found.')
            )
            return
        
        self.stdout.write(
            f'Found {logs_to_delete} {status_msg} logs older than {days_threshold} days '
            f'(before {cutoff_date.date()})'
        )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN: No logs will be deleted.')
            )
            
            # Show breakdown by status
            breakdown = logs_query.values('status').annotate(count=Count('id'))
            for item in breakdown:
                self.stdout.write(f"  {item['status']}: {item['count']} logs")
            
            return
        
        # Confirm deletion
        if not options.get('no_input', False):
            confirm = input(f'Delete {logs_to_delete} logs? [y/N]: ')
            if confirm.lower() != 'y':
                self.stdout.write('Cancelled.')
                return
        
        # Perform deletion in batches to avoid memory issues
        batch_size = 1000
        deleted_count = 0
        
        while True:
            batch_ids = list(logs_query.values_list('id', flat=True)[:batch_size])
            if not batch_ids:
                break
            
            batch_deleted = PDFGenerationLog.objects.filter(id__in=batch_ids).delete()[0]
            deleted_count += batch_deleted
            
            self.stdout.write(f'Deleted batch: {batch_deleted} logs (total: {deleted_count})')
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully deleted {deleted_count} PDF generation logs.')
        )
        
        # Show updated statistics
        remaining_logs = PDFGenerationLog.objects.count()
        self.stdout.write(f'Remaining logs in database: {remaining_logs}')
    
    def show_statistics(self, cutoff_date):
        """Show current database statistics"""
        total_logs = PDFGenerationLog.objects.count()
        old_logs = PDFGenerationLog.objects.filter(created_at__lt=cutoff_date).count()
        
        # Status breakdown
        status_breakdown = PDFGenerationLog.objects.values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Template breakdown for old logs
        template_breakdown = PDFGenerationLog.objects.filter(
            created_at__lt=cutoff_date
        ).values('template_name').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Size estimation
        avg_size = PDFGenerationLog.objects.aggregate(
            avg_size=Count('id')
        )['avg_size']
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n=== PDF Generation Logs Statistics ===\n'
                f'Total logs: {total_logs}\n'
                f'Old logs (before {cutoff_date.date()}): {old_logs}\n'
                f'Percentage to be cleaned: {(old_logs/total_logs*100):.1f}%\n'
            )
        )
        
        self.stdout.write('Status breakdown (all logs):')
        for item in status_breakdown:
            self.stdout.write(f"  {item['status']}: {item['count']}")
        
        if template_breakdown:
            self.stdout.write('\nTop templates in old logs:')
            for item in template_breakdown[:5]:
                self.stdout.write(f"  {item['template_name']}: {item['count']}")
        
        self.stdout.write('')