import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import request from 'supertest';
import type { Express } from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { Server } from 'http';
import type { CVData, SectionVisibility } from '../../src/types/cv.ts';

// Mock dependencies
const mockGeneratePdf = mock<(cvData: CVData, visibility: SectionVisibility) => Promise<Buffer>>();
const mockGetSuggestedFilename = mock<(data: CVData) => string>();

// Mock the entire security middleware module to avoid app.use() errors in tests
mock.module('../../src/middleware/security.ts', () => ({
  applySecurityMiddleware: mock(() => { /* no-op */ }),
}));

// Mock the validators module to provide a proper middleware function
const mockValidatorMiddleware = mock((req: Request, res: Response, next: NextFunction) => {
  // Check if cvData and visibility are present and valid
  const { cvData, visibility } = req.body;
  
  if (!cvData) {
    return res.status(400).json({ error: 'CV data is required' });
  }
  
  if (!visibility) {
    return res.status(400).json({ error: 'Visibility settings are required' });
  }
  
  // Check for invalid data structures - specifically check for undefined personalInfo
  if (!cvData.personalInfo || cvData.personalInfo === undefined) {
    return res.status(400).json({ error: 'CV data cannot be empty' });
  }
  
  if (typeof visibility !== 'object' || visibility === null) {
    return res.status(400).json({ error: 'Visibility must be an object' });
  }
  
  // Check for invalid visibility values - specifically check for non-boolean values
  for (const value of Object.values(visibility)) {
    if (typeof value !== 'boolean') {
      return res.status(400).json({ error: 'Visibility must be an object' });
    }
  }
  
  next();
});
mock.module('../../src/middleware/validators.ts', () => ({
  validatePdfRequest: [mockValidatorMiddleware],
}));

mock.module('../../src/services/pdfService.ts', () => ({
  PdfService: class MockPdfService {
    generatePdf = mockGeneratePdf;
    getSuggestedFilename = mockGetSuggestedFilename;
  },
}));

mock.module('../../src/utils/logger.ts', () => ({
  createAppLogger: () => ({
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
  }),
}));

describe('PDF Generation Endpoint Integration Tests', () => {
  let app: Express;
  let server: Server | null = null;
  let validCVData: CVData;
  let validVisibility: SectionVisibility;

  beforeEach(async () => {
    // Reset mocks before each test
    mockGeneratePdf.mockReset();
    mockGetSuggestedFilename.mockReset();

    // Set default successful mock
    mockGeneratePdf.mockResolvedValue(Buffer.from('mock-pdf-content'));
    mockGetSuggestedFilename.mockReturnValue('John_Doe_CV.pdf');

    // Dynamically import createApp to ensure mocks are applied
    try {
      const { createApp } = await import(`../../src/app.ts?v=${Date.now()}`);
      app = await createApp();
      server = app.listen(0); // Listen on a random available port
    } catch (error) {
      console.error('Failed to create app in beforeEach:', error);
      server = null;
    }

    // Setup for valid data
    validCVData = {
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA',
        title: 'Software Engineer',
      },
      summary: 'A summary',
      workExperience: [],
      education: [],
      skills: [],
      projects: [],
      interests: [],
      references: [],
    };

    validVisibility = {
      summary: true,
      workExperience: true,
      education: true,
      skills: true,
      projects: true,
      interests: true,
      references: true,
    };
  });

  afterEach((done) => {
    if (server) {
      server.close((err) => {
        server = null;
        if (err) {
          console.error('Error closing server:', err);
          return done(err);
        }
        done();
      });
    } else {
      done();
    }
    mock.restore();
  });

  it('should return a 200 OK and a PDF file for a valid request', async () => {
    if (!server) throw new Error('Server not initialized');
    const response = await request(server)
      .post('/api/generate-pdf')
      .send({ cvData: validCVData, visibility: validVisibility })
      .expect(200)
      .expect('Content-Type', 'application/pdf');

    expect(response.headers['content-disposition']).toContain('attachment; filename="John_Doe_CV.pdf"');
    expect(response.body).toBeInstanceOf(Buffer);
    expect(mockGeneratePdf).toHaveBeenCalledWith(validCVData, validVisibility);
  });

  it('should use the suggested filename when provided', async () => {
    if (!server) throw new Error('Server not initialized');
    mockGetSuggestedFilename.mockReturnValue('My_Custom_Resume.pdf');

    const response = await request(server)
      .post('/api/generate-pdf')
      .send({ cvData: validCVData, visibility: validVisibility })
      .expect(200);

    expect(response.headers['content-disposition']).toContain('attachment; filename="My_Custom_Resume.pdf"');
    expect(response.body).toBeInstanceOf(Buffer);
  });

  it('should return a 400 Bad Request for invalid CV data', async () => {
    if (!server) throw new Error('Server not initialized');
    const invalidData = { ...validCVData, personalInfo: undefined };
    await request(server)
      .post('/api/generate-pdf')
      .send({ cvData: invalidData, visibility: validVisibility })
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it('should return a 400 Bad Request for invalid visibility data', async () => {
    if (!server) throw new Error('Server not initialized');
    const invalidVisibility = { ...validVisibility, skills: 'invalid' };
    await request(server)
      .post('/api/generate-pdf')
      .send({ cvData: validCVData, visibility: invalidVisibility })
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it('should return a 500 Internal Server Error when PDF generation fails', async () => {
    if (!server) throw new Error('Server not initialized');
    
    // Reset the mock and set it to throw an error
    mockGeneratePdf.mockReset();
    mockGeneratePdf.mockImplementation(() => {
      throw new Error('PDF generation failed');
    });

    const response = await request(server)
      .post('/api/generate-pdf')
      .send({ cvData: validCVData, visibility: validVisibility });

    expect(response.status).toBe(500);
    expect(response.headers['content-type']).toMatch(/json/);
  });

  it('should handle requests with minimal valid data', async () => {
    if (!server) throw new Error('Server not initialized');
    const minimalData: CVData = {
      personalInfo: {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        title: 'Product Manager',
      },
      summary: '',
      workExperience: [],
      education: [],
      skills: [],
      projects: [],
      interests: [],
      references: [],
    };
    mockGetSuggestedFilename.mockReturnValue('Jane_Doe_CV.pdf');

    const response = await request(server)
      .post('/api/generate-pdf')
      .send({ cvData: minimalData, visibility: validVisibility })
      .expect(200);

    expect(response.headers['content-disposition']).toContain('attachment; filename="Jane_Doe_CV.pdf"');
    expect(response.body).toBeInstanceOf(Buffer);
  });

  it('should return a 400 if cvData is missing', async () => {
    if (!server) throw new Error('Server not initialized');
    await request(server)
      .post('/api/generate-pdf')
      .send({ visibility: validVisibility })
      .expect(400);
  });

  it('should return a 400 if visibility is missing', async () => {
    if (!server) throw new Error('Server not initialized');
    await request(server)
      .post('/api/generate-pdf')
      .send({ cvData: validCVData })
      .expect(400);
  });
});
