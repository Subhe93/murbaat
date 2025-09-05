'use client';

import { useState } from 'react';
import { MapPin, Phone, Mail, Globe, Building2, Tag, ChevronDown, ChevronRight, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { TiktokIcon } from '@/components/icons/tiktok-icon';
import { Badge } from '@/components/ui/badge';
import { Company } from '@/lib/data';

interface CompanyInfoProps {
  company: Company;
}

export function CompanyInfo({ company }: CompanyInfoProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullAddress, setShowFullAddress] = useState(false);

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <Facebook className="h-5 w-5" />;
      case 'twitter':
        return <Twitter className="h-5 w-5" />;
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'linkedin':
        return <Linkedin className="h-5 w-5" />;
      case 'youtube':
        return <Youtube className="h-5 w-5" />;
      case 'tiktok':
        return <TiktokIcon className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getSocialColor = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return 'text-blue-600 hover:text-blue-700';
      case 'twitter':
        return 'text-sky-500 hover:text-sky-600';
      case 'instagram':
        return 'text-pink-500 hover:text-pink-600';
      case 'linkedin':
        return 'text-blue-700 hover:text-blue-800';
      case 'youtube':
        return 'text-red-600 hover:text-red-700';
      case 'tiktok':
        return 'text-black hover:text-gray-700 dark:text-white dark:hover:text-gray-300';
      default:
        return 'text-gray-600 hover:text-gray-700';
    }
  };

  const longDescription = company.longDescription || company.description;
  const isLongDescription = longDescription && longDescription.length > 200;

  return (
    <div className="space-y-8">
      {/* Company Description Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">نبذة عن الشركة</h2>
        
        {/* Short Description */}
        {company.shortDescription && (
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4 font-medium">
            {company.shortDescription}
          </p>
        )}

        {/* About Section with Read More */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">حول</h3>
          <div className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {isLongDescription ? (
              <div>
                <p className={`${showFullDescription ? '' : 'line-clamp-3'}`}>
                  {longDescription}
                </p>
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1 space-x-reverse"
                >
                  <span>{showFullDescription ? 'إقرأ أقل' : 'إقرأ المزيد'}</span>
                  {showFullDescription ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </div>
            ) : (
              <p>{longDescription}</p>
            )}
          </div>
        </div>
      </div>

      {/* Company Info Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">معلومات الشركة</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Address */}
          <div className="flex items-start space-x-4 space-x-reverse">
            <MapPin className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <div className="flex items-center space-x-2 space-x-reverse mb-1">
                <span className="text-gray-900 dark:text-white font-medium">
                  {company.address}
                </span>
                <button
                  onClick={() => setShowFullAddress(!showFullAddress)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {showFullAddress ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </div>
              {showFullAddress && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <p>العنوان الكامل: {company.address}</p>
                  <p>المدينة: {company.city}</p>
                  <p>الدولة: {company.country}</p>
                </div>
              )}
            </div>
          </div>

          {/* Phone */}
          {company.phone && (
            <div className="flex items-center space-x-4 space-x-reverse">
              <Phone className="h-6 w-6 text-green-600 flex-shrink-0" />
              <a 
                href={`tel:${company.phone}`}
                className="text-gray-900 dark:text-white hover:text-green-600 transition-colors"
                dir="ltr"
              >
                {company.phone}
              </a>
            </div>
          )}

          {/* Email */}
          {company.email && (
            <div className="flex items-center space-x-4 space-x-reverse">
              <Mail className="h-6 w-6 text-orange-600 flex-shrink-0" />
              <a 
                href={`mailto:${company.email}`}
                className="text-gray-900 dark:text-white hover:text-orange-600 transition-colors"
                dir="ltr"
              >
                {company.email}
              </a>
            </div>
          )}

          {/* Website */}
          {company.website && (
            <div className="flex items-center space-x-4 space-x-reverse">
              <Globe className="h-6 w-6 text-purple-600 flex-shrink-0" />
              <a 
                href={company.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-900 dark:text-white hover:text-purple-600 transition-colors"
              >
                {company.website}
              </a>
            </div>
          )}

          {/* Social Media */}
          {(company.socialMedia.facebook || company.socialMedia.twitter || company.socialMedia.instagram || company.socialMedia.linkedin || company.socialMedia.youtube || company.socialMedia.tiktok) && (
            <div className="md:col-span-2">
              <div className="flex items-center space-x-4 space-x-reverse mb-3">
                <Building2 className="h-6 w-6 text-gray-600 flex-shrink-0" />
                <span className="text-gray-900 dark:text-white font-medium">وسائل التواصل الاجتماعي</span>
              </div>
              <div className="flex space-x-3 space-x-reverse pr-10">
                {Object.entries(company.socialMedia).map(([platform, url]) => 
                  url ? (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 hover:scale-110 ${getSocialColor(platform)}`}
                    >
                      {getSocialIcon(platform)}
                    </a>
                  ) : null
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Services Section */}
      {company.services && company.services.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center space-x-3 space-x-reverse mb-6">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">الخدمات</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {company.services.map((service) => (
              <button key={service}>
                <Badge 
                  variant="outline" 
                  className="text-sm px-3 py-1 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {service}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Specialties Section */}
      {company.specialties && company.specialties.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center space-x-3 space-x-reverse mb-6">
            <Tag className="h-6 w-6 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">التخصصات</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {company.specialties.map((specialty) => (
              <button key={specialty}>
                <Badge 
                  variant="outline" 
                  className="text-sm px-3 py-1 cursor-pointer hover:bg-green-50 hover:border-green-300 transition-colors"
                >
                  {specialty}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tags Section */}
      {company.tags && company.tags.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center space-x-3 space-x-reverse mb-6">
            <Tag className="h-6 w-6 text-purple-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">الكلمات المفتاحية</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {company.tags.map((tag) => (
              <button key={tag}>
                <Badge 
                  variant="outline" 
                  className="text-sm px-3 py-1 cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-colors"
                >
                  {tag}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}