import request from 'supertest';
import { createApp } from '../../src/app.ts';
import { CVData, SectionVisibility } from '../../src/types/cv.ts';
import { describe, it, expect, beforeAll } from 'bun:test';
import type { Express } from 'express';

describe('Skills Section', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createApp();
  });

  it('should return a 400 error if skill name is missing', async () => {
    const cvData: Partial<CVData> = {
      skills: [{ id: '1', name: '', category: 'Programming' }],
    };
    const visibility: Partial<SectionVisibility> = { skills: true };

    const response = await request(app as any)
      .post('/api/generate-pdf')
      .send({ template: 'classic-0', cvData, visibility });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Skill name is required');
  });

  it('should return a 400 error if skill category is missing', async () => {
    const cvData: Partial<CVData> = {
      skills: [{ id: '1', name: 'JavaScript', category: '' }],
    };
    const visibility: Partial<SectionVisibility> = { skills: true };

    const response = await request(app as any)
      .post('/api/generate-pdf')
      .send({ template: 'classic-0', cvData, visibility });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Skill category is required');
  });

  it('should return a 400 error if skill level is invalid', async () => {
    const cvData: Partial<CVData> = {
      skills: [
        {
          id: '1',
          name: 'JavaScript',
          category: 'Programming',
          level: 6,
        },
      ],
    };
    const visibility: Partial<SectionVisibility> = { skills: true };

    const response = await request(app as any)
      .post('/api/generate-pdf')
      .send({ template: 'classic-0', cvData, visibility });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      'Skill level must be a number between 1 and 5'
    );
  });

  it('should generate a PDF with categorized skills', async () => {
    const cvData: Partial<CVData> = {
      skills: [
        {
          id: '1',
          name: 'JavaScript',
          category: 'Programming',
          level: 5,
        },
        { id: '2', name: 'React', category: 'Frameworks', level: 4 },
      ],
    };
    const visibility: Partial<SectionVisibility> = { skills: true };

    const response = await request(app as any)
      .post('/api/generate-pdf')
      .send({ template: 'classic-0', cvData, visibility });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/pdf');
  });

  it('should generate a PDF with skills without proficiency levels when disabled', async () => {
    const cvData: Partial<CVData> = {
      skills: [
        {
          id: '1',
          name: 'JavaScript',
          category: 'Programming',
          level: 5,
        },
        { id: '2', name: 'React', category: 'Frameworks', level: 4 },
      ],
      sectionSettings: {
        skills: { showProficiencyLevels: false }
      }
    };
    const visibility: Partial<SectionVisibility> = { skills: true };

    const response = await request(app as any)
      .post('/api/generate-pdf')
      .send({ template: 'classic-0', cvData, visibility });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/pdf');
  });

  it('should generate a PDF with skills with proficiency levels when enabled', async () => {
    const cvData: Partial<CVData> = {
      skills: [
        {
          id: '1',
          name: 'JavaScript',
          category: 'Programming',
          level: 5,
        },
        { id: '2', name: 'React', category: 'Frameworks', level: 4 },
      ],
      sectionSettings: {
        skills: { showProficiencyLevels: true }
      }
    };
    const visibility: Partial<SectionVisibility> = { skills: true };

    const response = await request(app as any)
      .post('/api/generate-pdf')
      .send({ template: 'classic-0', cvData, visibility });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/pdf');
  });

  it('should handle skills without categories (uncategorized)', async () => {
    const cvData: Partial<CVData> = {
      skills: [
        {
          id: '1',
          name: 'JavaScript',
          category: '',
          level: 5,
        },
        { id: '2', name: 'React', category: 'Frameworks', level: 4 },
      ],
      sectionSettings: {
        skills: { showProficiencyLevels: true }
      }
    };
    const visibility: Partial<SectionVisibility> = { skills: true };

    const response = await request(app as any)
      .post('/api/generate-pdf')
      .send({ template: 'classic-0', cvData, visibility });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/pdf');
  });
});
