"""
Django settings for CVFlo project.

This configuration replicates the functionality of the Node.js/Express server
while leveraging Django's "batteries included" philosophy.
"""

import os
from pathlib import Path
from decouple import config
import logging.config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', 'testserver']

# Application definition
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'corsheaders',
    'django_extensions',
]

LOCAL_APPS = [
    'apps.cv_builder',
    'apps.pdf_generation',
    'apps.authentication',
    'apps.core',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.core.middleware.security.SecurityMiddleware',
    'apps.core.middleware.logging.LoggingMiddleware',
    'apps.core.middleware.rate_limiting.EnhancedRateLimitMiddleware',
    'apps.core.middleware.rate_limiting.APIMetricsMiddleware',
]

ROOT_URLCONF = 'cvflo.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'cvflo.wsgi.application'

# Database Configuration - Supabase PostgreSQL
# Use Supabase PostgreSQL for both development and production

DATABASE_ENGINE = config('DATABASE_ENGINE', default='supabase')

if DATABASE_ENGINE == 'sqlite':
    # SQLite fallback (not recommended for production)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
elif DATABASE_ENGINE in ['postgresql', 'supabase']:
    # Supabase PostgreSQL (recommended)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('SUPABASE_DB_NAME', default='postgres'),
            'USER': config('SUPABASE_DB_USER', default='postgres'),
            'PASSWORD': config('SUPABASE_DB_PASSWORD', default=''),
            'HOST': config('SUPABASE_DB_HOST', default='localhost'),
            'PORT': config('SUPABASE_DB_PORT', default='5432', cast=int),
            'OPTIONS': {
                'sslmode': config('SUPABASE_DB_SSL_MODE', default='require'),
            },
        }
    }
else:
    raise ValueError(f"Unsupported DATABASE_ENGINE: {DATABASE_ENGINE}. Use 'sqlite', 'postgresql', or 'supabase'.")

# Supabase Configuration
SUPABASE_URL = config('SUPABASE_URL', default='')
SUPABASE_ANON_KEY = config('SUPABASE_ANON_KEY', default='')
SUPABASE_SERVICE_ROLE_KEY = config('SUPABASE_SERVICE_ROLE_KEY', default='')

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
    BASE_DIR / 'public',  # Client build files (equivalent to Node.js public/)
]

# Client build serving (equivalent to Node.js express.static)
CLIENT_BUILD_DIR = BASE_DIR / 'public'

# Static file finders (ensure proper MIME types)
STATICFILES_FINDERS = [
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
]

# Media files (User uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'apps.authentication.backends.SupabaseAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'pdf_generation': '10/15min',
        'preview_generation': '100/5min',
    }
}

# CORS Configuration (for frontend communication)
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS', 
    default='http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

CORS_ALLOW_CREDENTIALS = True

# Security Settings (equivalent to Node.js Helmet)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# PDF Generation Settings
PDF_GENERATION = {
    'ENGINE': 'weasyprint',  # Using WeasyPrint instead of Puppeteer
    'DEFAULT_FORMAT': 'A4',
    'DEFAULT_TEMPLATE': 'classic-0',
    'TEMPLATES_DIR': BASE_DIR / 'templates' / 'cv',
    'FONTS_DIR': BASE_DIR / 'static' / 'fonts',
    'MAX_FILE_SIZE': 10 * 1024 * 1024,  # 10MB max
}

# Template Configuration (equivalent to Node.js templateConfig)
CV_TEMPLATES = {
    'classic-0': {
        'name': 'classic-0',
        'display_name': 'Classic Template',
        'description': 'Traditional single-column layout with clean typography',
        'responsive': False,
        'has_columns': False,
        'pdf_settings': {
            'format': 'A4',
            'margin': {'top': '0.4in', 'right': '0.5in', 'bottom': '0.4in', 'left': '0.5in'},
            'scale': 1.0,
            'print_background': True,
        }
    },
    'modern-0': {
        'name': 'modern-0',
        'display_name': 'Modern Template',
        'description': 'Multi-column layout with modern design elements',
        'responsive': True,
        'has_columns': True,
        'pdf_settings': {
            'format': 'A4',
            'margin': {'top': '0.4in', 'right': '0.5in', 'bottom': '0.4in', 'left': '0.5in'},
            'scale': 1.0,
            'print_background': True,
        }
    },
    'modern-1': {
        'name': 'modern-1',
        'display_name': 'Modern Template v2',
        'description': 'Alternative modern layout with sidebar',
        'responsive': True,
        'has_columns': True,
        'pdf_settings': {
            'format': 'A4',
            'margin': {'top': '0.4in', 'right': '0.5in', 'bottom': '0.4in', 'left': '0.5in'},
            'scale': 1.0,
            'print_background': True,
        }
    },
    'academic-0': {
        'name': 'academic-0',
        'display_name': 'Academic Template',
        'description': 'Professional academic layout with publication focus',
        'responsive': False,
        'has_columns': False,
        'pdf_settings': {
            'format': 'A4',
            'margin': {'top': '0.4in', 'right': '0.5in', 'bottom': '0.4in', 'left': '0.5in'},
            'scale': 1.0,
            'print_background': True,
        }
    },
}

# Logging Configuration (equivalent to Winston in Node.js)
LOGGING_CONFIG = None
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
        'json': {
            'format': '{"level": "%(levelname)s", "time": "%(asctime)s", "module": "%(module)s", "message": "%(message)s"}',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'cvflo.log',
            'maxBytes': 1024*1024*10,  # 10 MB
            'backupCount': 5,
            'formatter': 'json',
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'error.log',
            'maxBytes': 1024*1024*10,  # 10 MB
            'backupCount': 5,
            'formatter': 'json',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file', 'error_file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'cvflo': {
            'handlers': ['console', 'file', 'error_file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Create logs directory if it doesn't exist
os.makedirs(BASE_DIR / 'logs', exist_ok=True)

# Enhanced Rate Limiting Configuration (beyond Node.js capabilities)
ENHANCED_RATE_LIMITS = {
    'default': {'requests': 100, 'window': 3600},  # 100 per hour
    'pdf_generation': {'requests': 10, 'window': 900},  # 10 per 15 minutes
    'preview_generation': {'requests': 100, 'window': 300},  # 100 per 5 minutes
    'api_general': {'requests': 1000, 'window': 3600},  # 1000 per hour
    'admin_api': {'requests': 500, 'window': 3600},  # 500 per hour for admin endpoints
}

# PDF Generation Pool Configuration
PDF_GENERATION_POOL_SIZE = config('PDF_GENERATION_POOL_SIZE', default=3, cast=int)

# Cache Configuration (Redis recommended for production)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'cvflo-cache',
        'TIMEOUT': 300,  # 5 minutes default
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
        }
    }
}

# Cache timeouts for different operations
PDF_CACHE_TIMEOUT = config('PDF_CACHE_TIMEOUT', default=3600, cast=int)  # 1 hour

# Background Task Configuration (for future Celery integration)
BACKGROUND_TASKS = {
    'PDF_GENERATION_ENABLED': config('BACKGROUND_PDF_ENABLED', default=False, cast=bool),
    'CLEANUP_INTERVAL_HOURS': config('CLEANUP_INTERVAL', default=24, cast=int),
    'MAX_CONCURRENT_TASKS': config('MAX_CONCURRENT_TASKS', default=5, cast=int),
}

# API Versioning
API_VERSION = '1.0.0'

# File Upload Settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB

# User Session Configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'
SESSION_CACHE_ALIAS = 'default'
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# Development settings
if DEBUG:
    # Add development-specific settings
    CORS_ALLOW_ALL_ORIGINS = True
    
    # Add Django Debug Toolbar if available
    try:
        import debug_toolbar
        INSTALLED_APPS += ['debug_toolbar']
        MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
        INTERNAL_IPS = ['127.0.0.1', '0.0.0.0']
    except ImportError:
        pass