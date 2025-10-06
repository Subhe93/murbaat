import { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // إعادة التحقق كل ساعة

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://murabaat.com'
  
  // الصفحات الثابتة
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  try {
    // جلب جميع البيانات الديناميكية بشكل موازي
    const [
      countries,
      cities,
      subAreas,
      categories,
      subCategories,
      companies,
      rankingPages,
    ] = await Promise.all([
      // الدول
      prisma.country.findMany({
        where: { isActive: true },
        select: { code: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),

      // المدن
      prisma.city.findMany({
        where: { isActive: true },
        select: { slug: true, countryCode: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),

      // المناطق الفرعية
      prisma.subArea.findMany({
        where: { isActive: true },
        include: {
          city: {
            select: { slug: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
      }),

      // الفئات
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),

      // الفئات الفرعية
      prisma.subCategory.findMany({
        where: { isActive: true },
        include: {
          category: {
            select: { slug: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
      }),

      // الشركات
      prisma.company.findMany({
        where: { isActive: true },
        select: {
          slug: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),

      // صفحات التصنيف
      prisma.rankingPage.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ])

    // صفحات الدول
    const countryPages: MetadataRoute.Sitemap = countries.map((country) => ({
      url: `${baseUrl}/country/${country.code}`,
      lastModified: country.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    // صفحات المدن
    const cityPages: MetadataRoute.Sitemap = cities.map((city) => ({
      url: `${baseUrl}/country/${city.countryCode}/city/${city.slug}`,
      lastModified: city.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    // صفحات المناطق الفرعية
    const subAreaPages: MetadataRoute.Sitemap = subAreas.map((subArea) => ({
      url: `${baseUrl}/country/${subArea.countryCode}/city/${subArea.city.slug}/sub-area/${subArea.slug}`,
      lastModified: subArea.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    // صفحات الفئات (مع كل دولة)
    const categoryPages: MetadataRoute.Sitemap = []
    for (const country of countries) {
      for (const category of categories) {
        categoryPages.push({
          url: `${baseUrl}/country/${country.code}/category/${category.slug}`,
          lastModified: category.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      }
    }

    // صفحات الفئات الفرعية
    const subCategoryPages: MetadataRoute.Sitemap = []
    for (const country of countries) {
      for (const subCategory of subCategories) {
        subCategoryPages.push({
          url: `${baseUrl}/country/${country.code}/category/${subCategory.category.slug}/sub-category/${subCategory.slug}`,
          lastModified: subCategory.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      }
    }

    // صفحات الشركات
    const companyPages: MetadataRoute.Sitemap = companies.map((company) => ({
      url: `${baseUrl}/${company.slug}`,
      lastModified: company.updatedAt,
      changeFrequency: 'daily',
      priority: 0.9,
    }))

    // صفحات التصنيف
    const rankingPagesMap: MetadataRoute.Sitemap = rankingPages.map((page) => ({
      url: `${baseUrl}/ranking/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: 'daily',
      priority: 0.9,
    }))

    // دمج جميع الصفحات
    return [
      ...staticPages,
      ...countryPages,
      ...cityPages,
      ...subAreaPages,
      ...categoryPages,
      ...subCategoryPages,
      ...companyPages,
      ...rankingPagesMap,
    ]
  } catch (error) {
    console.error('خطأ في توليد sitemap:', error)
    // في حالة الخطأ، نعيد الصفحات الثابتة فقط
    return staticPages
  }
}

