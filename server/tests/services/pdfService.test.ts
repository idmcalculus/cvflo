import { describe, it, expect, beforeEach, mock, type Mock } from 'bun:test';

// --- External library mock (puppeteer) ---
import type { Browser, Page } from 'puppeteer';
const launchMock = mock<() => Promise<Browser>>();
mock.module('puppeteer', () => ({
  default: {
    launch: launchMock,
  },
}));

// --- Internal utility mocks ---
const mockLoggerError = mock();
mock.module('../../src/utils/logger.ts', () => ({
  createAppLogger: () => ({
    info: mock(),
    warn: mock(),
    error: mockLoggerError,
  }),
}));

const mockGenerateHTML = mock().mockReturnValue('<html><body>Mock CV</body></html>');
mock.module('../../src/utils/htmlGenerator.ts', () => ({
  HtmlGenerator: class MockHtmlGenerator {
    generateHTML = mockGenerateHTML;
  },
}));

import type { CVData, SectionVisibility, PersonalInfo } from '../../src/types/cv.ts';
import { InternalServerError } from '../../src/utils/errors.ts';

describe('PdfService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pdfService: any; // Will be instantiated after dynamic import of PdfService
  let mockCVData: CVData;
  let mockVisibility: SectionVisibility;
  let mockPersonalInfo: PersonalInfo;
  let mockBrowser: { newPage: Mock<() => Promise<Page>>; close: Mock<() => Promise<void>> };
  let mockPage: { setContent: Mock<() => Promise<void>>; pdf: Mock<() => Promise<Buffer>>; evaluate: Mock<() => Promise<void>> };

  beforeEach(async () => {
    // Reset history and default implementations for top-level mock functions
    mockLoggerError.mockReset();
    launchMock.mockReset();
    mockGenerateHTML.mockReset();

    // Default successful mock implementations (can be overridden in specific tests)
    mockGenerateHTML.mockReturnValue('<html><body>Mock CV</body></html>');

    // Set up fresh page / browser mocks for each test
    mockPage = {
      setContent: mock().mockResolvedValue(undefined),
      pdf: mock().mockResolvedValue(Buffer.from('mock-pdf-content')),
      evaluate: mock().mockResolvedValue(undefined),
    } as unknown as typeof mockPage;

    mockBrowser = {
      newPage: mock().mockResolvedValue(mockPage as unknown as Page),
      close: mock().mockResolvedValue(undefined),
    } as unknown as typeof mockBrowser;

    // Ensure launchMock points to the fresh browser mock and has a default successful resolution
    launchMock.mockResolvedValue(mockBrowser as unknown as Browser);

    // Dynamically import PdfService (it will now pick up the top-level mocked modules)
    const { PdfService } = await import(`../../src/services/pdfService.ts?v=${Date.now()}`);
    pdfService = new PdfService();

    // Prepare common test data
    mockPersonalInfo = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '123-456-7890',
      address: '123 Main St, Anytown, USA',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'USA',
      title: 'Software Engineer',
      linkedin: 'linkedin.com/in/johndoe',
    };

    mockCVData = { personalInfo: mockPersonalInfo, summary: 'summary', workExperience: [], education: [], skills: [], projects: [], interests: [], references: [] };
    mockVisibility = { summary: true, workExperience: true, education: true, skills: true, projects: true, interests: true, references: true };
  });

  describe('generatePdf', () => {
    it('should generate a PDF successfully', async () => {
      const pdfBuffer = await pdfService.generatePdf(mockCVData, mockVisibility);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(launchMock).toHaveBeenCalledTimes(1);
      expect(mockBrowser.newPage).toHaveBeenCalledTimes(1);
      expect(mockPage.setContent).toHaveBeenCalledTimes(1);
      expect(mockPage.pdf).toHaveBeenCalledTimes(1);
      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
    });

    it('should clean up resources even if PDF generation fails', async () => {
      const pdfError = new Error('PDF generation failed');
      mockPage.pdf.mockRejectedValue(pdfError);

      await expect(pdfService.generatePdf(mockCVData, mockVisibility)).rejects.toThrow(
        new InternalServerError(`Failed to generate PDF: ${pdfError.message}`),
      );
      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
    });

    it('should log an error and throw InternalServerError if launching puppeteer fails', async () => {
      const launchError = new Error('Puppeteer launch failed');
      launchMock.mockRejectedValue(launchError);

      await expect(pdfService.generatePdf(mockCVData, mockVisibility)).rejects.toThrow(
        new InternalServerError(`Failed to generate PDF: ${launchError.message}`),
      );

      expect(mockLoggerError).toHaveBeenCalledWith(
        'Error generating PDF',
        expect.objectContaining({
          error: launchError.message,
        }),
      );
    });
  });

  describe('getSuggestedFilename', () => {
    it('should generate a filename from personal info', () => {
      const filename = pdfService.getSuggestedFilename(mockCVData);
      expect(filename).toBe('John_Doe_Resume.pdf');
    });

    it('should return a default filename if personal info is missing', () => {
      const dataWithoutInfo = { ...mockCVData, personalInfo: undefined };
      const filename = pdfService.getSuggestedFilename(dataWithoutInfo);
      expect(filename).toBe('resume.pdf');
    });

    it('should handle missing first or last name gracefully', () => {
      const dataWithoutLastName = {
        ...mockCVData,
        personalInfo: { ...mockPersonalInfo, lastName: '' },
      };
      const filename = pdfService.getSuggestedFilename(dataWithoutLastName);
      expect(filename).toBe('John_Resume.pdf');
    });
  });
});
