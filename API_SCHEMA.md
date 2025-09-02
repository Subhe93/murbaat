# API Schema - دليل الشركات (Morabbat Directory)

## قاعدة البيانات (Database Schema)

### 1. جدول البلدان (Countries)
```sql
CREATE TABLE countries (
    id SERIAL PRIMARY KEY,
    code VARCHAR(2) UNIQUE NOT NULL, -- كود البلد (sy, lb, jo, eg)
    name VARCHAR(100) NOT NULL, -- اسم البلد باللغة العربية
    flag VARCHAR(10), -- رمز العلم
    image TEXT, -- رابط صورة البلد
    description TEXT, -- وصف البلد
    companies_count INTEGER DEFAULT 0, -- عدد الشركات
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. جدول المدن (Cities)
```sql
CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL, -- معرف فريد للمدينة
    name VARCHAR(100) NOT NULL, -- اسم المدينة باللغة العربية
    country_id INTEGER REFERENCES countries(id) ON DELETE CASCADE,
    country_code VARCHAR(2) NOT NULL, -- للاستعلامات السريعة
    image TEXT, -- رابط صورة المدينة
    description TEXT, -- وصف المدينة
    companies_count INTEGER DEFAULT 0, -- عدد الشركات
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_cities_country (country_code),
    INDEX idx_cities_slug (slug)
);
```

### 3. جدول الفئات (Categories)
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL, -- معرف فريد للفئة
    name VARCHAR(100) NOT NULL, -- اسم الفئة باللغة العربية
    icon VARCHAR(50), -- اسم الأيقونة (Lucide React)
    description TEXT, -- وصف الفئة
    companies_count INTEGER DEFAULT 0, -- عدد الشركات
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_categories_slug (slug)
);
```

### 4. جدول الشركات (Companies)
```sql
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(150) UNIQUE NOT NULL, -- معرف فريد للشركة
    name VARCHAR(200) NOT NULL, -- اسم الشركة
    description TEXT, -- وصف الشركة
    category_id INTEGER REFERENCES categories(id),
    category_slug VARCHAR(100) NOT NULL, -- للاستعلامات السريعة
    city_id INTEGER REFERENCES cities(id),
    city_slug VARCHAR(100) NOT NULL, -- للاستعلامات السريعة
    country_id INTEGER REFERENCES countries(id),
    country_code VARCHAR(2) NOT NULL, -- للاستعلامات السريعة
    
    -- معلومات الاتصال
    phone VARCHAR(20),
    email VARCHAR(100),
    website TEXT,
    address TEXT,
    
    -- الصور
    main_image TEXT, -- الصورة الرئيسية
    
    -- التقييمات
    rating DECIMAL(2,1) DEFAULT 0, -- متوسط التقييم
    reviews_count INTEGER DEFAULT 0, -- عدد المراجعات
    
    -- الموقع الجغرافي
    latitude DECIMAL(10, 8), -- خط العرض
    longitude DECIMAL(11, 8), -- خط الطول
    
    -- الحالة
    is_verified BOOLEAN DEFAULT false, -- شركة موثقة
    is_featured BOOLEAN DEFAULT false, -- شركة مميزة
    is_active BOOLEAN DEFAULT true,
    
    -- الأوقات
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_companies_country (country_code),
    INDEX idx_companies_city (city_slug),
    INDEX idx_companies_category (category_slug),
    INDEX idx_companies_rating (rating),
    INDEX idx_companies_slug (slug),
    FULLTEXT INDEX idx_companies_search (name, description, address)
);
```

### 5. جدول صور الشركات (Company Images)
```sql
CREATE TABLE company_images (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(200),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_company_images_company (company_id)
);
```

### 6. جدول علامات الشركات (Company Tags)
```sql
CREATE TABLE company_tags (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_company_tags_company (company_id),
    INDEX idx_company_tags_name (tag_name)
);
```

### 7. جدول ساعات العمل (Working Hours)
```sql
CREATE TABLE working_hours (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL, -- الأحد, الاثنين, الثلاثاء...
    open_time TIME, -- وقت الفتح
    close_time TIME, -- وقت الإغلاق
    is_closed BOOLEAN DEFAULT false, -- مغلق في هذا اليوم
    
    INDEX idx_working_hours_company (company_id),
    UNIQUE KEY unique_company_day (company_id, day_of_week)
);
```

### 8. جدول وسائل التواصل الاجتماعي (Social Media)
```sql
CREATE TABLE company_social_media (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- facebook, twitter, instagram, linkedin
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_social_media_company (company_id),
    UNIQUE KEY unique_company_platform (company_id, platform)
);
```

### 9. جدول المراجعات (Reviews)
```sql
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    user_email VARCHAR(100),
    user_avatar TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200) NOT NULL,
    comment TEXT NOT NULL,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_reviews_company (company_id),
    INDEX idx_reviews_rating (rating),
    INDEX idx_reviews_created (created_at),
    FULLTEXT INDEX idx_reviews_search (title, comment)
);
```

### 10. جدول صور المراجعات (Review Images)
```sql
CREATE TABLE review_images (
    id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(200),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_review_images_review (review_id)
);
```

### 11. جدول تقييم المراجعات (Review Ratings)
```sql
CREATE TABLE review_ratings (
    id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    is_helpful BOOLEAN NOT NULL, -- true للمفيد، false لغير المفيد
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_review_ratings_review (review_id),
    UNIQUE KEY unique_ip_review (review_id, ip_address)
);
```

### 12. جدول الجوائز (Awards)
```sql
CREATE TABLE awards (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    year INTEGER,
    award_type ENUM('gold', 'silver', 'bronze', 'certificate') DEFAULT 'certificate',
    issuer VARCHAR(200), -- الجهة المانحة
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_awards_company (company_id),
    INDEX idx_awards_year (year)
);
```

---

## واجهات البرمجة (REST API Endpoints)

### المصادقة (Authentication)
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
```

### البلدان (Countries)
```
GET    /api/countries                    # قائمة جميع البلدان
GET    /api/countries/{countryCode}      # تفاصيل بلد معين
GET    /api/countries/{countryCode}/cities # مدن البلد
GET    /api/countries/{countryCode}/companies # شركات البلد
POST   /api/countries                    # إضافة بلد جديد (Admin)
PUT    /api/countries/{countryCode}      # تحديث بلد (Admin)
DELETE /api/countries/{countryCode}      # حذف بلد (Admin)
```

### المدن (Cities)
```
GET    /api/cities                       # قائمة جميع المدن
GET    /api/cities/{countryCode}/{citySlug} # تفاصيل مدينة معينة
GET    /api/cities/{countryCode}/{citySlug}/companies # شركات المدينة
POST   /api/cities                       # إضافة مدينة جديدة (Admin)
PUT    /api/cities/{countryCode}/{citySlug} # تحديث مدينة (Admin)
DELETE /api/cities/{countryCode}/{citySlug} # حذف مدينة (Admin)
```

### الفئات (Categories)
```
GET    /api/categories                   # قائمة جميع الفئات
GET    /api/categories/{categorySlug}    # تفاصيل فئة معينة
GET    /api/categories/{categorySlug}/companies # شركات الفئة
POST   /api/categories                   # إضافة فئة جديدة (Admin)
PUT    /api/categories/{categorySlug}    # تحديث فئة (Admin)
DELETE /api/categories/{categorySlug}    # حذف فئة (Admin)
```

### الشركات (Companies)
```
GET    /api/companies                    # قائمة الشركات مع الفلاتر
GET    /api/companies/{countryCode}/{citySlug}/{companySlug} # تفاصيل شركة
POST   /api/companies                    # إضافة شركة جديدة
PUT    /api/companies/{id}               # تحديث شركة
DELETE /api/companies/{id}               # حذف شركة
PATCH  /api/companies/{id}/verify        # توثيق شركة (Admin)
PATCH  /api/companies/{id}/feature       # جعل الشركة مميزة (Admin)

# إدارة صور الشركة
GET    /api/companies/{id}/images        # صور الشركة
POST   /api/companies/{id}/images        # إضافة صورة
DELETE /api/companies/{id}/images/{imageId} # حذف صورة

# إدارة ساعات العمل
GET    /api/companies/{id}/working-hours # ساعات العمل
PUT    /api/companies/{id}/working-hours # تحديث ساعات العمل

# إدارة وسائل التواصل
GET    /api/companies/{id}/social-media  # وسائل التواصل
PUT    /api/companies/{id}/social-media  # تحديث وسائل التواصل
```

### البحث (Search)
```
GET    /api/search                       # البحث العام
GET    /api/search/suggestions           # اقتراحات البحث
GET    /api/search/autocomplete          # الإكمال التلقائي

# معاملات البحث:
# - q: النص المراد البحث عنه
# - country: كود البلد
# - city: معرف المدينة
# - category: معرف الفئة
# - rating: التقييم الأدنى
# - verified: الشركات الموثقة فقط
# - featured: الشركات المميزة فقط
# - open_now: المفتوحة الآن
# - page: رقم الصفحة
# - limit: عدد النتائج لكل صفحة
```

### المراجعات (Reviews)
```
GET    /api/reviews                      # قائمة المراجعات
GET    /api/reviews/{id}                 # تفاصيل مراجعة
POST   /api/reviews                      # إضافة مراجعة جديدة
PUT    /api/reviews/{id}                 # تحديث مراجعة
DELETE /api/reviews/{id}                 # حذف مراجعة
PATCH  /api/reviews/{id}/approve         # الموافقة على مراجعة (Admin)
PATCH  /api/reviews/{id}/verify          # توثيق مراجعة (Admin)

# تقييم المراجعات
POST   /api/reviews/{id}/rate            # تقييم مراجعة (مفيد/غير مفيد)

# مراجعات شركة معينة
GET    /api/companies/{companyId}/reviews # مراجعات الشركة
```

### الجوائز (Awards)
```
GET    /api/companies/{companyId}/awards # جوائز الشركة
POST   /api/companies/{companyId}/awards # إضافة جائزة (Admin)
PUT    /api/awards/{id}                  # تحديث جائزة (Admin)
DELETE /api/awards/{id}                  # حذف جائزة (Admin)
```

### الإحصائيات (Statistics)
```
GET    /api/stats/overview               # الإحصائيات العامة
GET    /api/stats/countries              # إحصائيات البلدان
GET    /api/stats/categories             # إحصائيات الفئات
GET    /api/stats/reviews                # إحصائيات المراجعات
```

### رفع الملفات (File Upload)
```
POST   /api/upload/image                 # رفع صورة
POST   /api/upload/multiple              # رفع عدة ملفات
DELETE /api/upload/{filename}            # حذف ملف
```

---

## نماذج البيانات (Data Models)

### Country Model
```typescript
interface Country {
  id: number;
  code: string;
  name: string;
  flag: string;
  image: string;
  description: string;
  companiesCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### City Model
```typescript
interface City {
  id: number;
  slug: string;
  name: string;
  countryId: number;
  countryCode: string;
  image: string;
  description: string;
  companiesCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // العلاقات
  country?: Country;
}
```

### Category Model
```typescript
interface Category {
  id: number;
  slug: string;
  name: string;
  icon: string;
  description: string;
  companiesCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Company Model
```typescript
interface Company {
  id: number;
  slug: string;
  name: string;
  description: string;
  categoryId: number;
  categorySlug: string;
  cityId: number;
  citySlug: string;
  countryId: number;
  countryCode: string;
  
  // معلومات الاتصال
  phone: string;
  email: string;
  website: string;
  address: string;
  
  // الصور
  mainImage: string;
  
  // التقييمات
  rating: number;
  reviewsCount: number;
  
  // الموقع
  latitude: number;
  longitude: number;
  
  // الحالة
  isVerified: boolean;
  isFeatured: boolean;
  isActive: boolean;
  
  createdAt: string;
  updatedAt: string;
  
  // العلاقات
  country?: Country;
  city?: City;
  category?: Category;
  images?: CompanyImage[];
  tags?: CompanyTag[];
  workingHours?: WorkingHour[];
  socialMedia?: SocialMedia[];
  reviews?: Review[];
  awards?: Award[];
}
```

### Review Model
```typescript
interface Review {
  id: number;
  companyId: number;
  userName: string;
  userEmail: string;
  userAvatar: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  helpfulCount: number;
  notHelpfulCount: number;
  isVerified: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  
  // العلاقات
  company?: Company;
  images?: ReviewImage[];
}
```

### Working Hours Model
```typescript
interface WorkingHour {
  id: number;
  companyId: number;
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}
```

### Social Media Model
```typescript
interface SocialMedia {
  id: number;
  companyId: number;
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin';
  url: string;
  isActive: boolean;
}
```

### Award Model
```typescript
interface Award {
  id: number;
  companyId: number;
  title: string;
  description: string;
  year: number;
  awardType: 'gold' | 'silver' | 'bronze' | 'certificate';
  issuer: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
}
```

---

## استجابات API (API Responses)

### استجابة ناجحة
```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

### استجابة خطأ
```typescript
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### استجابة البحث
```typescript
interface SearchResponse {
  companies: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    countries: Country[];
    cities: City[];
    categories: Category[];
    ratings: number[];
  };
}
```

---

## أمثلة على الاستعلامات (Query Examples)

### البحث عن الشركات
```
GET /api/companies?q=تقنية&country=sy&city=damascus&category=technology&rating=4&page=1&limit=20
```

### إضافة مراجعة
```
POST /api/reviews
Content-Type: application/json

{
  "companyId": 1,
  "userName": "أحمد محمد",
  "userEmail": "ahmed@example.com",
  "rating": 5,
  "title": "خدمة ممتازة",
  "comment": "شركة رائعة وخدمة عملاء ممتازة",
  "images": ["image1.jpg", "image2.jpg"]
}
```

### تحديث ساعات العمل
```
PUT /api/companies/1/working-hours
Content-Type: application/json

{
  "الأحد": { "openTime": "09:00", "closeTime": "17:00", "isClosed": false },
  "الاثنين": { "openTime": "09:00", "closeTime": "17:00", "isClosed": false },
  "الثلاثاء": { "openTime": "09:00", "closeTime": "17:00", "isClosed": false },
  "الأربعاء": { "openTime": "09:00", "closeTime": "17:00", "isClosed": false },
  "الخميس": { "openTime": "09:00", "closeTime": "17:00", "isClosed": false },
  "الجمعة": { "isClosed": true },
  "السبت": { "openTime": "09:00", "closeTime": "14:00", "isClosed": false }
}
```

هذا المخطط يوفر أساساً شاملاً لبناء الباك اند وقاعدة البيانات لدليل الشركات.
