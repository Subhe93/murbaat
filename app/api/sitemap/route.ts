import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://morabaat.com'
  
  try {
    // جلب البيانات للـ sitemap
    const [countries, categories, companies] = await Promise.all([
      prisma.country.findMany({
        where: { isActive: true },
        select: { code: true, updatedAt: true },
        take: 50, // محدود للأداء
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
        take: 100,
      }),
      prisma.company.findMany({
        where: { isActive: true },
        select: { 
          slug: true, 
          updatedAt: true,
          city: {
            select: {
              slug: true,
              country: {
                select: { code: true }
              }
            }
          }
        },
        take: 1000, // محدود للأداء
        orderBy: { updatedAt: 'desc' },
      }),
    ])

    // إنشاء XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  
  <!-- الصفحة الرئيسية -->
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- صفحات البحث -->
  <url>
    <loc>${baseUrl}/search</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- صفحات البلدان -->
  ${countries.map(country => `
  <url>
    <loc>${baseUrl}/${country.code}</loc>
    <lastmod>${country.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join('')}
  
  <!-- صفحات الفئات -->
  ${categories.map(category => `
  <url>
    <loc>${baseUrl}/category/${category.slug}</loc>
    <lastmod>${category.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  
  <!-- صفحات الشركات -->
  ${companies.map(company => `
  <url>
    <loc>${baseUrl}/${company.city.country.code}/city/${company.city.slug}/company/${company.slug}</loc>
    <lastmod>${company.updatedAt.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
  
  <!-- صفحات ثابتة -->
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  
</urlset>`

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400', // 24 hours
      },
    })

  } catch (error) {
    console.error('خطأ في إنشاء sitemap:', error)
    
    // sitemap أساسي في حالة الخطأ
    const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`

    return new NextResponse(basicSitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // 1 hour
      },
    })
  }
}
