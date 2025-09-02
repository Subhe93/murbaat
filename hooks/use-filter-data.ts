import { useState, useEffect } from 'react';

interface Category {
  id: string;
  slug: string;
  name: string;
  icon?: string;
  description?: string;
  companiesCount: number;
}

interface Country {
  id: string;
  code: string;
  name: string;
  flag?: string;
  companiesCount: number;
}

interface City {
  id: string;
  slug: string;
  name: string;
  companiesCount: number;
  country: {
    id: string;
    name: string;
    code: string;
  };
}

interface FilterData {
  categories: Category[];
  countries: Country[];
  cities: City[];
  loading: boolean;
  error: string | null;
}

export function useFilterData() {
  const [data, setData] = useState<FilterData>({
    categories: [],
    countries: [],
    cities: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        // جلب الفئات النشطة
        const categoriesResponse = await fetch('/api/categories?activeOnly=true');
        const categoriesData = await categoriesResponse.json();

        // جلب البلدان النشطة
        const countriesResponse = await fetch('/api/countries?activeOnly=true');
        const countriesData = await countriesResponse.json();

        if (categoriesData.success && countriesData.success) {
          setData({
            categories: categoriesData.categories || [],
            countries: countriesData.countries || [],
            cities: [],
            loading: false,
            error: null
          });
        } else {
          throw new Error('فشل في جلب البيانات');
        }
      } catch (error) {
        console.error('خطأ في جلب بيانات الفلاتر:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'حدث خطأ في جلب البيانات'
        }));
      }
    };

    fetchData();
  }, []);

  const fetchCitiesByCountry = async (countryCode: string) => {
    try {
      const response = await fetch(`/api/cities?countryCode=${countryCode}&activeOnly=true`);
      const data = await response.json();

      if (data.success) {
        setData(prev => ({
          ...prev,
          cities: data.cities || []
        }));
        return data.cities || [];
      } else {
        throw new Error('فشل في جلب المدن');
      }
    } catch (error) {
      console.error('خطأ في جلب المدن:', error);
      setData(prev => ({
        ...prev,
        cities: []
      }));
      return [];
    }
  };

  return {
    ...data,
    fetchCitiesByCountry
  };
}
