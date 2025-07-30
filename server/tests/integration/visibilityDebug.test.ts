import { describe, it, expect } from 'bun:test';
import { HandlebarsTemplateService } from '../../src/services/handlebarsTemplateService.ts';
import { DataFilterService } from '../../src/services/dataFilterService.ts';
import { CVData, SectionVisibility } from '../../src/types/cv.ts';

describe('Visibility Debug', () => {
  it('should debug regex matching', () => {
    const testTemplate = `
      {{#if visibility.summary}}
        <section>Summary content</section>
      {{/if}}
      {{#if visibility.workExperience}}
        <section>Work content</section>
      {{/if}}
    `;

    const regex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    const matches = testTemplate.match(regex);
    console.log('Regex matches:', matches);

    let match;
    while ((match = regex.exec(testTemplate)) !== null) {
      console.log('Match found:', match[1], '-> content length:', match[2].length);
    }
  });

  it('should debug visibility behavior', async () => {
    const templateService = new HandlebarsTemplateService();
    templateService.clearCache(); // Clear template cache to ensure fresh templates
    const dataFilterService = new DataFilterService();
    
    const mockData: CVData = {
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        title: 'Engineer'
      },
      summary: 'Test summary',
      workExperience: [{
        id: '1',
        position: 'Developer',
        company: 'Test Corp',
        location: '',
        startDate: '2020-01',
        endDate: '2023-12',
        current: false,
        description: 'Test description'
      }],
      education: [],
      projects: [],
      skills: [],
      interests: [],
      references: []
    };

    // Test 1: Summary visible, work experience hidden
    const visibility1: SectionVisibility = {
      summary: true,
      workExperience: false,
      education: true,
      projects: true,
      skills: true,
      interests: true,
      references: true
    };

    // Debug the data filtering
    const filteredData1 = dataFilterService.filterCVData(mockData, visibility1);
    console.log('=== Filtered Data 1 ===');
    console.log('hasSummary:', filteredData1.hasSummary);
    console.log('hasWorkExperience:', filteredData1.hasWorkExperience);
    console.log('summary data:', filteredData1.summary);
    console.log('workExperience data:', filteredData1.workExperience);

    const html1 = await templateService.renderCV('classic-0', mockData, visibility1);
    console.log('=== Test 1: Summary visible, work experience hidden ===');
    console.log('Summary should be visible:', html1.includes('Test summary'));
    console.log('Work experience should be hidden:', !html1.includes('Developer'));
    console.log('Contains summary section:', html1.includes('id="summary-section"'));
    console.log('Contains experience section:', html1.includes('id="experience-section"'));
    
    // Test 2: Summary hidden, work experience visible
    const visibility2: SectionVisibility = {
      summary: false,
      workExperience: true,
      education: true,
      projects: true,
      skills: true,
      interests: true,
      references: true
    };

    const html2 = await templateService.renderCV('classic-0', mockData, visibility2);
    console.log('\n=== Test 2: Summary hidden, work experience visible ===');
    console.log('Summary should be hidden:', !html2.includes('Test summary'));
    console.log('Work experience should be visible:', html2.includes('Developer'));
    console.log('Contains summary section:', html2.includes('id="summary-section"'));
    console.log('Contains experience section:', html2.includes('id="experience-section"'));
    console.log('\n=== HTML2 Output (chars 2000-3000) ===');
    console.log(html2.substring(2000, 3000));

    // Test 3: Both hidden
    const visibility3: SectionVisibility = {
      summary: false,
      workExperience: false,
      education: true,
      projects: true,
      skills: true,
      interests: true,
      references: true
    };

    const html3 = await templateService.renderCV('classic-0', mockData, visibility3);
    console.log('\n=== Test 3: Both hidden ===');
    console.log('Summary should be hidden:', !html3.includes('Test summary'));
    console.log('Work experience should be hidden:', !html3.includes('Developer'));
    console.log('Contains summary section:', html3.includes('id="summary-section"'));
    console.log('Contains experience section:', html3.includes('id="experience-section"'));

    // Actual assertions
    expect(html1.includes('Test summary')).toBe(true);
    expect(html1.includes('Developer')).toBe(false);
    
    expect(html2.includes('Test summary')).toBe(false);
    expect(html2.includes('Developer')).toBe(true);
    
    expect(html3.includes('Test summary')).toBe(false);
    expect(html3.includes('Developer')).toBe(false);
  });
});
