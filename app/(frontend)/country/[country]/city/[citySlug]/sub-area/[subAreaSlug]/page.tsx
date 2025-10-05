import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSubAreaBySlug } from '@/lib/database/queries'
import { SubAreaHero } from '@/components/sub-area/sub-area-hero'
import { SubAreaStats } from '@/components/sub-area/sub-area-stats'
import { SubAreaCompanies } from '@/components/sub-area/sub-area-companies'
import { SubAreaMap } from '@/components/sub-area/sub-area-map'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Home, MapPin, Building2 } from 'lucide-react'
import Link from 'next/link'

interface SubAreaPageProps {
  params: {
    country: string
    citySlug: string
    subAreaSlug: string
  }
}

export async function generateMetadata({ params }: SubAreaPageProps): Promise<Metadata> {
  const { country, citySlug, subAreaSlug } = params
  
  try {
    const subArea = await getSubAreaBySlug(subAreaSlug)
    
    if (!subArea) {
      return {
        title: 'المنطقة الفرعية غير موجودة',
        description: 'المنطقة الفرعية المطلوبة غير موجودة'
      }
    }

    const title = `الشركات في ${subArea.name} - ${subArea.city.name}`
    const description = subArea.description || `اكتشف أفضل الشركات في ${subArea.name}، ${subArea.city.name}. تصفح الشركات الموثقة والمقيمة في المنطقة.`
    
    return {
      title,
      description,
      keywords: [
        subArea.name,
        subArea.city.name,
        subArea.country.name,
        'شركات',
        'دليل الشركات',
        'المنطقة الفرعية'
      ].join(', '),
      openGraph: {
        title,
        description,
        type: 'website',
        locale: 'ar',
        images: subArea.image ? [
          {
            url: subArea.image,
            width: 1200,
            height: 630,
            alt: subArea.name
          }
        ] : undefined
      }
    }
  } catch (error) {
    console.error('خطأ في توليد metadata:', error)
    return {
      title: 'المنطقة الفرعية',
      description: 'صفحة المنطقة الفرعية'
    }
  }
}

export default async function SubAreaPage({ params }: SubAreaPageProps) {
  const { country, citySlug, subAreaSlug } = params
  
  try {
    const subArea = await getSubAreaBySlug(subAreaSlug)
    
    if (!subArea) {
      notFound()
    }

    // التحقق من أن المنطقة الفرعية تنتمي للمدينة والبلد المحددين
    if (subArea.city.slug !== citySlug || subArea.country.code !== country) {
      notFound()
    }

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "الرئيسية",
          "item": "/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": subArea.country.name,
          "item": `/${country}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": subArea.city.name,
          "item": `/${country}/city/${citySlug}`
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": subArea.name,
          "item": `/${country}/city/${citySlug}/sub-area/${subAreaSlug}`
        }
      ]
    }

    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        {/* Schema.org Breadcrumb */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />

        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="flex items-center gap-1">
                    <Home className="h-4 w-4" />
                    الرئيسية
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/country/${country}`}>
                    {subArea.country.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/country/${country}/city/${citySlug}`}>
                    {subArea.city.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {subArea.name}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Hero Section */}
        <SubAreaHero subArea={subArea} />

        {/* Stats Section */}
       {/* <SubAreaStats subArea={subArea} /> */}

        {/* Companies Section */}
        <SubAreaCompanies 
          subArea={subArea}
          companies={subArea.companies}
        />

        {/* Map Section */}
        {/* <SubAreaMap subArea={subArea} /> */}
      </div>
    )
  } catch (error) {
    console.error('خطأ في تحميل صفحة المنطقة الفرعية:', error)
    notFound()
  }
}