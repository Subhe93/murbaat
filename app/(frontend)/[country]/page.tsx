import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CountryHeader } from '@/components/country-header';
import { CitiesGrid } from '@/components/cities-grid';
import { CompaniesGrid } from '@/components/companies-grid';
import { AdvancedSearchFilters } from '@/components/advanced-search-filters';
import { 
  getCountryByCode, 
  getCountryCities, 
  getCountryCompanies, 
  getCountryFilterOptions,
  generateCountryMetadata,
  getAllCountries 
} from '@/lib/services/country.service';

export async function generateStaticParams() {
  try {
    const countries = await getAllCountries();
    return countries.map((country) => ({
      country: country.code,
    }));
  } catch (error) {
    console.error('خطأ في generateStaticParams:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: { country: string } }): Promise<Metadata> {
  return await generateCountryMetadata(params.country);
}

interface CountryPageProps {
  params: { country: string }
  searchParams: { 
    category?: string
    city?: string
    rating?: string
    verified?: string
    search?: string
    sort?: string
    page?: string
  }
}

export default async function CountryPage({ params, searchParams }: CountryPageProps) {
  try {
    const [countryData, cities, filterOptions] = await Promise.all([
      getCountryByCode(params.country),
      getCountryCities(params.country),
      getCountryFilterOptions(params.country),
    ]);

    if (!countryData) {
      notFound();
    }

    // إعداد الفلاتر من searchParams
    const filters = {
      categoryId: searchParams.category,
      cityId: searchParams.city,
      minRating: searchParams.rating ? parseFloat(searchParams.rating) : undefined,
      isVerified: searchParams.verified === 'true' ? true : searchParams.verified === 'false' ? false : undefined,
      searchQuery: searchParams.search,
      sortBy: (searchParams.sort as any) || 'rating',
      page: parseInt(searchParams.page || '1'),
    };

    const companiesResult = await getCountryCompanies(params.country, filters, filters.page, 20);

    // JSON-LD Schema للبلد
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Place",
      "name": countryData.name,
      "description": countryData.description,
      "image": countryData.image,
      "containsPlace": cities.map(city => ({
        "@type": "City",
        "name": city.name,
        "description": city.description
      }))
    };

    return (
      <>
        {/* JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />

        <div className="container mx-auto px-4 py-8">
          <CountryHeader country={countryData} />
          
          <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">المدن الرئيسية</h2>
              <span className="text-gray-600 dark:text-gray-400">
                {cities.length} مدينة
              </span>
            </div>
            <CitiesGrid cities={cities} countryCode={params.country} />
          </div>

          <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">الشركات</h2>
              <span className="text-gray-600 dark:text-gray-400">
                {companiesResult.totalCount} شركة
              </span>
            </div>
            
            <AdvancedSearchFilters   
              showLocationFilter={false}
              showCategoryFilter={true}
              showRatingFilter={true}
              showPriceFilter={true}
              showHoursFilter={true}
              filterOptions={filterOptions}
            />
            
            <CompaniesGrid 
              companies={companiesResult.companies} 
              pagination={{
                page: filters.page,
                limit: 20,
                total: companiesResult.totalCount,
                totalPages: companiesResult.totalPages
              }}
            />
          </div>
        </div>
      </>
    );

  } catch (error) {
    console.error('خطأ في تحميل صفحة البلد:', error);
    
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          عذراً، حدث خطأ في تحميل البلد
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية
        </p>
        <Link 
          href="/" 
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          العودة للرئيسية
        </Link>
      </div>
    );
  }
}