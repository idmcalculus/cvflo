import { describe, it, expect, beforeEach } from 'bun:test';
import * as cheerio from 'cheerio';
import { HandlebarsTemplateService } from '../../src/services/handlebarsTemplateService.ts';
import { CVData, SectionVisibility } from '../../src/types/cv.ts';

describe('Template Visibility Integration', () => {
  let templateService: HandlebarsTemplateService;
  let mockCVData: CVData;
  let allVisibleSettings: SectionVisibility;

  beforeEach(() => {
    templateService = new HandlebarsTemplateService();

    mockCVData = {
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        title: 'Software Engineer',
        linkedin: 'https://linkedin.com/in/johndoe'
      },
      summary: 'Experienced software developer with 5+ years of experience',
      workExperience: [{
        id: '1',
        position: 'Senior Developer',
        company: 'Tech Corp',
        location: 'New York, NY',
        startDate: '2020-01',
        endDate: '2023-12',
        current: false,
        description: 'Led development of web applications'
      }],
      education: [{
        id: '1',
        institution: 'University of Technology',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        location: 'New York, NY',
        startDate: '2016-09',
        endDate: '2020-05',
        current: false,
        description: 'Graduated with honors'
      }],
      projects: [{
        id: '1',
        title: 'E-commerce Platform',
        description: 'Built a full-stack e-commerce platform',
        technologies: ['React', 'Node.js', 'MongoDB'],
        startDate: '2023-01',
        endDate: '2023-06',
        current: false,
        liveUrl: 'https://example.com',
        githubUrl: 'https://github.com/johndoe/ecommerce'
      }],
      skills: [
        { id: '1', name: 'JavaScript', level: 5, category: 'Programming' },
        { id: '2', name: 'TypeScript', level: 4, category: 'Programming' },
        { id: '3', name: 'React', level: 4, category: 'Frameworks' },
        { id: '4', name: 'Node.js', level: 4, category: 'Runtime' }
      ],
      interests: [
        { id: '1', name: 'Photography' },
        { id: '2', name: 'Hiking' },
        { id: '3', name: 'Reading' }
      ],
      references: [{
        id: '1',
        name: 'Jane Smith',
        company: 'Tech Corp',
        position: 'Engineering Manager',
        email: 'jane.smith@techcorp.com',
        phone: '+1234567891'
      }]
    };

    allVisibleSettings = {
      summary: true,
      workExperience: true,
      education: true,
      projects: true,
      skills: true,
      interests: true,
      references: true
    };
  });

  describe('Cross-Template Visibility Consistency', () => {
    const templates = ['classic-0', 'modern-0', 'modern-1', 'academic-0'];

    templates.forEach(templateName => {
      describe(`${templateName} template`, () => {
        it('should respect summary visibility setting', async () => {
          // Test with summary visible
          let html = await templateService.renderCV(templateName, mockCVData, allVisibleSettings);
          let $ = cheerio.load(html);
          expect($('*:contains("Profile"), *:contains("Summary")').length).toBeGreaterThan(0);

          // Test with summary hidden
          const hiddenSummary = { ...allVisibleSettings, summary: false };
          html = await templateService.renderCV(templateName, mockCVData, hiddenSummary);
          $ = cheerio.load(html);
          
          // Should not contain summary content
          expect(html).not.toContain('Experienced software developer with 5+ years of experience');
        });

        it('should respect work experience visibility setting', async () => {
          // Test with work experience visible
          let html = await templateService.renderCV(templateName, mockCVData, allVisibleSettings);
          let $ = cheerio.load(html);
          expect(html).toContain('Senior Developer');
          expect(html).toContain('Tech Corp');

          // Test with work experience hidden
          const hiddenWorkExp = { ...allVisibleSettings, workExperience: false };
          html = await templateService.renderCV(templateName, mockCVData, hiddenWorkExp);
          $ = cheerio.load(html);
          
          // Should not contain work experience content
          expect(html).not.toContain('Senior Developer');
          expect(html).not.toContain('Led development of web applications');
        });

        it('should respect education visibility setting', async () => {
          // Test with education visible
          let html = await templateService.renderCV(templateName, mockCVData, allVisibleSettings);
          expect(html).toContain('University of Technology');
          expect(html).toContain('Computer Science');

          // Test with education hidden
          const hiddenEducation = { ...allVisibleSettings, education: false };
          html = await templateService.renderCV(templateName, mockCVData, hiddenEducation);
          
          // Should not contain education content
          expect(html).not.toContain('University of Technology');
          expect(html).not.toContain('Graduated with honors');
        });

        it('should respect projects visibility setting', async () => {
          // Test with projects visible
          let html = await templateService.renderCV(templateName, mockCVData, allVisibleSettings);
          expect(html).toContain('E-commerce Platform');

          // Test with projects hidden
          const hiddenProjects = { ...allVisibleSettings, projects: false };
          html = await templateService.renderCV(templateName, mockCVData, hiddenProjects);
          
          // Should not contain projects content
          expect(html).not.toContain('E-commerce Platform');
          expect(html).not.toContain('Built a full-stack e-commerce platform');
        });

        it('should respect skills visibility setting', async () => {
          // Test with skills visible
          let html = await templateService.renderCV(templateName, mockCVData, allVisibleSettings);
          expect(html).toContain('JavaScript');
          expect(html).toContain('TypeScript');

          // Test with skills hidden
          const hiddenSkills = { ...allVisibleSettings, skills: false };
          html = await templateService.renderCV(templateName, mockCVData, hiddenSkills);
          
          // Should not contain skills content (but be careful about skills in other sections)
          const skillsInContext = html.match(/JavaScript|TypeScript/g) || [];
          expect(skillsInContext.length).toBe(0);
        });

        it('should respect interests visibility setting', async () => {
          // Test with interests visible
          let html = await templateService.renderCV(templateName, mockCVData, allVisibleSettings);
          expect(html).toContain('Photography');
          expect(html).toContain('Hiking');

          // Test with interests hidden
          const hiddenInterests = { ...allVisibleSettings, interests: false };
          html = await templateService.renderCV(templateName, mockCVData, hiddenInterests);
          
          // Should not contain interests content
          expect(html).not.toContain('Photography');
          expect(html).not.toContain('Hiking');
        });

        it('should respect references visibility setting', async () => {
          // Test with references visible
          let html = await templateService.renderCV(templateName, mockCVData, allVisibleSettings);
          expect(html).toContain('Jane Smith');
          expect(html).toContain('Engineering Manager');

          // Test with references hidden
          const hiddenReferences = { ...allVisibleSettings, references: false };
          html = await templateService.renderCV(templateName, mockCVData, hiddenReferences);
          
          // Should not contain references content
          expect(html).not.toContain('jane.smith@techcorp.com');
          expect(html).not.toContain('Engineering Manager');
        });

        it('should handle multiple sections hidden simultaneously', async () => {
          const multipleHidden = {
            summary: false,
            workExperience: false,
            education: true,
            projects: false,
            skills: true,
            interests: false,
            references: true
          };

          const html = await templateService.renderCV(templateName, mockCVData, multipleHidden);
          
          // Should not contain hidden sections
          expect(html).not.toContain('Experienced software developer');
          expect(html).not.toContain('Senior Developer');
          expect(html).not.toContain('E-commerce Platform');
          expect(html).not.toContain('Photography');
          
          // Should contain visible sections
          expect(html).toContain('University of Technology');
          expect(html).toContain('JavaScript');
          expect(html).toContain('Jane Smith');
        });

        it('should show only personal info when all sections are hidden', async () => {
          const allHidden = {
            summary: false,
            workExperience: false,
            education: false,
            projects: false,
            skills: false,
            interests: false,
            references: false
          };

          const html = await templateService.renderCV(templateName, mockCVData, allHidden);
          
          // Should contain personal info
          expect(html).toContain('John Doe');
          expect(html).toContain('john.doe@example.com');
          
          // Should not contain any section content
          expect(html).not.toContain('Experienced software developer');
          expect(html).not.toContain('Senior Developer');
          expect(html).not.toContain('University of Technology');
          expect(html).not.toContain('E-commerce Platform');
          expect(html).not.toContain('JavaScript');
          expect(html).not.toContain('Photography');
          expect(html).not.toContain('Jane Smith');
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sections gracefully when visible', async () => {
      const emptyCVData: CVData = {
        personalInfo: mockCVData.personalInfo,
        summary: '',
        workExperience: [],
        education: [],
        projects: [],
        skills: [],
        interests: [],
        references: []
      };

      const html = await templateService.renderCV('classic-0', emptyCVData, allVisibleSettings);
      
      // Should contain personal info
      expect(html).toContain('John Doe');
      
      // Should not show section headers for empty sections even when visibility is true
      expect(html).not.toContain('<h2 class="section-title">Work Experience</h2>');
      expect(html).not.toContain('<h2 class="section-title">Education</h2>');
      expect(html).not.toContain('<h2 class="section-title">Projects</h2>');
      expect(html).not.toContain('<h2 class="section-title">Skills</h2>');
      expect(html).not.toContain('<h2 class="section-title">Interests</h2>');
      expect(html).not.toContain('<h2 class="section-title">References</h2>');
    });
  });
});
