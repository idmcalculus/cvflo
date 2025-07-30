# Django Client Integration Guide

This Django backend serves the React client as static files, identical to how the Node.js server works.

## 🎯 **Equivalent Workflow to Node.js Server**

### **Node.js Package.json Scripts → Django Management Commands**

| Node.js Command | Django Command | Description |
|----------------|----------------|-------------|
| `bun run dev` | `python manage.py runserver` | Start development server |
| `bun run start` | `python manage.py runserver 0.0.0.0:8000` | Start production server |
| `bun run build:client` | `python manage.py build_client` | Build React client |
| `bun run setup:public` | *Automatic in build_client* | Move build to public/ |
| `bun run dev:full` | `python manage.py dev_full` | Build client + start dev server |
| `bun run start:full` | `python manage.py start_full` | Build client + start prod server |

## 🚀 **Quick Start (Same as Node.js Experience)**

```bash
# Activate Django environment
cd backend
source venv/bin/activate

# Full development setup (builds client + starts server)
python manage.py dev_full

# Or step by step:
python manage.py build_client --clean  # Build React app
python manage.py runserver             # Start Django server

# Production setup
python manage.py start_full --gunicorn
```

## 📁 **File Structure (Matches Node.js)**

```
backend/
├── public/              # ← React build files (like Node.js server/public/)
│   ├── index.html
│   └── assets/
├── manage.py
├── venv/
└── apps/
```

## 🌐 **How It Works**

### **1. Static File Serving**
```python
# Django settings.py
STATICFILES_DIRS = [
    BASE_DIR / 'public',  # Serves React build files
]
```

### **2. SPA Routing (Equivalent to Node.js Fallback)**
```python
# All non-API routes serve React app
re_path(r'^(?!api/)(?!admin/)(?!static/).*$', SPAView.as_view())
```

### **3. API Routes (Unchanged)**
- `GET /api/` - API root
- `POST /api/cv/` - CV data endpoints  
- `POST /api/pdf/generate-pdf` - PDF generation
- `GET /admin/` - Django admin

## 🔄 **Development Workflow**

### **Initial Setup**
```bash
# First time setup
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py build_client --clean
python manage.py runserver
```

### **Daily Development**
```bash
# Quick start (if client already built)
python manage.py runserver

# Full rebuild + start
python manage.py dev_full

# Just rebuild client
python manage.py build_client
```

## 🎨 **Client Configuration**

The React client works with **relative API paths** just like with Node.js:

```javascript
// In React components
fetch('/api/cv/data')           // ✅ Works
fetch('/api/pdf/generate-pdf')  // ✅ Works  
fetch('/api/auth/login')        // ✅ Works
```

## 🔧 **Advanced Commands**

```bash
# Build client with cleanup
python manage.py build_client --clean

# Development server with custom port
python manage.py dev_full --port 3000

# Production server with Gunicorn
python manage.py start_full --gunicorn --port 8000

# Django admin user
python manage.py createsuperuser
```

## 📊 **Comparison with Node.js Server**

| Feature | Node.js Server | Django Backend |
|---------|---------------|----------------|
| **Static Files** | `express.static('public')` | `STATICFILES_DIRS` |
| **SPA Fallback** | Custom middleware | `SPAView` |
| **API Routes** | Express routes | Django URLs |
| **Build Script** | `package.json` scripts | Management commands |
| **Client Serving** | ✅ Same files | ✅ Same files |
| **Relative Paths** | ✅ Works | ✅ Works |

## 🎉 **Result**

Your React client works **identically** whether served by:
- Node.js server at `http://localhost:3000`
- Django backend at `http://localhost:8000`

**Same features:**
- ✅ React SPA routing
- ✅ Relative API calls  
- ✅ Static asset serving
- ✅ Build integration
- ✅ Development workflow