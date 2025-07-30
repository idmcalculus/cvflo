"""
Django management command to generate comprehensive analytics reports
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Count, Avg, Sum, Q
from datetime import timedelta, datetime
import json
import csv
from io import StringIO

from apps.cv_builder.models import CVProfile, PDFGenerationLog
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Generate comprehensive analytics reports for CVFlo'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--period',
            type=str,
            choices=['7d', '30d', '90d', '1y', 'all'],
            default='30d',
            help='Time period for the report',
        )
        parser.add_argument(
            '--format',
            type=str,
            choices=['json', 'csv', 'text'],
            default='text',
            help='Output format',
        )
        parser.add_argument(
            '--output',
            type=str,
            help='Output file path (default: stdout)',
        )
        parser.add_argument(
            '--detailed',
            action='store_true',
            help='Include detailed breakdowns',
        )
    
    def handle(self, *args, **options):
        """Handle the command execution"""
        period = options['period']
        output_format = options['format']
        output_file = options['output']
        detailed = options['detailed']
        
        # Calculate date range
        now = timezone.now()
        if period == '7d':
            start_date = now - timedelta(days=7)
            period_name = 'Last 7 days'
        elif period == '30d':
            start_date = now - timedelta(days=30)
            period_name = 'Last 30 days'
        elif period == '90d':
            start_date = now - timedelta(days=90)
            period_name = 'Last 90 days'
        elif period == '1y':
            start_date = now - timedelta(days=365)
            period_name = 'Last year'
        else:  # all
            start_date = None
            period_name = 'All time'
        
        # Generate report data
        report_data = self.generate_report_data(start_date, detailed)
        report_data['period'] = period_name
        report_data['generated_at'] = now.isoformat()
        
        # Format and output report
        if output_format == 'json':
            output_content = json.dumps(report_data, indent=2, default=str)
        elif output_format == 'csv':
            output_content = self.format_as_csv(report_data)
        else:  # text
            output_content = self.format_as_text(report_data)
        
        if output_file:
            with open(output_file, 'w') as f:
                f.write(output_content)
            self.stdout.write(
                self.style.SUCCESS(f'Report saved to: {output_file}')
            )
        else:
            self.stdout.write(output_content)
    
    def generate_report_data(self, start_date, detailed=False):
        """Generate comprehensive report data"""
        # Base querysets
        users_qs = User.objects.all()
        cv_profiles_qs = CVProfile.objects.all()
        pdf_logs_qs = PDFGenerationLog.objects.all()
        
        if start_date:
            users_qs = users_qs.filter(date_joined__gte=start_date)
            cv_profiles_qs = cv_profiles_qs.filter(created_at__gte=start_date)
            pdf_logs_qs = pdf_logs_qs.filter(created_at__gte=start_date)
        
        # User statistics
        total_users = User.objects.count()
        new_users = users_qs.count()
        users_with_cv = User.objects.filter(cv_profile__isnull=False).count()
        
        # CV Profile statistics
        total_cv_profiles = CVProfile.objects.count()
        new_cv_profiles = cv_profiles_qs.count()
        
        # PDF generation statistics
        pdf_stats = pdf_logs_qs.aggregate(
            total_generations=Count('id'),
            successful_generations=Count('id', filter=Q(status='success')),
            failed_generations=Count('id', filter=Q(status='failed')),
            avg_generation_time=Avg('generation_time'),
            total_file_size=Sum('file_size'),
        )
        
        # Template usage
        template_usage = pdf_logs_qs.values('template_name').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Success rate
        success_rate = 0
        if pdf_stats['total_generations']:
            success_rate = (pdf_stats['successful_generations'] / pdf_stats['total_generations']) * 100
        
        report_data = {
            'users': {
                'total_users': total_users,
                'new_users_in_period': new_users,
                'users_with_cv': users_with_cv,
                'cv_adoption_rate': (users_with_cv / total_users * 100) if total_users else 0,
            },
            'cv_profiles': {
                'total_profiles': total_cv_profiles,
                'new_profiles_in_period': new_cv_profiles,
            },
            'pdf_generation': {
                'total_generations': pdf_stats['total_generations'] or 0,
                'successful_generations': pdf_stats['successful_generations'] or 0,
                'failed_generations': pdf_stats['failed_generations'] or 0,
                'success_rate_percent': round(success_rate, 2),
                'avg_generation_time_seconds': round(pdf_stats['avg_generation_time'] or 0, 2),
                'total_file_size_mb': round((pdf_stats['total_file_size'] or 0) / (1024 * 1024), 2),
            },
            'template_usage': list(template_usage),
        }
        
        if detailed:
            report_data.update(self.get_detailed_analytics(start_date))
        
        return report_data
    
    def get_detailed_analytics(self, start_date):
        """Get detailed analytics data"""
        pdf_logs_qs = PDFGenerationLog.objects.all()
        if start_date:
            pdf_logs_qs = pdf_logs_qs.filter(created_at__gte=start_date)
        
        # Daily generation trends (last 30 days)
        daily_trends = []
        for i in range(30):
            date = timezone.now().date() - timedelta(days=i)
            daily_count = PDFGenerationLog.objects.filter(
                created_at__date=date
            ).count()
            daily_trends.append({
                'date': date.isoformat(),
                'generations': daily_count
            })
        
        # User activity patterns
        top_users = pdf_logs_qs.values('user__email').annotate(
            generation_count=Count('id')
        ).order_by('-generation_count')[:10]
        
        # Performance metrics by template
        template_performance = pdf_logs_qs.values('template_name').annotate(
            total_generations=Count('id'),
            avg_generation_time=Avg('generation_time'),
            avg_file_size=Avg('file_size'),
            success_rate=Count('id', filter=Q(status='success')) * 100.0 / Count('id')
        ).order_by('-total_generations')
        
        # Error analysis
        error_patterns = pdf_logs_qs.filter(
            status='failed'
        ).exclude(
            error_message=''
        ).values('error_message').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        return {
            'detailed_analytics': {
                'daily_trends': daily_trends,
                'top_users': list(top_users),
                'template_performance': list(template_performance),
                'error_patterns': list(error_patterns),
            }
        }
    
    def format_as_text(self, data):
        """Format report data as human-readable text"""
        lines = []
        lines.append(f"CVFlo Analytics Report - {data['period']}")
        lines.append(f"Generated at: {data['generated_at']}")
        lines.append("=" * 50)
        lines.append("")
        
        # User statistics
        lines.append("USER STATISTICS")
        lines.append("-" * 20)
        lines.append(f"Total users: {data['users']['total_users']}")
        lines.append(f"New users in period: {data['users']['new_users_in_period']}")
        lines.append(f"Users with CV: {data['users']['users_with_cv']}")
        lines.append(f"CV adoption rate: {data['users']['cv_adoption_rate']:.1f}%")
        lines.append("")
        
        # CV Profile statistics
        lines.append("CV PROFILE STATISTICS")
        lines.append("-" * 25)
        lines.append(f"Total profiles: {data['cv_profiles']['total_profiles']}")
        lines.append(f"New profiles in period: {data['cv_profiles']['new_profiles_in_period']}")
        lines.append("")
        
        # PDF generation statistics
        lines.append("PDF GENERATION STATISTICS")
        lines.append("-" * 30)
        pdf_data = data['pdf_generation']
        lines.append(f"Total generations: {pdf_data['total_generations']}")
        lines.append(f"Successful: {pdf_data['successful_generations']}")
        lines.append(f"Failed: {pdf_data['failed_generations']}")
        lines.append(f"Success rate: {pdf_data['success_rate_percent']:.1f}%")
        lines.append(f"Avg generation time: {pdf_data['avg_generation_time_seconds']:.2f}s")
        lines.append(f"Total file size: {pdf_data['total_file_size_mb']:.2f} MB")
        lines.append("")
        
        # Template usage
        lines.append("TEMPLATE USAGE")
        lines.append("-" * 15)
        for template in data['template_usage'][:10]:
            lines.append(f"{template['template_name']}: {template['count']} generations")
        
        if 'detailed_analytics' in data:
            lines.append("")
            lines.append("DETAILED ANALYTICS")
            lines.append("-" * 20)
            
            # Top users
            lines.append("Top users by PDF generations:")
            for user in data['detailed_analytics']['top_users'][:5]:
                lines.append(f"  {user['user__email']}: {user['generation_count']}")
        
        return "\n".join(lines)
    
    def format_as_csv(self, data):
        """Format key metrics as CSV"""
        output = StringIO()
        writer = csv.writer(output)
        
        # Write headers and data
        writer.writerow(['Metric', 'Value'])
        writer.writerow(['Period', data['period']])
        writer.writerow(['Generated At', data['generated_at']])
        writer.writerow(['Total Users', data['users']['total_users']])
        writer.writerow(['New Users', data['users']['new_users_in_period']])
        writer.writerow(['Users With CV', data['users']['users_with_cv']])
        writer.writerow(['CV Adoption Rate %', data['users']['cv_adoption_rate']])
        writer.writerow(['Total PDF Generations', data['pdf_generation']['total_generations']])
        writer.writerow(['Successful Generations', data['pdf_generation']['successful_generations']])
        writer.writerow(['Success Rate %', data['pdf_generation']['success_rate_percent']])
        writer.writerow(['Avg Generation Time (s)', data['pdf_generation']['avg_generation_time_seconds']])
        
        return output.getvalue()