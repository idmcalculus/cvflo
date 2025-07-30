import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CVData,
  SectionVisibility,
  SectionSettings,
  PersonalInfo,
  WorkExperience,
  Education,
  Project,
  Skill,
  Interest,
  Reference,
  CustomField
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
  defaultTemplate: string;
  ui: UIState;
  lastSyncedAt: string | null;
  isDirty: boolean; // Track if local changes need to be synced

  setActiveSection: (section: string) => void;
  toggleSectionVisibility: (section: keyof SectionVisibility) => void;
  setSelectedTemplate: (templateName: string) => void;
  setDefaultTemplate: (templateName: string) => void;
  resetToDefaultTemplate: () => void;
  initializeTemplate: () => void;
  
  // Database sync methods
  loadFromDatabase: (dbData: {cvData: CVData, visibility: SectionVisibility, selectedTemplate: string}) => void;
  markAsSynced: () => void;
  markAsDirty: () => void;
  clearAllData: () => void;

  // Section settings actions
  updateSectionSettings: (settings: Partial<SectionSettings>) => void;
  toggleSkillsProficiencyLevels: () => void;
  
  // UI actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleFullscreen: () => void;
  setFullscreen: (fullscreen: boolean) => void;
  
  updatePersonalInfo: (info: Partial<PersonalInfo>) => void;
  updateSummary: (summary: string) => void;
  
  // Custom fields actions
  addCustomField: (field: Omit<CustomField, 'id'>) => void;
  updateCustomField: (id: string, field: Partial<CustomField>) => void;
  removeCustomField: (id: string) => void;
  
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

// Initial section settings
const initialSectionSettings: SectionSettings = {
  skills: {
    showProficiencyLevels: false, // Default to disabled
  },
};

// Initial data
const initialData: CVData = {
  personalInfo: {
    firstName: '',
    middleName: '',
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
    github: '',
    x: '',
    facebook: '',
    instagram: '',
    youtube: '',
    medium: '',
    stackoverflow: '',
    customFields: [],
  },
  summary: '',
  workExperience: [],
  education: [],
  projects: [],
  skills: [],
  interests: [],
  references: [],
  sectionSettings: initialSectionSettings,
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
    (set, get) => ({
      data: initialData,
      visibility: initialVisibility,
      activeSection: 'personalInfo',
      selectedTemplate: 'classic-0',
      defaultTemplate: 'classic-0',
      ui: initialUIState,
      lastSyncedAt: null,
      isDirty: false,
      
      setActiveSection: (section) => set({ activeSection: section }),
      
      setSelectedTemplate: (templateName) => set({ selectedTemplate: templateName, isDirty: true }),
      
      setDefaultTemplate: (templateName) => set({ defaultTemplate: templateName }),
      
      resetToDefaultTemplate: () => set((state) => ({ selectedTemplate: state.defaultTemplate })),
      
      // Initialize with default template if no template is selected
      initializeTemplate: () => {
        const state = get();
        if (!state.selectedTemplate || state.selectedTemplate === 'default') {
          set({ selectedTemplate: state.defaultTemplate });
        }
      },

      // Database sync methods
      loadFromDatabase: (dbData) => {
        if (dbData && dbData.cvData) {
          // Handle migration from 'twitter' to 'x' field
          const migratedData = { ...dbData.cvData };
          if (migratedData.personalInfo && 'twitter' in migratedData.personalInfo) {
            migratedData.personalInfo.x = migratedData.personalInfo.twitter;
            delete migratedData.personalInfo.twitter;
          }
          
          set({
            data: migratedData,
            visibility: dbData.visibility || initialVisibility,
            selectedTemplate: dbData.selectedTemplate || 'classic-0',
            lastSyncedAt: dbData.lastUpdated || new Date().toISOString(),
            isDirty: false
          });
        }
      },

      markAsSynced: () => set({ 
        lastSyncedAt: new Date().toISOString(), 
        isDirty: false 
      }),

      markAsDirty: () => set({ isDirty: true }),
      
      clearAllData: () => set({
        data: initialData,
        visibility: initialVisibility,
        activeSection: 'personalInfo',
        selectedTemplate: 'classic-0',
        defaultTemplate: 'classic-0',
        ui: initialUIState,
        lastSyncedAt: null,
        isDirty: false,
      }),
      
      toggleSectionVisibility: (section) => 
        set((state) => ({
          visibility: {
            ...state.visibility,
            [section]: !state.visibility[section],
          },
          isDirty: true
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
          },
          isDirty: true
        })),
      
      updateSummary: (summary) => 
        set((state) => ({
          data: { ...state.data, summary },
          isDirty: true
        })),
      
      // Custom fields actions
      addCustomField: (field) => 
        set((state) => ({
          data: {
            ...state.data,
            personalInfo: {
              ...state.data.personalInfo,
              customFields: [
                ...(state.data.personalInfo.customFields || []),
                { ...field, id: generateId() },
              ],
            },
          },
          isDirty: true
        })),
      
      updateCustomField: (id, field) => 
        set((state) => ({
          data: {
            ...state.data,
            personalInfo: {
              ...state.data.personalInfo,
              customFields: (state.data.personalInfo.customFields || []).map((f) => 
                f.id === id ? { ...f, ...field } : f
              ),
            },
          },
          isDirty: true
        })),
      
      removeCustomField: (id) => 
        set((state) => ({
          data: {
            ...state.data,
            personalInfo: {
              ...state.data.personalInfo,
              customFields: (state.data.personalInfo.customFields || []).filter((f) => f.id !== id),
            },
          },
          isDirty: true
        })),
      
      addWorkExperience: (experience) => 
        set((state) => ({
          data: {
            ...state.data,
            workExperience: [
              ...state.data.workExperience,
              { ...experience, id: generateId() },
            ],
          },
          isDirty: true
        })),
      
      updateWorkExperience: (id, experience) => 
        set((state) => ({
          data: {
            ...state.data,
            workExperience: state.data.workExperience.map((exp) => 
              exp.id === id ? { ...exp, ...experience } : exp
            ),
          },
          isDirty: true
        })),
      
      removeWorkExperience: (id) => 
        set((state) => ({
          data: {
            ...state.data,
            workExperience: state.data.workExperience.filter((exp) => exp.id !== id),
          },
          isDirty: true
        })),
      
      addEducation: (education) => 
        set((state) => ({
          data: {
            ...state.data,
            education: [
              ...state.data.education,
              { ...education, id: generateId() },
            ],
          },
          isDirty: true
        })),
      
      updateEducation: (id, education) => 
        set((state) => ({
          data: {
            ...state.data,
            education: state.data.education.map((edu) => 
              edu.id === id ? { ...edu, ...education } : edu
            ),
          },
          isDirty: true
        })),
      
      removeEducation: (id) => 
        set((state) => ({
          data: {
            ...state.data,
            education: state.data.education.filter((edu) => edu.id !== id),
          },
          isDirty: true
        })),
      
      addProject: (project) => 
        set((state) => ({
          data: {
            ...state.data,
            projects: [
              ...state.data.projects,
              { ...project, id: generateId() },
            ],
          },
          isDirty: true
        })),
      
      updateProject: (id, project) => 
        set((state) => ({
          data: {
            ...state.data,
            projects: state.data.projects.map((proj) => 
              proj.id === id ? { ...proj, ...project } : proj
            ),
          },
          isDirty: true
        })),
      
      removeProject: (id) => 
        set((state) => ({
          data: {
            ...state.data,
            projects: state.data.projects.filter((proj) => proj.id !== id),
          },
          isDirty: true
        })),
      
      addSkill: (skill) => 
        set((state) => ({
          data: {
            ...state.data,
            skills: [
              ...state.data.skills,
              { ...skill, id: generateId() },
            ],
          },
          isDirty: true
        })),
      
      updateSkill: (id, skill) => 
        set((state) => ({
          data: {
            ...state.data,
            skills: state.data.skills.map((s) => 
              s.id === id ? { ...s, ...skill } : s
            ),
          },
          isDirty: true
        })),
      
      removeSkill: (id) => 
        set((state) => ({
          data: {
            ...state.data,
            skills: state.data.skills.filter((s) => s.id !== id),
          },
          isDirty: true
        })),
      
      addInterest: (interest) => 
        set((state) => ({
          data: {
            ...state.data,
            interests: [
              ...state.data.interests,
              { ...interest, id: generateId() },
            ],
          },
          isDirty: true
        })),
      
      updateInterest: (id, interest) => 
        set((state) => ({
          data: {
            ...state.data,
            interests: state.data.interests.map((i) => 
              i.id === id ? { ...i, ...interest } : i
            ),
          },
          isDirty: true
        })),
      
      removeInterest: (id) => 
        set((state) => ({
          data: {
            ...state.data,
            interests: state.data.interests.filter((i) => i.id !== id),
          },
          isDirty: true
        })),
      
      addReference: (reference) => 
        set((state) => ({
          data: {
            ...state.data,
            references: [
              ...state.data.references,
              { ...reference, id: generateId() },
            ],
          },
          isDirty: true
        })),
      
      updateReference: (id, reference) => 
        set((state) => ({
          data: {
            ...state.data,
            references: state.data.references.map((ref) => 
              ref.id === id ? { ...ref, ...reference } : ref
            ),
          },
          isDirty: true
        })),
      
      removeReference: (id) =>
        set((state) => ({
          data: {
            ...state.data,
            references: state.data.references.filter((ref) => ref.id !== id),
          },
          isDirty: true
        })),

      // Section settings actions
      updateSectionSettings: (settings) =>
        set((state) => {
          const currentSettings = state.data.sectionSettings || initialSectionSettings;

          return {
            data: {
              ...state.data,
              sectionSettings: {
                ...currentSettings,
                ...settings,
              },
            },
            isDirty: true
          };
        }),

      toggleSkillsProficiencyLevels: () =>
        set((state) => {
          const currentSettings = state.data.sectionSettings || initialSectionSettings;
          const currentSkillsSettings = currentSettings.skills || { showProficiencyLevels: false };

          return {
            data: {
              ...state.data,
              sectionSettings: {
                ...currentSettings,
                skills: {
                  ...currentSkillsSettings,
                  showProficiencyLevels: !currentSkillsSettings.showProficiencyLevels,
                },
              },
            },
            isDirty: true
          };
        }),
    }),
    {
      name: 'cv-storage',
    }
  )
);
