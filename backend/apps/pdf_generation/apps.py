from django.apps import AppConfig


class PdfGenerationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.pdf_generation'
    verbose_name = 'PDF Generation'