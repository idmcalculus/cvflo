# CV Builder Server

A TypeScript-based Express server for generating PDF CVs from structured data, powered by Bun.

## Features

- PDF generation using Puppeteer
- TypeScript for better type safety and developer experience
- Clean architecture following SOLID principles
- Input validation
- Error handling
- Security headers and rate limiting
- Logging
- Blazingly fast performance with Bun runtime

## Project Structure

```
server/
├── src/
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── middleware/      # Custom middleware
│   ├── routes/          # Route definitions
│   ├── utils/           # Utility functions
│   ├── config/          # Configuration
│   ├── types/           # Type definitions
│   ├── app.ts           # App initialization
│   └── server.ts        # Entry point
├── .env.example         # Example environment variables
├── .gitignore           # Git ignore file
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript configuration
└── README.md            # This file
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0 or higher)

### Installation

1. Clone the repository
2. Navigate to the server directory:
   ```bash
   cd server
   ```
3. Install dependencies with Bun:
   ```bash
   bun install
   ```
4. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

### Development

Run the development server with hot reloading:

```bash
bun dev
```

### Building for Production

Build the TypeScript project:

```bash
bun run build
```

### Running in Production

Start the production server:

```bash
bun start
```

## API Reference

### Generate PDF

```
POST /api/generate-pdf
```

Request body:

```json
{
  "data": {
    "personalInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "123-456-7890",
      "address": "New York, NY",
      "website": "https://johndoe.com",
      "title": "Senior Software Engineer",
      "summary": "Experienced software engineer with 10+ years of experience"
    },
    "experiences": [...],
    "education": [...],
    "projects": [...],
    "skills": [...],
    "interests": [...],
    "references": [...]
  },
  "visibility": {
    "header": true,
    "experience": true,
    "education": true,
    "projects": true,
    "skills": true,
    "interests": true,
    "references": true
  }
}
```

Response:

- Content-Type: application/pdf
- Content-Disposition: attachment; filename=John_Doe.pdf
- PDF file content in the response body

## Security Considerations

- All sensitive data should be stored in environment variables
- Never commit `.env` files to version control
- Input validation is performed on all API endpoints
- Rate limiting is implemented to prevent abuse
- Security headers are set using helmet middleware
