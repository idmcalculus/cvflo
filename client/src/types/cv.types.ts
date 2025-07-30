export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface PersonalInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  title: string;
  website?: string;
  linkedin?: string;
  github?: string;
  x?: string; // Renamed from twitter
  facebook?: string;
  instagram?: string;
  youtube?: string;
  medium?: string;
  stackoverflow?: string;
  customFields?: CustomField[];
}

export interface WorkExperience {
  id: string;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

export interface Skill {
  id: string;
  name: string;
  level?: number;
  category: string;
}

export interface Interest {
  id: string;
  name: string;
}

export interface Reference {
  id: string;
  name: string;
  company: string;
  position: string;
  email: string;
  phone: string;
}

export interface SkillsSettings {
  showProficiencyLevels: boolean;
}

export interface SectionSettings {
  skills: SkillsSettings;
}

export interface CVData {
  personalInfo: PersonalInfo;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  projects: Project[];
  skills: Skill[];
  interests: Interest[];
  references: Reference[];
  sectionSettings?: SectionSettings;
}

export interface SectionVisibility {
  summary: boolean;
  workExperience: boolean;
  education: boolean;
  projects: boolean;
  skills: boolean;
  interests: boolean;
  references: boolean;
}

export interface CVState {
  data: CVData;
  visibility: SectionVisibility;
  activeSection: string;
  setActiveSection: (section: string) => void;
  updatePersonalInfo: (info: Partial<PersonalInfo>) => void;
  updateSummary: (summary: string) => void;
  addWorkExperience: (experience: Omit<WorkExperience, 'id'>) => void;
  updateWorkExperience: (id: string, experience: Partial<WorkExperience>) => void;
  removeWorkExperience: (id: string) => void;
  addEducation: (education: Omit<Education, 'id'>) => void;
  updateEducation: (id: string, education: Partial<Education>) => void;
  removeEducation: (id: string) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  removeProject: (id: string) => void;
  addSkill: (skill: Omit<Skill, 'id'>) => void;
  updateSkill: (id: string, skill: Partial<Skill>) => void;
  removeSkill: (id: string) => void;
  addInterest: (interest: Omit<Interest, 'id'>) => void;
  removeInterest: (id: string) => void;
  addReference: (reference: Omit<Reference, 'id'>) => void;
  updateReference: (id: string, reference: Partial<Reference>) => void;
  removeReference: (id: string) => void;
  toggleSectionVisibility: (section: keyof SectionVisibility) => void;
  resetCV: () => void;
}
