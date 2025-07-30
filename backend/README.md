# CVFlo Django Backend

A comprehensive Django-based backend for the CVFlo CV Builder application, designed to replace and enhance the functionality of the original Node.js/Express server while leveraging Django's "batteries included" philosophy.

## 🚀 Features

- **CV Data Management**: Complete CRUD operations for CV profiles, work experience, education, projects, skills, and more
- **PDF Generation**: High-quality PDF generation using WeasyPrint (replaces Puppeteer)
- **Multiple Templates**: Support for various CV templates (Classic, Modern, Academic)
- **Supabase Integration**: Seamless authentication integration with existing Supabase setup
- **Django Admin**: Comprehensive admin interface for CV and template management
- **REST API**: Full-featured REST API using Django REST Framework
- **Security**: Advanced security middleware, rate limiting, and CORS support
- **Database**: PostgreSQL support with optimized queries and relationships

## 🏗 Architecture

### Apps Structure

```
backend/
├── cvflo/                      # Main Django project
├── apps/
│   ├── core/                   # Shared utilities, middleware
│   ├── cv_builder/             # CV data models and APIs
│   ├── pdf_generation/         # PDF generation service
│   └── authentication/        # Supabase authentication
├── templates/cv/              # Django templates for PDF generation
├── tests/                     # Comprehensive test suite
└── requirements.txt           # Python dependencies
```

### Key Components

1. **Models**: Django models equivalent to TypeScript interfaces from Node.js server
2. **API Endpoints**: Django REST Framework APIs matching original routes
3. **PDF Service**: WeasyPrint-based PDF generation replacing Puppeteer
4. **Authentication**: Supabase JWT token authentication
5. **Admin Interface**: Django admin for data management
6. **Middleware**: Security, logging, and rate limiting

## 📋 Prerequisites

- Python 3.8+
- PostgreSQL 12+
- Redis (for caching and rate limiting)
- Node.js (for frontend integration)

## 🛠 Installation

### 1. Clone and Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Django Configuration
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Database Configuration
DB_NAME=cvflo
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Database Setup

```bash
# Create database
createdb cvflo

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### 4. Static Files and Templates

```bash
# Collect static files
python manage.py collectstatic
```

## 🚀 Running the Server

### Development

```bash
python manage.py runserver
```

The server will be available at `http://localhost:8000`

### Production

```bash
# Using Gunicorn
gunicorn cvflo.wsgi:application --bind 0.0.0.0:8000

# Or using uWSGI
uwsgi --http :8000 --module cvflo.wsgi
```

## 📊 Admin Interface

Access the Django Admin at `http://localhost:8000/admin/`

Features:
- CV Profile management with inline editing
- User management with CV statistics
- Template configuration
- Bulk operations and filtering
- Advanced search and filtering

## 🔧 API Endpoints

### CV Data Management

```
GET    /api/cv/data/          # Get user's CV data
POST   /api/cv/data/          # Create/save CV data
PUT    /api/cv/data/          # Update CV data
DELETE /api/cv/data/          # Delete CV data
```

### PDF Generation

```
POST   /api/pdf/generate-pdf/           # Generate PDF from CV data
POST   /api/pdf/generate-preview/       # Generate HTML preview
POST   /api/pdf/generate-pdf-from-html/ # Generate PDF from HTML
GET    /api/pdf/templates/              # Get available templates
GET    /api/pdf/health/                 # PDF service health check
```

### Authentication

```
POST   /api/auth/verify/       # Verify Supabase token
GET    /api/auth/profile/      # Get user profile
PUT    /api/auth/profile/      # Update user profile
POST   /api/auth/logout/       # Logout user
```

### System

```
GET    /health/                # System health check
GET    /api/                   # API root
```

## 📝 Templates

### Available Templates

1. **Classic (classic-0)**: Traditional single-column layout
2. **Modern (modern-0)**: Two-column modern design with sidebar
3. **Modern v2 (modern-1)**: Alternative modern layout
4. **Academic (academic-0)**: Academic-focused template

### Adding New Templates

1. Create HTML template in `templates/cv/template-name.html`
2. Add configuration to `settings.CV_TEMPLATES`
3. Create corresponding CSS file in `static/css/template-name.css`
4. Add template to database via admin or migration

## 🧪 Testing

### Running Tests

```bash
# Using Django's test runner
python manage.py test

# Using pytest (recommended)
pytest

# With coverage
pytest --cov=apps --cov-report=html

# Run specific test categories
pytest -m "unit"           # Unit tests only
pytest -m "integration"    # Integration tests only
pytest -m "not slow"       # Skip slow tests
```

### Test Structure

- `tests/test_cv_builder.py`: CV data model and API tests
- `tests/test_pdf_generation.py`: PDF generation service tests
- `tests/test_authentication.py`: Authentication tests
- `tests/conftest.py`: Pytest configuration and fixtures

## 🔒 Security Features

### Rate Limiting

- Global rate limiting: 60 requests/minute per IP/user
- PDF generation: 10 PDFs per 15 minutes per user
- Preview generation: 100 previews per 5 minutes per user
- API endpoints: 1000 requests per hour per user

### Security Headers

- Content Security Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection
- HSTS (in production)

### Authentication

- Supabase JWT token validation
- User profile synchronization
- Permission-based access control
- Session management

## 📈 Performance

### Optimizations

- Database query optimization with select_related/prefetch_related
- Django caching framework integration
- Optimized PDF generation with WeasyPrint
- Static file serving optimization
- Connection pooling for database

### Monitoring

- Comprehensive logging with structured JSON format
- Request/response timing middleware
- Health check endpoints for monitoring
- Error tracking and reporting

## 🔄 Migration from Node.js

### API Compatibility

The Django API maintains compatibility with the existing frontend:

- Same endpoint paths (with `/api/` prefix)
- Identical request/response formats
- Preserved authentication flow
- Matching error response structure

### Key Differences

1. **PDF Generation**: WeasyPrint instead of Puppeteer
2. **Templates**: Django template system instead of Handlebars
3. **Database**: Django ORM instead of direct SQL
4. **Admin**: Built-in Django admin instead of custom interface
5. **Authentication**: Django integration with Supabase

## 🐳 Docker Support (Future)

```dockerfile
# Example Dockerfile structure
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "cvflo.wsgi:application"]
```

## 📚 Additional Resources

### Django Documentation
- [Django Official Docs](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [WeasyPrint Documentation](https://weasyprint.readthedocs.io/)

### Project-Specific
- Frontend integration guide
- Template customization guide
- Deployment documentation
- API reference documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review existing issues
- Create a new issue with detailed information
- Contact the development team

---

**Note**: This Django backend provides a robust, scalable alternative to the Node.js server while maintaining full API compatibility and adding powerful Django-specific features like the admin interface and ORM capabilities.