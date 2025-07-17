import React from 'react';
import { useCVStore } from '../../store/cvStore';
import PersonalInfoPreview from './Sections/PersonalInfoPreview';
import SummaryPreview from './Sections/SummaryPreview';
import WorkExperiencePreview from './Sections/WorkExperiencePreview';
import EducationPreview from './Sections/EducationPreview';
import ProjectsPreview from './Sections/ProjectsPreview';
import SkillsPreview from './Sections/SkillsPreview';
import InterestsPreview from './Sections/InterestsPreview';
import ReferencesPreview from './Sections/ReferencesPreview';

// Default Template Layout
const DefaultTemplate: React.FC = () => {
  const { data, visibility } = useCVStore();

  return (
    <div className="bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center">
          <h1 className="text-4xl font-bold mb-2">
            {data.personalInfo.firstName} {data.personalInfo.lastName}
          </h1>
          {data.personalInfo.title && (
            <h2 className="text-xl opacity-90 mb-4">{data.personalInfo.title}</h2>
          )}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            {data.personalInfo.email && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Email:</span>
                <span>{data.personalInfo.email}</span>
              </div>
            )}
            {data.personalInfo.phone && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Phone:</span>
                <span>{data.personalInfo.phone}</span>
              </div>
            )}
            {data.personalInfo.address && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Location:</span>
                <span>
                  {data.personalInfo.address}
                  {data.personalInfo.city && `, ${data.personalInfo.city}`}
                  {data.personalInfo.state && `, ${data.personalInfo.state}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {visibility.summary && data.summary && (
            <section className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 relative">
                Professional Summary
                <div className="absolute bottom-0 left-0 w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
              </h3>
              <p className="text-gray-700 leading-relaxed">{data.summary}</p>
            </section>
          )}

          {visibility.workExperience && data.workExperience.length > 0 && (
            <section className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 relative">
                Work Experience
                <div className="absolute bottom-0 left-0 w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
              </h3>
              <div className="space-y-6">
                {data.workExperience.map((exp, index) => (
                  <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border-l-4 border-blue-400">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-xl font-semibold text-blue-700">{exp.position}</h4>
                        <p className="text-lg text-gray-600 font-medium">{exp.company}</p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</div>
                        {exp.location && <div className="italic">{exp.location}</div>}
                      </div>
                    </div>
                    {exp.description && (
                      <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: exp.description }} />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {visibility.projects && data.projects.length > 0 && (
            <section className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 relative">
                Projects
                <div className="absolute bottom-0 left-0 w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
              </h3>
              <div className="space-y-6">
                {data.projects.map((project, index) => (
                  <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border-l-4 border-purple-400">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-xl font-semibold text-purple-700">
                          {project.liveUrl ? (
                            <a href={project.liveUrl} className="hover:underline" target="_blank" rel="noopener noreferrer">
                              {project.title}
                            </a>
                          ) : (
                            project.title
                          )}
                        </h4>
                        {project.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {project.technologies.map((tech, techIndex) => (
                              <span key={techIndex} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{project.startDate} - {project.current ? 'Present' : project.endDate}</div>
                      </div>
                    </div>
                    {project.description && (
                      <div className="text-gray-700 leading-relaxed mb-3 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: project.description }} />
                    )}
                    {project.githubUrl && (
                      <div className="text-sm">
                        <strong>GitHub:</strong> <a href={project.githubUrl} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{project.githubUrl}</a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {visibility.education && data.education.length > 0 && (
            <section className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 relative">
                Education
                <div className="absolute bottom-0 left-0 w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
              </h3>
              <div className="space-y-6">
                {data.education.map((edu, index) => (
                  <div key={index} className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border-l-4 border-green-400">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-xl font-semibold text-green-700">{edu.institution}</h4>
                        <p className="text-lg text-gray-600">{edu.degree}{edu.field && `, ${edu.field}`}</p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{edu.startDate} - {edu.current ? 'Present' : edu.endDate}</div>
                        {edu.location && <div className="italic">{edu.location}</div>}
                      </div>
                    </div>
                    {edu.description && (
                      <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: edu.description }} />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {visibility.skills && data.skills.length > 0 && (
            <section className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 relative">
                Skills
                <div className="absolute bottom-0 left-0 w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.skills.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border border-blue-200">
                    <span className="font-medium text-gray-800">{skill.name}</span>
                    {skill.level && (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < Number(skill.level) ? 'bg-blue-500' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-blue-600 font-semibold">{skill.level}/5</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {visibility.interests && data.interests.length > 0 && (
            <section className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 relative">
                Interests
                <div className="absolute bottom-0 left-0 w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
              </h3>
              <div className="flex flex-wrap gap-3">
                {data.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full font-medium"
                  >
                    {interest.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {visibility.references && data.references.length > 0 && (
            <section className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 relative">
                References
                <div className="absolute bottom-0 left-0 w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.references.map((ref, index) => (
                  <div key={index} className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 text-lg">{ref.name}</h4>
                    <p className="text-gray-600 mb-2">{ref.position}{ref.company && `, ${ref.company}`}</p>
                    {ref.email && (
                      <p className="text-sm text-blue-600">{ref.email}</p>
                    )}
                    {ref.phone && (
                      <p className="text-sm text-gray-700">{ref.phone}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

// Classic Template (using existing preview components)
const ClassicTemplate: React.FC = () => {
  const { data, visibility } = useCVStore();

  return (
    <div className="p-8">
      <PersonalInfoPreview personalInfo={data.personalInfo} />
      
      {visibility.summary && data.summary && (
        <SummaryPreview summary={data.summary} />
      )}
      
      {visibility.workExperience && data.workExperience.length > 0 && (
        <WorkExperiencePreview experiences={data.workExperience} />
      )}
      
      {visibility.education && data.education.length > 0 && (
        <EducationPreview education={data.education} />
      )}
      
      {visibility.projects && data.projects.length > 0 && (
        <ProjectsPreview projects={data.projects} />
      )}
      
      {visibility.skills && data.skills.length > 0 && (
        <SkillsPreview skills={data.skills} />
      )}
      
      {visibility.interests && data.interests.length > 0 && (
        <InterestsPreview interests={data.interests} />
      )}
      
      {visibility.references && data.references.length > 0 && (
        <ReferencesPreview references={data.references} />
      )}
    </div>
  );
};

// Modern Template
const ModernTemplate: React.FC = () => {
  const { data, visibility } = useCVStore();

  return (
    <div className="bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto bg-gray-800 shadow-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-2">
              {data.personalInfo.firstName} {data.personalInfo.lastName}
            </h1>
            {data.personalInfo.title && (
              <h2 className="text-2xl opacity-90 mb-4">{data.personalInfo.title}</h2>
            )}
          </div>
        </div>

        {/* Content with two-column layout */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Contact Info */}
              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4 text-purple-400">Contact</h3>
                <div className="space-y-2 text-sm">
                  {data.personalInfo.email && <div>{data.personalInfo.email}</div>}
                  {data.personalInfo.phone && <div>{data.personalInfo.phone}</div>}
                  {data.personalInfo.address && (
                    <div>
                      {data.personalInfo.address}
                      {data.personalInfo.city && `, ${data.personalInfo.city}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              {visibility.skills && data.skills.length > 0 && (
                <div className="bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4 text-purple-400">Skills</h3>
                  <div className="space-y-3">
                    {data.skills.map((skill, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">{skill.name}</span>
                          {skill.level && <span className="text-xs text-purple-400">{skill.level}/5</span>}
                        </div>
                        {skill.level && (
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                              style={{ width: `${(Number(skill.level) / 5) * 100}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              {visibility.summary && data.summary && (
                <section>
                  <h3 className="text-2xl font-bold mb-4 text-purple-400">About</h3>
                  <p className="text-gray-300 leading-relaxed">{data.summary}</p>
                </section>
              )}

              {visibility.workExperience && data.workExperience.length > 0 && (
                <section>
                  <h3 className="text-2xl font-bold mb-6 text-purple-400">Experience</h3>
                  <div className="space-y-6">
                    {data.workExperience.map((exp, index) => (
                      <div key={index} className="border-l-4 border-purple-500 pl-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-xl font-semibold">{exp.position}</h4>
                            <p className="text-purple-400 font-medium">{exp.company}</p>
                          </div>
                          <div className="text-right text-sm text-gray-400">
                            <div>{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</div>
                            {exp.location && <div>{exp.location}</div>}
                          </div>
                        </div>
                        {exp.description && (
                          <div className="text-gray-300 text-sm prose prose-sm max-w-none prose-invert" dangerouslySetInnerHTML={{ __html: exp.description }} />
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Other sections */}
              {visibility.education && data.education.length > 0 && (
                <section>
                  <h3 className="text-2xl font-bold mb-6 text-purple-400">Education</h3>
                  <div className="space-y-4">
                    {data.education.map((edu, index) => (
                      <div key={index} className="border-l-4 border-purple-500 pl-6">
                        <h4 className="text-lg font-semibold">{edu.institution}</h4>
                        <p className="text-purple-400">{edu.degree}{edu.field && `, ${edu.field}`}</p>
                        <p className="text-sm text-gray-400">{edu.startDate} - {edu.current ? 'Present' : edu.endDate}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Academic Template
const AcademicTemplate: React.FC = () => {
  const { data, visibility } = useCVStore();

  return (
    <div className="bg-green-50 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg">
        {/* Header */}
        <div className="border-b-4 border-green-600 p-8 text-center">
          <h1 className="text-4xl font-serif font-bold text-green-800 mb-2">
            {data.personalInfo.firstName} {data.personalInfo.lastName}
          </h1>
          {data.personalInfo.title && (
            <h2 className="text-xl text-green-700 mb-4">{data.personalInfo.title}</h2>
          )}
          <div className="text-sm text-gray-600 space-x-4">
            {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
            {data.personalInfo.phone && <span>•</span>}
            {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {visibility.summary && data.summary && (
            <section>
              <h3 className="text-xl font-serif font-bold text-green-800 mb-4 border-b-2 border-green-200 pb-2">
                Research Interests
              </h3>
              <p className="text-gray-700 leading-relaxed">{data.summary}</p>
            </section>
          )}

          {visibility.education && data.education.length > 0 && (
            <section>
              <h3 className="text-xl font-serif font-bold text-green-800 mb-4 border-b-2 border-green-200 pb-2">
                Education
              </h3>
              <div className="space-y-4">
                {data.education.map((edu, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4">
                    <div className="text-sm text-gray-500 text-right">
                      {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                    </div>
                    <div className="col-span-3">
                      <h4 className="font-semibold">{edu.degree}{edu.field && ` in ${edu.field}`}</h4>
                      <p className="text-green-700">{edu.institution}</p>
                      {edu.location && <p className="text-sm text-gray-500">{edu.location}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {visibility.workExperience && data.workExperience.length > 0 && (
            <section>
              <h3 className="text-xl font-serif font-bold text-green-800 mb-4 border-b-2 border-green-200 pb-2">
                Academic Experience
              </h3>
              <div className="space-y-4">
                {data.workExperience.map((exp, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4">
                    <div className="text-sm text-gray-500 text-right">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </div>
                    <div className="col-span-3">
                      <h4 className="font-semibold">{exp.position}</h4>
                      <p className="text-green-700">{exp.company}</p>
                      {exp.description && (
                        <div className="text-sm text-gray-700 mt-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: exp.description }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {visibility.projects && data.projects.length > 0 && (
            <section>
              <h3 className="text-xl font-serif font-bold text-green-800 mb-4 border-b-2 border-green-200 pb-2">
                Publications & Projects
              </h3>
              <div className="space-y-4">
                {data.projects.map((project, index) => (
                  <div key={index}>
                    <h4 className="font-semibold">{project.title}</h4>
                    {project.description && (
                      <div className="text-sm text-gray-700 mt-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: project.description }} />
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {project.startDate} - {project.current ? 'Present' : project.endDate}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Template Renderer Component
const TemplateRenderer: React.FC = () => {
  const { selectedTemplate } = useCVStore();

  switch (selectedTemplate) {
    case 'modern-0':
      return <DefaultTemplate />;
    case 'classic-0':
      return <ClassicTemplate />;
    case 'modern-1':
      return <ModernTemplate />;
    case 'academic-0':
      return <AcademicTemplate />;
    default:
      return <DefaultTemplate />;
  }
};

export default TemplateRenderer;