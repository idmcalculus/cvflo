import { describe, it, expect, beforeEach } from 'bun:test';
import * as cheerio from 'cheerio';
import { HtmlGenerator } from '../../src/utils/htmlGenerator.ts';
import { CVData, SectionVisibility } from '../../src/types/cv.ts';

describe('HtmlGenerator', () => {
  let htmlGenerator: HtmlGenerator;
  let mockCVData: CVData;
  let mockVisibility: SectionVisibility;

  beforeEach(() => {
    htmlGenerator = new HtmlGenerator();
    
    mockCVData = {
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        title: 'Software Engineer',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        linkedin: 'https://linkedin.com/in/johndoe'
      },
      summary: 'Experienced software developer with 5+ years of experience',
      workExperience: [
        {
          id: '1',
          company: 'Tech Corp',
          position: 'Senior Developer',
          location: 'New York, NY',
          startDate: '2020-01-01',
          endDate: '2023-12-31',
          description: 'Led development of web applications',
          current: false
        }
      ],
      education: [
        {
          id: '1',
          institution: 'University of Technology',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          location: 'Boston, MA',
          description: 'Focused on software engineering and algorithms',
          startDate: '2016-09-01',
          endDate: '2020-05-01',
          current: false
        }
      ],
      skills: [
        { id: '1', name: 'JavaScript', level: 5, category: 'Programming Languages' },
        { id: '2', name: 'TypeScript', level: 4, category: 'Programming Languages' },
        { id: '3', name: 'React', level: 4, category: 'Frameworks' },
        { id: '4', name: 'Node.js', level: 4, category: 'Runtime' }
      ],
      projects: [
        {
          id: '1',
          title: 'E-commerce Platform',
          description: 'Full-stack e-commerce solution',
          technologies: ['React', 'Node.js', 'MongoDB'],
          liveUrl: 'https://example.com',
          githubUrl: 'https://github.com/johndoe/ecommerce',
          startDate: '2022-01-01',
          endDate: '2022-06-01',
          current: false
        }
      ],
      interests: [
        { id: '1', name: 'Photography' },
        { id: '2', name: 'Hiking' }
      ],
      references: [
        { id: '1', name: 'John Smith', position: 'Manager', company: 'Tech Corp', email: 'john.smith@techcorp.com', phone: '+1234567890' }
      ]
    };

    mockVisibility = {
      summary: true,
      workExperience: true,
      education: true,
      skills: true,
      projects: true,
      interests: true,
      references: true
    };
  });

  describe('generateHTML', () => {
    it('should generate a valid HTML document structure', async () => {
      const html = await htmlGenerator.generateHTML(mockCVData, mockVisibility);
      const $ = cheerio.load(html);

      expect(html.trim().startsWith('<!DOCTYPE html>')).toBe(true);
      expect($('html[lang="en"]').length).toBe(1);
      expect($('head').length).toBe(1);
      expect($('body').length).toBe(1);
      expect($('title').text()).toBe('John Doe - Resume');
    });

    it('should include personal information section with all details', async () => {
      const html = await htmlGenerator.generateHTML(mockCVData, mockVisibility);
      const $ = cheerio.load(html);

      const header = $('header');
      expect(header.find('h1').text().trim()).toBe('John Doe');
      expect(header.find('h2').text().trim()).toBe('Software Engineer');

      const contactInfo = header.find('.flex-wrap').text();
      expect(contactInfo).toContain('john.doe@example.com');
      expect(contactInfo).toContain('+1234567890');
      expect(contactInfo).toContain('123 Main St, New York, NY, 10001, USA');
      expect(header.find('a[href="https://linkedin.com/in/johndoe"]').length).toBe(1);
    });

    it('should include summary section when visible', async () => {
      const html = await htmlGenerator.generateHTML(mockCVData, mockVisibility);
      const $ = cheerio.load(html);

      const summarySection = $('#summary-section');
      expect(summarySection.length).toBe(1);
      expect(summarySection.find('h2').text()).toBe('Summary');
      expect(summarySection.find('p').text()).toBe('Experienced software developer with 5+ years of experience');
    });

    it('should exclude summary section when not visible', async () => {
      mockVisibility.summary = false;
      const html = await htmlGenerator.generateHTML(mockCVData, mockVisibility);
      const $ = cheerio.load(html);

      expect($('#summary-section').length).toBe(0);
    });

    it('should include work experience section with correct details', async () => {
      const html = await htmlGenerator.generateHTML(mockCVData, mockVisibility);
      const $ = cheerio.load(html);

      const expSection = $('#experience-section');
      expect(expSection.length).toBe(1);
      expect(expSection.find('.content-grid').length).toBe(1);
      const expItem = expSection.find('.content-grid').first();
      expect(expItem.text()).toContain('Senior Developer');
      expect(expItem.text()).toContain('Tech Corp');
      expect(expItem.text()).toContain('New York, NY');
      expect(expItem.text()).toContain('Led development of web applications');
    });

    it('should format dates correctly for work experience', async () => {
      const html = await htmlGenerator.generateHTML(mockCVData, mockVisibility);
      const $ = cheerio.load(html);

      const dateElement = $('#experience-section .date-col');
      expect(dateElement.text()).toContain('January 2020 - December 2023');
    });

    it('should handle current position correctly', async () => {
      mockCVData.workExperience![0].current = true;
      const html = await htmlGenerator.generateHTML(mockCVData, mockVisibility);
      const $ = cheerio.load(html);

      const dateElement = $('#experience-section .date-col');
      expect(dateElement.text()).toContain('January 2020 - Present');
    });

    it('should exclude education section when not visible', async () => {
      mockVisibility.education = false;
      const html = await htmlGenerator.generateHTML(mockCVData, mockVisibility);
      const $ = cheerio.load(html);

      expect($('#education-section').length).toBe(0);
    });

    it('should include skills section and its items', async () => {
        const html = await htmlGenerator.generateHTML(mockCVData, mockVisibility);
        const $ = cheerio.load(html);

        const skillsSection = $('#skills-section');
        expect(skillsSection.length).toBe(1);
        expect(skillsSection.find('span:contains("JavaScript")').length).toBe(1);
        expect(skillsSection.find('span:contains("(5/5)")').length).toBe(1);
        expect(skillsSection.find('span:contains("TypeScript")').length).toBe(1);
        expect(skillsSection.find('span:contains("(4/5)")').length).toBe(3);
    });

    it('should exclude projects section when not visible', async () => {
      mockVisibility.projects = false;
      const html = await htmlGenerator.generateHTML(mockCVData, mockVisibility);
      const $ = cheerio.load(html);

      expect($('#projects-section').length).toBe(0);
    });

    it('should handle missing optional fields gracefully', async () => {
      const partialCVData: CVData = {
        personalInfo: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '', address: '', title: '', city: '', state: '', zipCode: '', country: '', linkedin: ''
        },
        summary: '',
        workExperience: [],
        education: [],
        skills: [],
        projects: [],
        interests: [],
        references: []
      };

      const html = await htmlGenerator.generateHTML(partialCVData, mockVisibility);
      const $ = cheerio.load(html);

      expect($('h1').text()).toContain('Jane Smith');
      expect($('header').text()).toContain('jane.smith@example.com');
      expect($('#summary-section').length).toBe(0);
      expect($('#experience-section').length).toBe(0);
      expect($('#education-section').length).toBe(0);
      expect($('#skills-section').length).toBe(0);
      expect($('#projects-section').length).toBe(0);
    });

    // Comprehensive visibility integration tests
    describe('Section Visibility Integration', () => {
      it('should exclude work experience section when visibility is false', async () => {
        mockVisibility.workExperience = false;
        const html = await htmlGenerator.generateHTML(mockCVData, mockVisibility);
        const $ = cheerio.load(html);

        expect($('#experience-section').length).toBe(0);
        expect($('h2:contains("Work Experience")').length).toBe(0);
      });

      it('should exclude skills section when visibility is false', async () => {
        mockVisibility.skills = false;
        const html = await htmlGenerator.generateHTML(mockCVData, mockVisibility);
        const $ = cheerio.load(html);

        expect($('#skills-section').length).toBe(0);
        expect($('h2:contains("Skills")').length).toBe(0);
      });

      it('should exclude interests section when visibility is false', async () => {
        mockVisibility.interests = false;
        const html = await htmlGenerator.generateHTML(mockCVData, mockVisibility);
        const $ = cheerio.load(html);

        expect($('#interests-section').length).toBe(0);
        expect($('h2:contains("Interests")').length).toBe(0);
      });

      it('should exclude references section when visibility is false', async () => {
        mockVisibility.references = false;
        const html = await htmlGenerator.generateHTML(mockCVData, mockVisibility);
        const $ = cheerio.load(html);

        expect($('#references-section').length).toBe(0);
        expect($('h2:contains("References")').length).toBe(0);
      });

      it('should handle multiple sections being hidden simultaneously', async () => {
        mockVisibility.summary = false;
        mockVisibility.workExperience = false;
        mockVisibility.education = false;
        mockVisibility.projects = false;

        const html = await htmlGenerator.generateHTML(mockCVData, mockVisibility);
        const $ = cheerio.load(html);

        expect($('#summary-section').length).toBe(0);
        expect($('#experience-section').length).toBe(0);
        expect($('#education-section').length).toBe(0);
        expect($('#projects-section').length).toBe(0);

        // But skills, interests, and references should still be visible
        expect($('#skills-section').length).toBe(1);
        expect($('#interests-section').length).toBe(1);
        expect($('#references-section').length).toBe(1);
      });

      it('should show only personal info when all optional sections are hidden', async () => {
        const allHiddenVisibility = {
          summary: false,
          workExperience: false,
          education: false,
          projects: false,
          skills: false,
          interests: false,
          references: false
        };

        const html = await htmlGenerator.generateHTML(mockCVData, allHiddenVisibility);
        const $ = cheerio.load(html);

        // Personal info should always be visible
        expect($('h1').text()).toContain('John Doe');

        // All optional sections should be hidden
        expect($('#summary-section').length).toBe(0);
        expect($('#experience-section').length).toBe(0);
        expect($('#education-section').length).toBe(0);
        expect($('#projects-section').length).toBe(0);
        expect($('#skills-section').length).toBe(0);
        expect($('#interests-section').length).toBe(0);
        expect($('#references-section').length).toBe(0);
      });
    });
  });
});
