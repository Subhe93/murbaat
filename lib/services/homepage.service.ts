import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Types للبيانات المطلوبة
export interface HomePageCountry {
  id: string;
  code: string;
  name: string;
  flag: string | null;
  image: string | null;
  description: string | null;
  companiesCount: number;
}

export interface HomePageCompany {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  mainImage: string | null;
  rating: number;
  reviewsCount: number;
  isFeatured: boolean;
  category: {
    name: string;
    slug: string;
  };
  city: {
    name: string;
    slug: string;
    country: {
      code: string;
      name: string;
    };
  };
}

export interface HomePageCategory {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  description: string | null;
  companiesCount: number;
}

export interface HomePageReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  userName: string; // اسم المستخدم من جدول Review
  userAvatar: string | null; // صورة المستخدم من جدول Review
  user: {
    name: string | null;
    avatar: string | null;
  } | null;
  company: {
    name: string;
    slug: string;
    city: {
      slug: string;
      country: {
        code: string;
      };
    };
  };
}

export interface HomePageData {
  countries: HomePageCountry[];
  featuredCompanies: HomePageCompany[];
  categories: HomePageCategory[];
  latestReviews: HomePageReview[];
  stats: {
    totalCountries: number;
    totalCompanies: number;
    totalCategories: number;
    totalReviews: number;
  };
}

// استخدام React cache لتحسين الأداء
export const getHomePageData = cache(async (): Promise<HomePageData> => {
  try {
    const [countries, featuredCompanies, categories, latestReviews] =
      await Promise.all([
        // جميع البلدان النشطة (مع إعطاء أولوية للبلدان التي تحتوي على شركات)
        prisma.country.findMany({
          where: {
            isActive: true,
          },
          select: {
            id: true,
            code: true,
            name: true,
            flag: true,
            image: true,
            description: true,
            companiesCount: true,
          },
          orderBy: [
            { companiesCount: "desc" }, // البلدان التي تحتوي على شركات أولاً
            { name: "asc" }, // ثم ترتيب أبجدي
          ],
          // عرض كحد أقصى 50 بلد للأداء (يمكن تعديله حسب الحاجة)
          take: 50,
        }),

        // الشركات المميزة مع fallback
        prisma.company.findMany({
          where: {
            isActive: true,
          },
          select: {
            id: true,
            slug: true,
            name: true,
            shortDescription: true,
            mainImage: true,
            rating: true,
            reviewsCount: true,
            isFeatured: true,
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
            city: {
              select: {
                name: true,
                slug: true,
                country: {
                  select: {
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: [
            { isFeatured: "desc" }, // الشركات المميزة أولاً
            { rating: "desc" }, // ثم حسب التقييم
            { reviewsCount: "desc" }, // ثم حسب عدد المراجعات
            { createdAt: "desc" }, // الأحدث إنشاءً
          ],
          take: 6,
        }),

        // الفئات النشطة مع عدد الشركات
        prisma.category.findMany({
          where: {
            isActive: true,
            // companies: {
            //   some: {
            //     isActive: true
            //   }
            // }
          },
          select: {
            id: true,
            slug: true,
            name: true,
            icon: true,
            description: true,
            companiesCount: true,
          },
          orderBy: { companiesCount: "desc" },
          take: 12,
        }),

        // أحدث المراجعات المعتمدة
        prisma.review.findMany({
          where: {
            isApproved: true, // استخدام الحقل الصحيح من schema
            company: {
              isActive: true,
            },
          },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            userName: true, // اسم المستخدم من جدول Review مباشرة
            userAvatar: true, // صورة المستخدم من جدول Review مباشرة
            user: {
              select: {
                name: true,
                avatar: true, // استخدام الحقل الصحيح من schema
              },
            },
            company: {
              select: {
                name: true,
                slug: true,
                city: {
                  select: {
                    slug: true,
                    country: {
                      select: {
                        code: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 6,
        }),
      ]);

    return {
      countries,
      featuredCompanies,
      categories,
      latestReviews,
      stats: {
        totalCountries: countries.length,
        totalCompanies: featuredCompanies.length,
        totalCategories: categories.length,
        totalReviews: latestReviews.length,
      },
    };
  } catch (error) {
    console.error("خطأ في جلب بيانات الصفحة الرئيسية:", error);

    // إرجاع بيانات فارغة في حالة الخطأ
    return {
      countries: [],
      featuredCompanies: [],
      categories: [],
      latestReviews: [],
      stats: {
        totalCountries: 0,
        totalCompanies: 0,
        totalCategories: 0,
        totalReviews: 0,
      },
    };
  }
});

// دالة للحصول على إحصائيات عامة للموقع (للـ SEO)
export const getSiteStats = cache(async () => {
  try {
    const [countriesCount, companiesCount, categoriesCount, reviewsCount] =
      await Promise.all([
        prisma.country.count({ where: { isActive: true } }),
        prisma.company.count({ where: { isActive: true } }),
        prisma.category.count({ where: { isActive: true } }),
        prisma.review.count({ where: { isApproved: true } }), // استخدام الحقل الصحيح
      ]);

    return {
      countriesCount,
      companiesCount,
      categoriesCount,
      reviewsCount,
    };
  } catch (error) {
    console.error("خطأ في جلب إحصائيات الموقع:", error);
    return {
      countriesCount: 0,
      companiesCount: 0,
      categoriesCount: 0,
      reviewsCount: 0,
    };
  }
});

// دالة للحصول على جميع البلدان (بدون حد)
export const getAllCountries = cache(async () => {
  try {
    return await prisma.country.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        flag: true,
        image: true,
        description: true,
        companiesCount: true,
      },
      orderBy: [
        { companiesCount: "desc" }, // البلدان التي تحتوي على شركات أولاً
        { name: "asc" }, // ثم ترتيب أبجدي
      ],
      // بدون take لعرض جميع البلدان
    });
  } catch (error) {
    console.error("خطأ في جلب جميع البلدان:", error);
    return [];
  }
});
