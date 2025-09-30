export const dynamic = "force-dynamic";
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCategoryBySlug, getCompanies } from '@/lib/database/queries';
import { CategoryHeader } from '@/components/category-header';
import { CompaniesGrid } from '@/components/companies-grid';
import { AdvancedSearchFilters } from '@/components/advanced-search-filters';
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
    const { getCategories, getCountries } = await import('@/lib/database/queries');
    const [categories, countries] = await Promise.all([
      getCategories(),
      getCountries()
    ]);
    
    const params = [];
    for (const country of countries) {
      for (const category of categories) {
        params.push({
          country: country.code,
          category: category.slug,
        });
      }
    }
    
    return params;
  } catch (error) {
    console.error('خطأ في generateStaticParams للفئات:', error);
    return [];
  }
}

export async function generateMetadata({ 
  params 
}: { 
  params: { country: string; category: string } 
}): Promise<Metadata> {
  try {
    const category = await getCategoryBySlug(params.category);
    
    if (!category) {
      return {
        title: 'الفئة غير موجودة',
        description: 'هذه الفئة غير متوفرة في دليل الشركات',
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://murabaat.com';
    const categoryUrl = `${baseUrl}/${params.country}/category/${params.category}`;

    return {
      title: `${category.name} في ${params.country.toUpperCase()} | دليل الشركات`,
      description: `اكتشف أفضل شركات ${category.name} في ${params.country.toUpperCase()}. ${category.companiesCount} شركة متخصصة مع تقييمات العملاء.`,
      keywords: [
        category.name,
        `شركات ${category.name}`,
        `${category.name} ${params.country}`,
        'دليل الشركات',
        'خدمات متخصصة'
      ].join(', '),
      
      openGraph: {
        title: `${category.name} - دليل الشركات`,
        description: `${category.companiesCount} شركة متخصصة في ${category.name}`,
        url: categoryUrl,
        // images: category.image ? [category.image] : [], 
      },

      alternates: {
        canonical: categoryUrl,
      }
    };
  } catch (error) {
    console.error('خطأ في generateMetadata للفئة:', error);
    return {
      title: 'خطأ في تحميل الفئة',
    };
  }
}

interface CategoryPageProps {
  params: { country: string; category: string }
  searchParams?: { 
    city?: string
    rating?: string
    verified?: string
    search?: string
    sort?: string
    page?: string
  }
}

export default async function CategoryPage({ params, searchParams = {} }: CategoryPageProps) {
  try {
    const category = await getCategoryBySlug(params.category);

    if (!category) {
      notFound();
    }

    // إعداد الفلاتر من searchParams
    const filters = {
      country: params.country,
      category: params.category,
      city: searchParams?.city,
      rating: searchParams?.rating ? parseFloat(searchParams.rating) : undefined,
      verified: searchParams?.verified === 'true' ? true : searchParams?.verified === 'false' ? false : undefined,
      query: searchParams?.search,
      sortBy: (searchParams?.sort as any) || 'rating',
      page: parseInt(searchParams?.page || '1'),
      limit: 20
    };

    const companiesResult = await getCompanies(filters);

    // JSON-LD Schema للفئة
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `شركات ${category.name}`,
      "description": category.description,
      "numberOfItems": companiesResult.pagination.total,
      "itemListElement": companiesResult.data.slice(0, 10).map((company, index) => ({
        "@type": "LocalBusiness",
        "position": index + 1,
        "name": company.name,
        "description": company.shortDescription,
        "url": `/${company.country.code}/city/${company.city.slug}/company/${company.slug}`,
        "image": company.mainImage,
        "aggregateRating": company.reviewsCount > 0 ? {
          "@type": "AggregateRating",
          "ratingValue": company.rating,
          "reviewCount": company.reviewsCount
        } : undefined
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
                  <Link href={`/country/${params.country}`}>{params.country.toUpperCase()}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{category.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <CategoryHeader category={category} /> {/* @ts-ignore */}
          
          <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                شركات {category.name}
              </h2>
              <span className="text-gray-600 dark:text-gray-400">
                {companiesResult.pagination.total} شركة
              </span>
            </div>
            
            <AdvancedSearchFilters 
              showLocationFilter={true}
              showCategoryFilter={false}
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
      </>
    );

  } catch (error) {
    console.error('خطأ في تحميل صفحة الفئة:', error);
    
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          عذراً، حدث خطأ في تحميل الفئة
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