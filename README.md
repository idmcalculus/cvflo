# CVFlo

A modern, full-stack CV builder application that allows users to create professional CVs with multiple templates and export them as PDF files.

## 🚀 Features

- **Modern UI**: Clean, responsive interface built with React 19 and Tailwind CSS
- **Multiple Templates**: Choose from Classic, Modern, and Academic CV templates
- **Real-time Preview**: See your CV update in real-time as you edit
- **Rich Text Editor**: Quill-powered editor for detailed descriptions
- **PDF Export**: High-quality PDF generation with professional formatting
- **Auto-save**: Automatic persistence of your work
- **Section Management**: Toggle CV sections on/off for customization
- **Form Validation**: Comprehensive input validation and error handling

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS 4.x** for styling
- **Zustand** for state management
- **Quill** for rich text editing
- **Vite** for development and building

### Backend
- **Express.js** with TypeScript
- **Bun** runtime for performance
- **Puppeteer** for PDF generation
- **Winston** for logging
- **Helmet** for security

## 📁 Project Structure

```
cvflo/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── store/          # Zustand store
│   │   └── types/          # TypeScript definitions
│   └── ...
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── utils/          # Utility functions
│   └── templates/          # PDF templates
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (latest version)
- Git

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd cvflo
```

2. **Install dependencies:**
```bash
# Install server dependencies
cd server
bun install

# Install client dependencies
cd ../client
bun install
```

3. **Set up environment variables:**
```bash
# In server directory
cp .env.example .env
# Edit .env with your configuration
```

4. **Start development servers:**
```bash
# Option 1: Full-stack development (recommended)
cd server
bun run dev:full

# Option 2: Separate terminals
# Terminal 1 - Backend
cd server
bun run dev

# Terminal 2 - Frontend
cd client
bun run dev
```

5. **Open your browser:**
   - Application: `http://localhost:3000`
   - API: `http://127.0.0.1:8000`

## 📦 Available Scripts

### Server Scripts
```bash
bun run dev          # Start development server with hot reload
bun run start        # Start production server
bun run build        # Build TypeScript
bun run test         # Run tests
bun run dev:full     # Build client + start server (full-stack dev)
bun run start:full   # Build client + start production server
```

### Client Scripts
```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run lint         # Run ESLint
bun run preview      # Preview production build
```

## 🚀 Deployment

### Railway (Recommended)

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Deploy:**
```bash
cd server
railway login
railway init
railway up
```

### Other Platforms

- **Vercel**: Deploy from `/server` directory
- **Render**: Use Docker with Bun runtime
- **Google Cloud Run**: Containerized deployment

## 🧪 Testing

Run the test suite:
```bash
cd server
bun run test           # Run all tests
bun run test:watch     # Run tests in watch mode
bun run test:coverage  # Run tests with coverage
```

## 📄 API Documentation

### Endpoints

- `POST /api/generate-pdf` - Generate PDF from CV data
- `GET /api/health` - Health check endpoint

### Request Format
```json
{
  "personalInfo": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "workExperience": [...],
  "education": [...],
  "skills": [...],
  "template": "modern-0"
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5001` |
| `NODE_ENV` | Environment | `development` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use existing code patterns and conventions
- Add tests for new features
- Ensure linting passes before committing
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Puppeteer](https://puppeteer.js.org/) for PDF generation
- [Quill](https://quilljs.com/) for rich text editing
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Zustand](https://github.com/pmndrs/zustand) for state management

## 🐛 Issues and Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce the problem

## 🔮 Roadmap

- [ ] User authentication and accounts
- [ ] Template customization
- [ ] Multiple CV management
- [ ] Export to different formats (Word, HTML)
- [ ] Social media integration
- [ ] Advanced analytics

---

**Built with ❤️ using Bun, React, and TypeScript**