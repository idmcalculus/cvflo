import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  CVData, 
  SectionVisibility, 
  PersonalInfo, 
  WorkExperience, 
  Education, 
  Project, 
  Skill, 
  Interest, 
  Reference 
} from '../types/cv.types';

interface UIState {
  sidebarCollapsed: boolean;
  isFullscreen: boolean;
  sidebarCompactMode: boolean;
}

interface CVState {
  data: CVData;
  visibility: SectionVisibility;
  activeSection: string;
  selectedTemplate: string;
  ui: UIState;
  
  setActiveSection: (section: string) => void;
  toggleSectionVisibility: (section: keyof SectionVisibility) => void;
  setSelectedTemplate: (templateName: string) => void;
  
  // UI actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleFullscreen: () => void;
  setFullscreen: (fullscreen: boolean) => void;
  toggleSidebarCompactMode: () => void;
  
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
  updateInterest: (id: string, interest: Partial<Interest>) => void;
  removeInterest: (id: string) => void;
  
  addReference: (reference: Omit<Reference, 'id'>) => void;
  updateReference: (id: string, reference: Partial<Reference>) => void;
  removeReference: (id: string) => void;
}

// Initial data
const initialData: CVData = {
  personalInfo: {
    firstName: '',
    lastName: '',
    title: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    website: '',
    linkedin: '',
  },
  summary: '',
  workExperience: [],
  education: [],
  projects: [],
  skills: [],
  interests: [],
  references: [],
};

// Initial visibility settings
const initialVisibility: SectionVisibility = {
  summary: true,
  workExperience: true,
  education: true,
  projects: true,
  skills: true,
  interests: true,
  references: true,
};

// Helper function to generate unique IDs
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Initial UI state
const initialUIState: UIState = {
  sidebarCollapsed: false,
  isFullscreen: false,
  sidebarCompactMode: false,
};

export const useCVStore = create<CVState>()(
  persist(
    (set) => ({
      data: initialData,
      visibility: initialVisibility,
      activeSection: 'personalInfo',
      selectedTemplate: 'default',
      ui: initialUIState,
      
      setActiveSection: (section) => set({ activeSection: section }),
      
      setSelectedTemplate: (templateName) => set({ selectedTemplate: templateName }),
      
      toggleSectionVisibility: (section) => 
        set((state) => ({
          visibility: {
            ...state.visibility,
            [section]: !state.visibility[section],
          }
        })),
      
      // UI actions
      toggleSidebar: () => 
        set((state) => ({
          ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed }
        })),
      
      setSidebarCollapsed: (collapsed) => 
        set((state) => ({
          ui: { ...state.ui, sidebarCollapsed: collapsed }
        })),
      
      toggleFullscreen: () => 
        set((state) => ({
          ui: { ...state.ui, isFullscreen: !state.ui.isFullscreen }
        })),
      
      setFullscreen: (fullscreen) => 
        set((state) => ({
          ui: { ...state.ui, isFullscreen: fullscreen }
        })),
      
      toggleSidebarCompactMode: () => 
        set((state) => ({
          ui: { ...state.ui, sidebarCompactMode: !state.ui.sidebarCompactMode }
        })),
      
      updatePersonalInfo: (info) => 
        set((state) => ({
          data: {
            ...state.data,
            personalInfo: { ...state.data.personalInfo, ...info },
          }
        })),
      
      updateSummary: (summary) => 
        set((state) => ({
          data: { ...state.data, summary },
        })),
      
      addWorkExperience: (experience) => 
        set((state) => ({
          data: {
            ...state.data,
            workExperience: [
              ...state.data.workExperience,
              { ...experience, id: generateId() },
            ],
          }
        })),
      
      updateWorkExperience: (id, experience) => 
        set((state) => ({
          data: {
            ...state.data,
            workExperience: state.data.workExperience.map((exp) => 
              exp.id === id ? { ...exp, ...experience } : exp
            ),
          }
        })),
      
      removeWorkExperience: (id) => 
        set((state) => ({
          data: {
            ...state.data,
            workExperience: state.data.workExperience.filter((exp) => exp.id !== id),
          }
        })),
      
      addEducation: (education) => 
        set((state) => ({
          data: {
            ...state.data,
            education: [
              ...state.data.education,
              { ...education, id: generateId() },
            ],
          }
        })),
      
      updateEducation: (id, education) => 
        set((state) => ({
          data: {
            ...state.data,
            education: state.data.education.map((edu) => 
              edu.id === id ? { ...edu, ...education } : edu
            ),
          }
        })),
      
      removeEducation: (id) => 
        set((state) => ({
          data: {
            ...state.data,
            education: state.data.education.filter((edu) => edu.id !== id),
          }
        })),
      
      addProject: (project) => 
        set((state) => ({
          data: {
            ...state.data,
            projects: [
              ...state.data.projects,
              { ...project, id: generateId() },
            ],
          }
        })),
      
      updateProject: (id, project) => 
        set((state) => ({
          data: {
            ...state.data,
            projects: state.data.projects.map((proj) => 
              proj.id === id ? { ...proj, ...project } : proj
            ),
          }
        })),
      
      removeProject: (id) => 
        set((state) => ({
          data: {
            ...state.data,
            projects: state.data.projects.filter((proj) => proj.id !== id),
          }
        })),
      
      addSkill: (skill) => 
        set((state) => ({
          data: {
            ...state.data,
            skills: [
              ...state.data.skills,
              { ...skill, id: generateId() },
            ],
          }
        })),
      
      updateSkill: (id, skill) => 
        set((state) => ({
          data: {
            ...state.data,
            skills: state.data.skills.map((s) => 
              s.id === id ? { ...s, ...skill } : s
            ),
          }
        })),
      
      removeSkill: (id) => 
        set((state) => ({
          data: {
            ...state.data,
            skills: state.data.skills.filter((s) => s.id !== id),
          }
        })),
      
      addInterest: (interest) => 
        set((state) => ({
          data: {
            ...state.data,
            interests: [
              ...state.data.interests,
              { ...interest, id: generateId() },
            ],
          }
        })),
      
      updateInterest: (id, interest) => 
        set((state) => ({
          data: {
            ...state.data,
            interests: state.data.interests.map((i) => 
              i.id === id ? { ...i, ...interest } : i
            ),
          }
        })),
      
      removeInterest: (id) => 
        set((state) => ({
          data: {
            ...state.data,
            interests: state.data.interests.filter((i) => i.id !== id),
          }
        })),
      
      addReference: (reference) => 
        set((state) => ({
          data: {
            ...state.data,
            references: [
              ...state.data.references,
              { ...reference, id: generateId() },
            ],
          }
        })),
      
      updateReference: (id, reference) => 
        set((state) => ({
          data: {
            ...state.data,
            references: state.data.references.map((ref) => 
              ref.id === id ? { ...ref, ...reference } : ref
            ),
          }
        })),
      
      removeReference: (id) => 
        set((state) => ({
          data: {
            ...state.data,
            references: state.data.references.filter((ref) => ref.id !== id),
          }
        })),
    }),
    {
      name: 'cv-storage',
    }
  )
);
