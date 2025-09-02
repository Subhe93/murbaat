export const dynamic = "force-dynamic";
import { Metadata } from 'next';
import { Suspense } from 'react';
import { AdvancedSearchFilters } from '@/components/advanced-search-filters';
import { CompaniesGrid } from '@/components/companies-grid';
import { getCompanies } from '@/lib/database/queries';

export const metadata: Metadata = {
  title: ' الشركات | مربعات - دليل الشركات',
  description: 'ابحث عن الشركات والخدمات باستخدام الفلاتر المتقدمة. ابحث حسب الموقع، الفئة، التقييم، والمزيد.',
  keywords: 'البحث عن شركات, فلاتر البحث, دليل الشركات, البحث المتقدم',
  openGraph: {
    title: 'الشركات - مربعات',
    description: 'ابحث عن الشركات والخدمات المناسبة باستخدام الفلاتر المتقدمة',
  }
};

interface SearchPageProps {
  searchParams?: {
    q?: string
    country?: string
    city?: string
    category?: string
    rating?: string
    verified?: string
    sort?: string
    page?: string
  }
}

async function SearchResults({ searchParams }: { searchParams: SearchPageProps['searchParams'] }) {
  const filters = {
    query: searchParams?.q,
    country: searchParams?.country,
    city: searchParams?.city,
    category: searchParams?.category,
    rating: searchParams?.rating ? parseFloat(searchParams.rating) : undefined,
    verified: searchParams?.verified === 'true' ? true : searchParams?.verified === 'false' ? false : undefined,
    sortBy: (searchParams?.sort as any) || 'rating',
    page: parseInt(searchParams?.page || '1'),
    limit: 20
  };

  const companiesResult = await getCompanies(filters);

  return (
    <>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            نتائج البحث
            {searchParams?.q && (
              <span className="text-blue-600 dark:text-blue-400"> عن "{searchParams.q}"</span>
            )}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {companiesResult.pagination.total} شركة
          </p>
        </div>
        
        {companiesResult.pagination.total === 0 && searchParams?.q && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mt-4">
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              لم يتم العثور على نتائج
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              جرب استخدام كلمات مختلفة أو قم بتوسيع معايير البحث
            </p>
          </div>
        )}
      </div>

      <CompaniesGrid 
        companies={companiesResult.data} 
        pagination={companiesResult.pagination}
      />
    </>
  );
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          الشركات
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          استخدم الفلاتر المتقدمة للعثور على الشركات والخدمات المناسبة لك
        </p>
      </div>

      <AdvancedSearchFilters 
        showLocationFilter={true}
        showCategoryFilter={true}
        showRatingFilter={true}
        showPriceFilter={true}
        showHoursFilter={true}
        initialValues={searchParams}
      />

      <Suspense fallback={
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="mr-3 text-gray-600 dark:text-gray-400">جارٍ البحث...</span>
        </div>
      }>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}