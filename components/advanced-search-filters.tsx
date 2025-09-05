'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, MapPin, Building2, Star, Calendar, DollarSign, Clock, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useFilterData } from '@/hooks/use-filter-data';

interface FilterOptions {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    companiesCount: number;
  }>;
  cities: Array<{
    id: string;
    name: string;
    slug: string;
    companiesCount: number;
  }>;
  countries: Array<{
    id: string;
    code: string;
    name: string;
    companiesCount: number;
  }>;
}

interface AdvancedSearchFiltersProps {
  onFiltersChange?: (filters: any) => void;
  showLocationFilter?: boolean;
  showCategoryFilter?: boolean;
  showRatingFilter?: boolean;
  showPriceFilter?: boolean;
  showHoursFilter?: boolean;
  filterOptions?: FilterOptions;
  initialValues?: {
    q?: string;
    country?: string;
    city?: string;
    category?: string;
    rating?: string;
    verified?: string;
    sort?: string;
    page?: string;
  };
}

export function AdvancedSearchFilters({
  onFiltersChange,
  showLocationFilter = true,
  showCategoryFilter = true,
  showRatingFilter = true,
  showPriceFilter = true,
  showHoursFilter = true,
  filterOptions,
  initialValues,
}: AdvancedSearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // استخدام hook لجلب البيانات النشطة
  const { categories, countries, cities, loading, error, fetchCitiesByCountry } = useFilterData();
  
  const [searchQuery, setSearchQuery] = useState(initialValues?.q || '');
  const [selectedCountry, setSelectedCountry] = useState(initialValues?.country || '');
  const [selectedCity, setSelectedCity] = useState(initialValues?.city || '');
  const [selectedCategory, setSelectedCategory] = useState(initialValues?.category || '');
  const [selectedRating, setSelectedRating] = useState<number | null>(
    initialValues?.rating ? parseFloat(initialValues.rating) : null
  );
  const [isVerified, setIsVerified] = useState(initialValues?.verified === 'true');
  const [sortBy, setSortBy] = useState(initialValues?.sort || 'rating');
  const [openNow, setOpenNow] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // جلب المدن عند تغيير البلد المحدد
  useEffect(() => {
    if (selectedCountry) {
      fetchCitiesByCountry(selectedCountry);
      setSelectedCity(''); // إعادة تعيين المدينة عند تغيير البلد
    } else {
      // إعادة تعيين المدينة عند إزالة البلد
      setSelectedCity('');
    }
  }, [selectedCountry, fetchCitiesByCountry]);

  // إنشاء URL للبحث
  const buildSearchUrl = (filters: any = {}) => {
    const params = new URLSearchParams();
    
    if (filters.q || searchQuery) params.set('q', filters.q || searchQuery);
    if (filters.country || selectedCountry) params.set('country', filters.country || selectedCountry);
    if (filters.city || selectedCity) params.set('city', filters.city || selectedCity);
    if (filters.category || selectedCategory) params.set('category', filters.category || selectedCategory);
    if (filters.rating || selectedRating) params.set('rating', String(filters.rating || selectedRating));
    if (filters.verified !== undefined || isVerified) params.set('verified', String(filters.verified !== undefined ? filters.verified : isVerified));
    if (filters.sort || sortBy) params.set('sort', filters.sort || sortBy);
    
    // إضافة معامل المدينة إذا كانت محددة
    if (selectedCity && selectedCity.trim() !== '') {
      params.set('city', selectedCity);
    }
    
    return `/search?${params.toString()}`;
  };

  const applyFilters = () => {
    const url = buildSearchUrl();
    router.push(url);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCountry('');
    setSelectedCity('');
    setSelectedCategory('');
    setSelectedRating(null);
    setIsVerified(false);
    setSortBy('rating');
    setOpenNow(false);
    router.push('/search');
  };

  const filteredCities = selectedCountry 
    ? cities.filter(city => city.country.code === selectedCountry)
    : cities;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="mr-2 text-gray-600">جاري تحميل البيانات...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="ابحث عن شركة، خدمة، أو كلمة مفتاحية..."
          className="w-full pr-12 pl-4 py-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              applyFilters();
            }
          }}
        />
        <Button
          onClick={applyFilters}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          variant={isExpanded ? "default" : "outline"}
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center"
        >
          <Filter className="h-4 w-4 ml-2" />
          فلاتر متقدمة
        </Button>
        
        {/* {showHoursFilter && (
          <Button
            variant={openNow ? "default" : "outline"}
            size="sm"
            onClick={() => setOpenNow(!openNow)}
            className="flex items-center"
          >
            <Clock className="h-4 w-4 ml-2" />
            مفتوح الآن
          </Button>
        )} */}

        {selectedRating && (
          <Badge variant="secondary" className="flex items-center">
            <Star className="h-3 w-3 ml-1" />
            {selectedRating} نجوم فأكثر
            <X 
              className="h-3 w-3 mr-1 cursor-pointer" 
              onClick={() => setSelectedRating(null)}
            />
          </Badge>
        )}

        {selectedCategory && (
          <Badge variant="secondary" className="flex items-center">
            <Building2 className="h-3 w-3 ml-1" />
            {categories.find(c => c.slug === selectedCategory)?.name || 'فئة'}
            <X 
              className="h-3 w-3 mr-1 cursor-pointer" 
              onClick={() => setSelectedCategory('')}
            />
          </Badge>
        )}

        {selectedCountry && (
          <Badge variant="secondary" className="flex items-center">
            <MapPin className="h-3 w-3 ml-1" />
            {countries.find(c => c.code === selectedCountry)?.name}
            <X 
              className="h-3 w-3 mr-1 cursor-pointer" 
              onClick={() => setSelectedCountry('')}
            />
          </Badge>
        )}

        {selectedCity && (
          <Badge variant="secondary" className="flex items-center">
            <MapPin className="h-3 w-3 ml-1" />
            {filteredCities.find(c => c.slug === selectedCity)?.name || 'مدينة'}
            <X 
              className="h-3 w-3 mr-1 cursor-pointer" 
              onClick={() => setSelectedCity('')}
            />
          </Badge>
        )}

        {isVerified && (
          <Badge variant="secondary" className="flex items-center">
            موثق فقط
            <X 
              className="h-3 w-3 mr-1 cursor-pointer" 
              onClick={() => setIsVerified(false)}
            />
          </Badge>
        )}
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Location Filters */}
            {showLocationFilter && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <MapPin className="h-4 w-4 ml-2" />
                  الموقع
                </h4>
                <div className="space-y-3">
                  <select
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={selectedCountry}
                    onChange={(e) => {
                      setSelectedCountry(e.target.value);
                      setSelectedCity('');
                    }}
                    disabled={loading}
                  >
                    <option value="">جميع الدول</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name} ({country.companiesCount})
                      </option>
                    ))}
                  </select>
                  
                  <select
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={selectedCity}
                    onChange={(e) => {
                      setSelectedCity(e.target.value);
                      console.log('تم تحديد المدينة:', e.target.value); // للتأكد من التحديث
                    }}
                    disabled={!selectedCountry || loading}
                  >
                    <option value="">جميع المدن</option>
                    {filteredCities.map((city) => (
                      <option key={city.slug} value={city.slug}>
                        {city.name} ({city.companiesCount})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Category Filters */}
            {showCategoryFilter && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Building2 className="h-4 w-4 ml-2" />
                  الفئات
                </h4>
                <select
                  className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={loading}
                >
                  <option value="">جميع الفئات</option>
                  {categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name} ({category.companiesCount})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Rating Filter */}
            {showRatingFilter && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Star className="h-4 w-4 ml-2" />
                  التقييم
                </h4>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={`rating-${rating}`}
                        checked={selectedRating === rating}
                        onCheckedChange={(checked) => 
                          setSelectedRating(checked ? rating : null)
                        }
                      />
                      <label
                        htmlFor={`rating-${rating}`}
                        className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex items-center"
                      >
                        <div className="flex items-center ml-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < rating
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        فأكثر
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Filters */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Filter className="h-4 w-4 ml-2" />
                فلاتر إضافية
              </h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="verified"
                    checked={isVerified}
                    onCheckedChange={(checked) => setIsVerified(!!checked)}
                  />
                  <label
                    htmlFor="verified"
                    className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    شركات موثقة فقط
                  </label>
                </div>
                
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300 block mb-2">
                    ترتيب النتائج:
                  </label>
                  <select
                    className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="rating">الأعلى تقييماً</option>
                    <option value="name">الاسم (أ-ي)</option>
                    <option value="newest">الأحدث</option>
                    <option value="reviews">الأكثر مراجعة</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
            <Button variant="outline" onClick={clearFilters}>
              مسح الفلاتر
            </Button>
            <Button onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700">
              <Search className="h-4 w-4 ml-2" />
              تطبيق الفلاتر
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}