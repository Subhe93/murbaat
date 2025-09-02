'use client';

import { useState } from 'react';
import { Search, Building2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';

interface CompanySearchResult {
  slug: string;
  name: string;
  description: string;
  category: string;
  city: string;
  country: string;
  image: string;
  rating: number;
  reviewsCount: number;
  tags: string[];
}

interface CompanySearchProps {
  currentCity: string;
  currentCountry: string;
  currentCompanySlug: string;
}

// Mock data for companies in the same city
const getCityCompanies = (city: string, country: string, currentSlug: string): CompanySearchResult[] => {
  const allCompanies: CompanySearchResult[] = [
    {
      slug: 'tech-solutions',
      name: 'حلول التقنية المتقدمة',
      description: 'شركة متخصصة في تطوير البرمجيات وحلول الأعمال الرقمية',
      category: 'technology',
      city: 'damascus',
      country: 'sy',
      image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg',
      rating: 4.7,
      reviewsCount: 89,
      tags: ['تطوير المواقع', 'التطبيقات المحمولة'],
    },
    {
      slug: 'digital-innovations',
      name: 'الابتكارات الرقمية',
      description: 'نقدم حلول تقنية مبتكرة للشركات والمؤسسات',
      category: 'technology',
      city: 'damascus',
      country: 'sy',
      image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
      rating: 4.5,
      reviewsCount: 67,
      tags: ['الذكاء الاصطناعي', 'البيانات الضخمة'],
    },
    {
      slug: 'blue-hospital',
      name: 'مستشفى الأزرق',
      description: 'مستشفى متخصص في الرعاية الصحية الشاملة',
      category: 'healthcare',
      city: 'damascus',
      country: 'sy',
      image: 'https://images.pexels.com/photos/236380/pexels-photo-236380.jpeg',
      rating: 4.4,
      reviewsCount: 156,
      tags: ['طب عام', 'جراحة', 'أطفال'],
    },
    {
      slug: 'golden-restaurant',
      name: 'مطعم الذهبي',
      description: 'مطعم فاخر يقدم أشهى الأطباق العربية والعالمية',
      category: 'food',
      city: 'damascus',
      country: 'sy',
      image: 'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg',
      rating: 4.6,
      reviewsCount: 234,
      tags: ['مأكولات عربية', 'مأكولات عالمية', 'مطعم فاخر'],
    },
    {
      slug: 'smart-education',
      name: 'التعليم الذكي',
      description: 'مركز تعليمي متطور يقدم دورات في التكنولوجيا والبرمجة',
      category: 'education',
      city: 'damascus',
      country: 'sy',
      image: 'https://images.pexels.com/photos/289737/pexels-photo-289737.jpeg',
      rating: 4.8,
      reviewsCount: 178,
      tags: ['برمجة', 'تصميم', 'تدريب'],
    },
  ];

  return allCompanies
    .filter(company => 
      company.city === city && 
      company.country === country &&
      company.slug !== currentSlug
    );
};

export function CompanySearch({ currentCity, currentCountry, currentCompanySlug }: CompanySearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const cityCompanies = getCityCompanies(currentCity, currentCountry, currentCompanySlug);
  
  const filteredCompanies = cityCompanies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || company.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: '', label: 'جميع الفئات' },
    { value: 'technology', label: 'التكنولوجيا' },
    { value: 'healthcare', label: 'الرعاية الصحية' },
    { value: 'education', label: 'التعليم' },
    { value: 'food', label: 'الأغذية والمطاعم' },
    { value: 'retail', label: 'التجارة والبيع' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center space-x-3 space-x-reverse mb-6">
        <Search className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          البحث في شركات {currentCity}
        </h2>
      </div>

      {/* Search Form */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن شركة أو خدمة..."
              className="w-full pr-10 pl-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Building2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              className="w-full pr-10 pl-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="h-4 w-4" />
          <span>عرض النتائج من {currentCity} فقط</span>
        </div>
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery || selectedCategory 
                ? `لا توجد نتائج للبحث "${searchQuery}" في ${currentCity}`
                : `لا توجد شركات أخرى في ${currentCity} حالياً`
              }
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                تم العثور على {filteredCompanies.length} شركة في {currentCity}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCompanies.slice(0, 6).map((company) => (
                <Link
                  key={company.slug}
                  href={`/${company.country}/city/${company.city}/company/${company.slug}`}
                  className="group block"
                >
                  <div className="flex items-center space-x-4 space-x-reverse p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all duration-300">
                    <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={company.image}
                        alt={company.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {company.name}
                        </h3>
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                            {company.rating}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 text-xs mb-2 line-clamp-1">
                        {company.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-1">
                        {company.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filteredCompanies.length > 6 && (
              <div className="text-center mt-4">
                <Link href={`/${currentCountry}/city/${currentCity}`}>
                  <Button variant="outline" className="px-6">
                    عرض المزيد من الشركات في {currentCity}
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


