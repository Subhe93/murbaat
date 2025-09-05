export const dynamic = "force-dynamic";
import Link from 'next/link';
import { Metadata } from 'next';
import { HomeHero } from '@/components/home-hero';
import { CountriesGrid } from '@/components/countries-grid';
import { FeaturedCompanies } from '@/components/featured-companies';
import { LatestReviews } from '@/components/latest-reviews';
import { ServicesCategories } from '@/components/services-categories';
import { getHomePageData, getSiteStats, getAllCountries } from '@/lib/services/homepage.service';
import { generateHomePageMetadata, generateJsonLd } from '@/lib/seo/metadata';

// Generate dynamic metadata with stats for SEO
export async function generateMetadata(): Promise<Metadata> {
  const stats = await getSiteStats();
  return generateHomePageMetadata(stats);
}

export default async function HomePage() {
  try {
    // جلب البيانات باستخدام طبقة الخدمات المحسنة
    const [data, allCountries, stats] = await Promise.all([
      getHomePageData(),
      getAllCountries(),
      getSiteStats()
    ]);
    
    // تسجيل إحصائيات للتطوير
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 بيانات الصفحة الرئيسية:', {
        countries: data.countries.length,
        allCountries: allCountries.length,
        companies: data.featuredCompanies.length,
        categories: data.categories.length,
        reviews: data.latestReviews.length,
        totalStats: stats
      });
    }
    
    // JSON-LD schema للـ SEO
    const jsonLd = generateJsonLd(stats);

    return (
      <>
        {/* JSON-LD Schema for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
        
        <div className="space-y-12">
          <HomeHero stats={stats} />
          <ServicesCategories categories={data.categories} />
                <div className="text-center mt-12">
        <Link
          href="/services"
          className="inline-flex items-center px-8 py-4 bg-brand-orange hover:bg-orange-600 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-1 animate-fade-in-up delay-1200"
        >
          عرض جميع الخدمات
        </Link>
      </div>
          <CountriesGrid countries={allCountries} />
          <FeaturedCompanies companies={data.featuredCompanies} />
          <LatestReviews reviews={data.latestReviews} />
          <br></br>
        </div>
      </>
    );
    
  } catch (error) {
    console.error('خطأ في تحميل الصفحة الرئيسية:', error);
    
    // صفحة خطأ بسيطة
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          عذراً، حدث خطأ في تحميل الصفحة
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          يرجى المحاولة مرة أخرى أو إعادة تحميل الصفحة
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          إعادة تحميل الصفحة
        </button>
      </div>
    );
  }
}