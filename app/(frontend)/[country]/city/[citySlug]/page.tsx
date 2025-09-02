export const dynamic = "force-dynamic";
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CityHeader } from '@/components/city-header';
import { CompaniesGrid } from '@/components/companies-grid';
import { AdvancedSearchFilters } from '@/components/advanced-search-filters';
import { getCityBySlug, getCompanies } from '@/lib/database/queries';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';

export async function generateStaticParams() {
  try {
    const { getCities } = await import('@/lib/database/queries');
    const cities = await getCities();
    
    return cities.map((city) => ({
      country: city.countryCode,
      citySlug: city.slug,
    }));
  } catch (error) {
    console.error('خطأ في generateStaticParams للمدن:', error);
    return [];
  }
}

export async function generateMetadata({ 
  params 
}: { 
  params: { country: string; citySlug: string } 
}): Promise<Metadata> {
  try {
    const cityData = await getCityBySlug(params.citySlug);
    
    if (!cityData) {
      return {
        title: 'المدينة غير موجودة',
        description: 'هذه المدينة غير متوفرة في دليل الشركات',
      };
    }

    return {
      title: `${cityData.name} | دليل الشركات في ${cityData.country.name}`,
      description: `اكتشف أفضل الشركات في ${cityData.name}، ${cityData.country.name}. ابحث عن الشركات حسب الفئة والتخصص. ${cityData.companies?.length || 0} شركة متاحة.`,
      keywords: [
        `شركات ${cityData.name}`,
        `${cityData.name} ${cityData.country.name}`,
        'دليل الشركات',
        'خدمات محلية'
      ].join(', '),
      openGraph: {
        title: `${cityData.name} - دليل الشركات والخدمات`,
        description: `اكتشف أفضل الشركات في ${cityData.name}، ${cityData.country.name}`,
        images: cityData.image ? [cityData.image] : [],
      }
    };
  } catch (error) {
    console.error('خطأ في generateMetadata للمدينة:', error);
    return {
      title: 'خطأ في تحميل المدينة',
    };
  }
}

interface CityPageProps {
  params: { country: string; citySlug: string }
  searchParams?: { 
    category?: string
    rating?: string
    verified?: string
    search?: string
    sort?: string
    page?: string
  }
}

export default async function CityPage({ params, searchParams }: CityPageProps) {
  try {
    const cityData = await getCityBySlug(params.citySlug);

    if (!cityData || cityData.countryCode !== params.country.toLowerCase()) {
      notFound();
    }

    // إعداد الفلاتر من searchParams
    const filters = {
      city: params.citySlug,
      country: params.country,
      category: searchParams?.category,
      rating: searchParams?.rating ? parseFloat(searchParams.rating) : undefined,
      verified: searchParams?.verified === 'true' ? true : searchParams?.verified === 'false' ? false : undefined,
      query: searchParams?.search,
      sortBy: (searchParams?.sort as any) || 'rating',
      page: parseInt(searchParams?.page || '1'),
      limit: 20
    };

    const companiesResult = await getCompanies(filters);

    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">الرئيسية</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/${params.country}`}>{cityData.country.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{cityData.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <CityHeader city={cityData} />
        
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              الشركات في {cityData.name}
            </h2>
            <span className="text-gray-600 dark:text-gray-400">
              {companiesResult.pagination.total} شركة
            </span>
          </div>
          
          <AdvancedSearchFilters 
            showLocationFilter={false}
            showCategoryFilter={true}
            showRatingFilter={true}
            showPriceFilter={true}
            showHoursFilter={true}
          />
          
          <CompaniesGrid 
            companies={companiesResult.data} 
            pagination={companiesResult.pagination}
          />
        </div>
      </div>
    );

  } catch (error) {
    console.error('خطأ في تحميل صفحة المدينة:', error);
    
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          عذراً، حدث خطأ في تحميل المدينة
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