import { AdvancedSearchFilters } from '@/components/advanced-search-filters';
import { ActiveFiltersSummary } from '@/components/active-filters-summary';
import { ActiveCategoriesList } from '@/components/active-categories-list';
import { ActiveLocationsList } from '@/components/active-locations-list';
import { RealTimeStats } from '@/components/real-time-stats';
import { FilterTestComponent } from '@/components/filter-test-component';

export default function TestFiltersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* العنوان الرئيسي */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            نظام الفلاتر المتقدم
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            جلب وعرض الفئات والبلدان والمدن النشطة من قاعدة البيانات
          </p>
        </div>

        {/* اختبار الفلاتر */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            اختبار الفلاتر
          </h2>
          <FilterTestComponent />
        </section>

        {/* الإحصائيات الحقيقية */}
        <section>
          <RealTimeStats />
        </section>

        {/* ملخص البيانات النشطة */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            ملخص البيانات النشطة
          </h2>
          <ActiveFiltersSummary />
        </section>

        {/* فلاتر البحث المتقدمة */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            فلاتر البحث المتقدمة
          </h2>
          <AdvancedSearchFilters />
        </section>

        {/* قائمة الفئات النشطة */}
        <section>
          <ActiveCategoriesList />
        </section>

        {/* قائمة البلدان والمدن النشطة */}
        <section>
          <ActiveLocationsList />
        </section>
      </div>
    </div>
  );
}
