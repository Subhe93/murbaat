# نظام الفلاتر المتقدم - التحديثات الجديدة

## نظرة عامة

تم تحديث نظام الفلاتر لجلب وعرض الفئات والبلدان والمدن النشطة من قاعدة البيانات بدلاً من استخدام البيانات الثابتة.

## المكونات الجديدة

### 1. Hook لجلب البيانات (`hooks/use-filter-data.ts`)

```typescript
import { useFilterData } from '@/hooks/use-filter-data';

const { categories, countries, cities, loading, error, fetchCitiesByCountry } = useFilterData();
```

**الميزات:**
- جلب الفئات النشطة من `/api/categories?activeOnly=true`
- جلب البلدان النشطة من `/api/countries?activeOnly=true`
- جلب المدن حسب البلد من `/api/cities?countryCode=${code}&activeOnly=true`
- إدارة حالة التحميل والأخطاء
- تحديث تلقائي للمدن عند تغيير البلد المحدد

### 2. مكون ملخص البيانات النشطة (`components/active-filters-summary.tsx`)

يعرض إحصائيات سريعة للبيانات النشطة:
- عدد الفئات النشطة
- عدد البلدان النشطة
- عدد المدن المتاحة
- إجمالي عدد الشركات

### 3. مكون قائمة الفئات النشطة (`components/active-categories-list.tsx`)

يعرض قائمة تفصيلية للفئات النشطة مع:
- عدد الشركات في كل فئة
- وصف الفئة (إن وجد)
- رابط للانتقال إلى صفحة الفئة

### 4. مكون قائمة المواقع النشطة (`components/active-locations-list.tsx`)

يعرض البلدان والمدن النشطة مع:
- قائمة قابلة للتوسيع للمدن
- عدد الشركات في كل بلد/مدينة
- روابط للانتقال إلى صفحات البلدان والمدن

### 5. تحديث مكون الفلاتر المتقدمة (`components/advanced-search-filters.tsx`)

**التحسينات:**
- استخدام البيانات النشطة من قاعدة البيانات
- عرض عدد الشركات في كل خيار
- إدارة حالة التحميل
- معالجة الأخطاء
- تحديث تلقائي للمدن عند تغيير البلد

## API Endpoints المستخدمة

### 1. جلب الفئات النشطة
```
GET /api/categories?activeOnly=true
```

**الاستجابة:**
```json
{
  "success": true,
  "categories": [
    {
      "id": "1",
      "slug": "technology",
      "name": "التكنولوجيا",
      "icon": "laptop",
      "description": "شركات التكنولوجيا والبرمجيات",
      "companiesCount": 15
    }
  ]
}
```

### 2. جلب البلدان النشطة
```
GET /api/countries?activeOnly=true
```

**الاستجابة:**
```json
{
  "success": true,
  "countries": [
    {
      "id": "1",
      "code": "sy",
      "name": "سوريا",
      "flag": "🇸🇾",
      "companiesCount": 25
    }
  ]
}
```

### 3. جلب المدن حسب البلد
```
GET /api/cities?countryCode=sy&activeOnly=true
```

**الاستجابة:**
```json
{
  "success": true,
  "cities": [
    {
      "id": "1",
      "slug": "damascus",
      "name": "دمشق",
      "companiesCount": 10,
      "country": {
        "id": "1",
        "name": "سوريا",
        "code": "sy"
      }
    }
  ]
}
```

## كيفية الاستخدام

### 1. في صفحة البحث
```tsx
import { AdvancedSearchFilters } from '@/components/advanced-search-filters';

export default function SearchPage() {
  return (
    <div>
      <AdvancedSearchFilters />
      {/* باقي محتوى الصفحة */}
    </div>
  );
}
```

### 2. عرض ملخص البيانات
```tsx
import { ActiveFiltersSummary } from '@/components/active-filters-summary';

export default function HomePage() {
  return (
    <div>
      <ActiveFiltersSummary />
      {/* باقي محتوى الصفحة */}
    </div>
  );
}
```

### 3. عرض قائمة الفئات
```tsx
import { ActiveCategoriesList } from '@/components/active-categories-list';

export default function CategoriesPage() {
  return (
    <div>
      <ActiveCategoriesList />
    </div>
  );
}
```

### 4. عرض قائمة المواقع
```tsx
import { ActiveLocationsList } from '@/components/active-locations-list';

export default function LocationsPage() {
  return (
    <div>
      <ActiveLocationsList />
    </div>
  );
}
```

## الصفحة التجريبية

تم إنشاء صفحة تجريبية لعرض جميع المكونات الجديدة:
```
/test-filters
```

## الميزات الجديدة

1. **جلب البيانات النشطة:** جميع البيانات تأتي من قاعدة البيانات مع فلتر `isActive: true`
2. **عرض عدد الشركات:** كل خيار يعرض عدد الشركات المسجلة
3. **إدارة الحالة:** عرض حالات التحميل والأخطاء
4. **تحديث تلقائي:** تحديث المدن عند تغيير البلد المحدد
5. **تصميم متجاوب:** يعمل على جميع أحجام الشاشات
6. **دعم الوضع المظلم:** متوافق مع نظام الألوان المظلم

## ملاحظات مهمة

1. تأكد من أن قاعدة البيانات تحتوي على بيانات نشطة
2. جميع API endpoints تدعم معامل `activeOnly=true`
3. يتم جلب المدن بشكل ديناميكي عند الحاجة
4. جميع المكونات تدعم الترجمة العربية
5. تم إضافة معالجة الأخطاء في جميع المكونات
