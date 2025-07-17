import { CVData, SectionVisibility } from '../types/cv.ts';

interface FilteredCVData {
  personalInfo: any;
  summary?: string;
  workExperience?: any[];
  education?: any[];
  projects?: any[];
  skills?: any[];
  interests?: any[];
  references?: any[];
  // Helper flags for templates
  hasPersonalInfo: boolean;
  hasSummary: boolean;
  hasWorkExperience: boolean;
  hasEducation: boolean;
  hasProjects: boolean;
  hasSkills: boolean;
  hasInterests: boolean;
  hasReferences: boolean;
}

/**
 * Data Filter Service - Processes CV data based on visibility settings
 * This eliminates the need for complex template conditions
 */
export class DataFilterService {
  
  /**
   * Filter CV data based on visibility settings
   * User visibility preferences take precedence - templates handle empty content
   */
  public filterCVData(data: CVData, visibility: SectionVisibility): FilteredCVData {
    const filtered: FilteredCVData = {
      personalInfo: data.personalInfo || {},
      hasPersonalInfo: this.hasPersonalInfoContent(data.personalInfo),
      hasSummary: false,
      hasWorkExperience: false,
      hasEducation: false,
      hasProjects: false,
      hasSkills: false,
      hasInterests: false,
      hasReferences: false,
    };

    // Summary - include if user wants it visible AND there is content
    if (visibility.summary && data.summary && data.summary.trim()) {
      filtered.summary = data.summary;
      filtered.hasSummary = true;
    }

    // Work Experience - include if user wants it visible AND there is content
    if (visibility.workExperience && data.workExperience && data.workExperience.length > 0) {
      filtered.workExperience = data.workExperience;
      filtered.hasWorkExperience = true;
    }

    // Education - include if user wants it visible AND there is content
    if (visibility.education && data.education && data.education.length > 0) {
      filtered.education = data.education;
      filtered.hasEducation = true;
    }

    // Projects - include if user wants it visible AND there is content
    if (visibility.projects && data.projects && data.projects.length > 0) {
      filtered.projects = data.projects;
      filtered.hasProjects = true;
    }

    // Skills - include if user wants it visible AND there is content
    if (visibility.skills && data.skills && data.skills.length > 0) {
      filtered.skills = data.skills;
      filtered.hasSkills = true;
    }

    // Interests - include if user wants it visible AND there is content
    if (visibility.interests && data.interests && data.interests.length > 0) {
      filtered.interests = data.interests;
      filtered.hasInterests = true;
    }

    // References - include if user wants it visible AND there is content
    if (visibility.references && data.references && data.references.length > 0) {
      filtered.references = data.references;
      filtered.hasReferences = true;
    }

    return filtered;
  }

  /**
   * Check if personal info has meaningful content
   */
  private hasPersonalInfoContent(personalInfo: any): boolean {
    if (!personalInfo) return false;
    
    // At minimum, should have first name or last name
    return this.hasStringContent(personalInfo.firstName) || 
           this.hasStringContent(personalInfo.lastName);
  }

  /**
   * Check if string has meaningful content
   */
  private hasStringContent(value: any): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

}