import React from 'react';
import { PersonalInfo } from '../../../types/cv.types';
import { Mail, Phone, MapPin, Globe, Linkedin } from 'lucide-react';

interface PersonalInfoPreviewProps {
  personalInfo: PersonalInfo;
}

const PersonalInfoPreview: React.FC<PersonalInfoPreviewProps> = ({ personalInfo }) => {
  const {
    firstName,
    lastName,
    title,
    email,
    phone,
    address,
    city,
    state,
    zipCode,
    country,
    website,
    linkedin,
  } = personalInfo;
  
  const fullName = `${firstName} ${lastName}`.trim();
  
  const location = [
    address,
    city,
    state,
    zipCode,
    country,
  ].filter(Boolean).join(', ');

  if (!fullName) return null;

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{fullName}</h1>
      {title && <p className="text-lg text-blue-600 mb-3">{title}</p>}
      
      <div className="flex flex-wrap gap-y-2">
        {email && (
          <div className="flex items-center text-sm text-gray-600 mr-4">
            <Mail className="w-4 h-4 mr-1" />
            <span>{email}</span>
          </div>
        )}
        
        {phone && (
          <div className="flex items-center text-sm text-gray-600 mr-4">
            <Phone className="w-4 h-4 mr-1" />
            <span>{phone}</span>
          </div>
        )}
        
        {location && (
          <div className="flex items-center text-sm text-gray-600 mr-4">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{location}</span>
          </div>
        )}
        
        {website && (
          <div className="flex items-center text-sm text-gray-600 mr-4">
            <Globe className="w-4 h-4 mr-1" />
            <span>{website.replace(/^https?:\/\//, '')}</span>
          </div>
        )}
        
        {linkedin && (
          <div className="flex items-center text-sm text-gray-600 mr-4">
            <Linkedin className="w-4 h-4 mr-1" />
            <span>{linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalInfoPreview;