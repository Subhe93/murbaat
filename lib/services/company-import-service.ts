import { PrismaClient } from '@prisma/client'
import { ImageDownloadService } from './image-download-service'
import { DataValidationService } from './data-validation-service-simple'
import { CategoryMappingService } from './category-mapping-service-simple'
import { LocationMappingService } from './location-mapping-service-simple'

const prisma = new PrismaClient()

interface ImportSettings {
  downloadImages: boolean
  createMissingCategories: boolean
  createMissingCities: boolean
  skipDuplicates: boolean
  validateEmails: boolean
  validatePhones: boolean
  batchSize: number
}

interface ImportResult {
  success: boolean
  skipped?: boolean
  error?: string
  companyId?: string
  imagesDownloaded?: number
  imagesFailed?: number
}

export class CompanyImportService {
  private imageDownloader = new ImageDownloadService()
  private validator = new DataValidationService()
  private categoryMapper = new CategoryMappingService()
  private locationMapper = new LocationMappingService()

  async processCompanyRow(row: any, settings: ImportSettings, rowNumber: number): Promise<ImportResult> {
    try {
      // تنظيف وتحضير البيانات
      const cleanData = this.cleanRowData(row)
      
      // التحقق من البيانات الأساسية
      if (!cleanData.name || !cleanData.name.trim()) {
        return { success: false, error: 'اسم الشركة مطلوب' }
      }

      // التحقق من الشركات المكررة
      if (settings.skipDuplicates) {
        const existingCompany = await this.checkDuplicateCompany(cleanData.name, cleanData.phone, cleanData.email)
        if (existingCompany) {
          return { success: false, skipped: true, error: 'الشركة موجودة مسبقاً' }
        }
      }

      // التحقق من صحة البيانات
      const validationResult = await this.validateData(cleanData, settings)
      if (!validationResult.isValid) {
        return { success: false, error: validationResult.error }
      }

      // معالجة الفئة
      const category = await this.processCategory(cleanData.category, settings.createMissingCategories)
      if (!category) {
        return { success: false, error: 'فئة غير صالحة أو غير موجودة' }
      }

      // معالجة الموقع (البلد والمدينة)
      const location = await this.processLocation(cleanData.address, settings.createMissingCities)
      if (!location) {
        return { success: false, error: 'لا يمكن تحديد الموقع' }
      }

      // إنشاء الشركة
      const company = await this.createCompany({
        ...cleanData,
        categoryId: category.id,
        cityId: location.city.id,
        countryId: location.country.id
      })

      let imagesDownloaded = 0
      let imagesFailed = 0

      // معالجة الصور
      if (settings.downloadImages && cleanData.images.length > 0) {
        const imageResults = await this.processImages(company.id, cleanData.images)
        imagesDownloaded = imageResults.downloaded
        imagesFailed = imageResults.failed
      }

      // معالجة المراجعات
      if (cleanData.reviews.length > 0) {
        await this.processReviews(company.id, cleanData.reviews)
      }

      // معالجة العلامات
      if (cleanData.tags.length > 0) {
        await this.processTags(company.id, cleanData.tags)
      }

      return {
        success: true,
        companyId: company.id,
        imagesDownloaded,
        imagesFailed
      }

    } catch (error) {
      console.error(`خطأ في معالجة الصف ${rowNumber}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير متوقع'
      }
    }
  }

  private cleanRowData(row: any) {
    // استخراج التقييم من النص
    const extractRating = (noteText: string): { rating: number, reviewCount: number } => {
      if (!noteText) return { rating: 0, reviewCount: 0 }
      
      const ratingMatch = noteText.match(/(\d+\.?\d*)/);
      const countMatch = noteText.match(/\((\d+)\)/);
      
      return {
        rating: ratingMatch ? parseFloat(ratingMatch[1]) : 0,
        reviewCount: countMatch ? parseInt(countMatch[1]) : 0
      }
    }

    // استخراج الصور من النص
    const extractImages = (imagesText: string): string[] => {
      if (!imagesText) return []
      
      return imagesText
        .split(/[;,]/)
        .map(url => url.trim())
        .filter(url => url.startsWith('http'))
        .slice(0, 10) // حد أقصى 10 صور
    }

    // استخراج المراجعات من JSON
    const extractReviews = (reviewsText: string): any[] => {
      if (!reviewsText || reviewsText === '[]') return []
      
      try {
        const reviews = JSON.parse(reviewsText)
        if (Array.isArray(reviews)) {
          return reviews.map(review => ({
            author: review.author || 'مجهول',
            text: review.text || '',
            rating: parseInt(review.rating) || 5,
            date: review.date || new Date().toISOString()
          }))
        }
        return []
      } catch (error) {
        console.warn('فشل في تحليل المراجعات:', error)
        return []
      }
    }

    // استخراج الموقع الجغرافي من العنوان
    const extractLocation = (address: string): { lat?: number, lng?: number } => {
      if (!address) return {}
      
      // البحث عن إحداثيات في العنوان (مثل G76C+V7F)
      const coordMatch = address.match(/([A-Z]\d+[A-Z]\+[A-Z0-9]+)/)
      if (coordMatch) {
        // يمكن تحويل Plus Code إلى إحداثيات لاحقاً
        return {}
      }
      
      return {}
    }

    const ratingData = extractRating(row.Note)
    
    // استنتاج الوصف من الفئة إذا لم يكن متوفراً
    const generateDescription = (companyName: string, category: string): string => {
      const categoryDescriptions: { [key: string]: string } = {
        'software company': 'شركة متخصصة في تطوير البرمجيات والحلول التقنية',
        'website designer': 'شركة متخصصة في تصميم وتطوير المواقع الإلكترونية',
        'corporate office': 'مكتب شركة يقدم خدمات تجارية ومهنية',
        'it company': 'شركة تقنية معلومات تقدم حلول تكنولوجية متطورة',
        'restaurant': 'مطعم يقدم أشهى الأطباق والوجبات',
        'cafe': 'مقهى يقدم المشروبات الساخنة والباردة',
        'hospital': 'مستشفى يقدم خدمات الرعاية الصحية الشاملة',
        'clinic': 'عيادة طبية متخصصة',
        'pharmacy': 'صيدلية تقدم الأدوية والمستلزمات الطبية'
      }
      
      const categoryKey = category.toLowerCase().trim()
      const baseDescription = categoryDescriptions[categoryKey] || `شركة ${companyName} متخصصة في ${category}`
      
      return `${companyName} - ${baseDescription}`
    }

    // استنتاج الخدمات من الفئة
    const generateServices = (category: string): string[] => {
      const categoryServices: { [key: string]: string[] } = {
        'software company': ['تطوير البرمجيات', 'تطبيقات الويب', 'تطبيقات الهاتف', 'استشارات تقنية'],
        'website designer': ['تصميم المواقع', 'تطوير المواقع', 'تحسين محركات البحث', 'استضافة المواقع'],
        'restaurant': ['تناول في المطعم', 'خدمة التوصيل', 'المناسبات والحفلات', 'طعام طازج'],
        'hospital': ['طب عام', 'طوارئ 24/7', 'فحوصات طبية', 'عمليات جراحية'],
        'clinic': ['فحوصات طبية', 'استشارات طبية', 'علاج متخصص']
      }
      
      return categoryServices[category.toLowerCase().trim()] || []
    }

    const companyName = row.Nom?.trim() || ''
    const category = row.Catégorie?.trim() || ''
    
    // تنظيف وتحويل رقم الهاتف
    const formatPhoneNumber = (phone: string): string => {
      if (!phone) return ''
      
      // إزالة جميع الرموز غير الرقمية ما عدا +
      let cleanPhone = phone.replace(/[^\d+]/g, '')
      
      // إزالة المسافات والرموز الخاصة
      cleanPhone = cleanPhone.replace(/[\s\-\(\)\.\[\]]/g, '')
      
      // التعامل مع الأرقام السورية
      if (cleanPhone.startsWith('00963')) {
        // تحويل 00963 إلى +963
        cleanPhone = '+963' + cleanPhone.substring(5)
      } else if (cleanPhone.startsWith('0963')) {
        // تحويل 0963 إلى +963
        cleanPhone = '+963' + cleanPhone.substring(4)
      } else if (cleanPhone.startsWith('963')) {
        // إضافة + في البداية
        cleanPhone = '+' + cleanPhone
      } else if (cleanPhone.startsWith('09') && cleanPhone.length === 10) {
        // رقم محلي سوري يبدأ بـ 09
        cleanPhone = '+963' + cleanPhone.substring(1)
      } else if (cleanPhone.startsWith('9') && cleanPhone.length === 9) {
        // رقم محلي سوري بدون الصفر
        cleanPhone = '+963' + cleanPhone
      } else if (!cleanPhone.startsWith('+') && cleanPhone.length >= 7) {
        // تحديد البلد بناءً على طول الرقم وبدايته
        if (cleanPhone.startsWith('07') && cleanPhone.length === 10) {
          // أرقام أردنية
          cleanPhone = '+962' + cleanPhone.substring(1)
        } else if (cleanPhone.startsWith('05') && cleanPhone.length === 10) {
          // أرقام سعودية
          cleanPhone = '+966' + cleanPhone.substring(1)
        } else if ((cleanPhone.startsWith('50') || cleanPhone.startsWith('52') || cleanPhone.startsWith('54') || cleanPhone.startsWith('55') || cleanPhone.startsWith('56')) && cleanPhone.length === 9) {
          // أرقام إماراتية
          cleanPhone = '+971' + cleanPhone
        } else {
          // افتراضي: أرقام سورية
          if (cleanPhone.length === 7 || cleanPhone.length === 8) {
            cleanPhone = '+96311' + cleanPhone // دمشق
          } else if (cleanPhone.length === 9) {
            cleanPhone = '+963' + cleanPhone
          } else if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
            cleanPhone = '+963' + cleanPhone.substring(1)
          }
        }
      }
      
      // التحقق من صحة الرقم النهائي
      if (cleanPhone.length < 10 || !cleanPhone.startsWith('+')) {
        console.log(`فشل في تحويل رقم الهاتف: "${phone}" -> "${cleanPhone}"`)
        return phone // إرجاع الرقم الأصلي إذا فشل التحويل
      }
      
      if (phone !== cleanPhone) {
        console.log(`تم تحويل رقم الهاتف: "${phone}" -> "${cleanPhone}"`)
      }
      
      return cleanPhone
    }
    
    return {
      name: companyName,
      category: category,
      address: row.Adresse?.trim() || '',
      phone: formatPhoneNumber(row.Téléphone?.trim() || ''),
      website: row.SiteWeb?.trim() || '',
      description: generateDescription(companyName, category),
      rating: ratingData.rating,
      reviewCount: ratingData.reviewCount,
      images: extractImages(row.Images || row.Photos || ''),
      heroImage: row.HeroImage?.trim() || '',
      reviews: extractReviews(row.Reviews || '[]'),
      tags: [], // سيتم إضافتها لاحقاً
      location: extractLocation(row.Adresse || ''),
      email: '', // غير متوفر في البيانات الحالية
      services: generateServices(category),
      specialties: [] // يمكن إضافتها لاحقاً
    }
  }

  private async checkDuplicateCompany(name: string, phone?: string, email?: string): Promise<boolean> {
    const whereConditions: any[] = [
      { name: { equals: name, mode: 'insensitive' } }
    ]

    if (phone) {
      whereConditions.push({ phone })
    }

    if (email) {
      whereConditions.push({ email })
    }

    const existingCompany = await prisma.company.findFirst({
      where: {
        OR: whereConditions
      }
    })

    return !!existingCompany
  }

  private async validateData(data: any, settings: ImportSettings) {
    return this.validator.validateCompanyData(data, settings)
  }

  private async processCategory(categoryName: string, createMissing: boolean) {
    return this.categoryMapper.mapCategory(categoryName, createMissing)
  }

  private async processLocation(address: string, createMissing: boolean) {
    return this.locationMapper.mapLocation(address, createMissing)
  }

  private async createCompany(data: any) {
    // إنشاء slug فريد بالإنجليزية فقط (نفس منطق صفحة إضافة الشركة)
    const generateSlugFromName = (name: string) => {
      const arabicToEnglish: { [key: string]: string } = {
        'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa',
        'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
        'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
        'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
        'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
        'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
        'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
        'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a',
        'ة': 'h', 'ء': 'a', 'ئ': 'e', 'ؤ': 'o'
      };
      
      let result = name.toLowerCase().trim();
      
      // تحويل "ال" التعريف
      result = result.replace(/ال/g, 'al-');
      
        // تحويل الأحرف العربية
        Object.entries(arabicToEnglish).forEach(([arabic, english]) => {
          const regex = new RegExp(arabic, 'g');
          result = result.replace(regex, english);
        });
      
      return result
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]/g, '')
        .replace(/\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '') || 'company';
    };

    const baseSlug = generateSlugFromName(data.name);
    let slug = baseSlug
    let counter = 1

    while (await prisma.company.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    return prisma.company.create({
      data: {
        name: data.name,
        slug,
        description: data.description || `شركة ${data.name} متخصصة في ${data.category}`,
        shortDescription: data.description ? data.description.substring(0, 150) : undefined,
        categoryId: data.categoryId,
        cityId: data.cityId,
        countryId: data.countryId,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        address: data.address || null,
        rating: data.rating || 0,
        reviewsCount: data.reviewCount || 0,
        latitude: data.location.lat || null,
        longitude: data.location.lng || null,
        mainImage: data.heroImage || (data.images.length > 0 ? data.images[0] : null),
        services: data.services,
        specialties: data.specialties,
        isActive: true,
        isVerified: false,
        isFeatured: false
      }
    })
  }

  private async processImages(companyId: string, imageUrls: string[]) {
    let downloaded = 0
    let failed = 0

    for (const [index, url] of imageUrls.entries()) {
      try {
        const result = await this.imageDownloader.downloadAndSaveImage(url, companyId, index)
        if (result.success) {
          await prisma.companyImage.create({
            data: {
              companyId,
              imageUrl: result.localPath!,
              sortOrder: index,
              altText: `صورة الشركة ${index + 1}`
            }
          })
          downloaded++
        } else {
          failed++
        }
      } catch (error) {
        console.error(`فشل في تحميل الصورة ${url}:`, error)
        failed++
      }
    }

    return { downloaded, failed }
  }

  private async processReviews(companyId: string, reviews: any[]) {
    for (const review of reviews.slice(0, 10)) { // حد أقصى 10 مراجعات
      try {
        // تحويل التاريخ من النص إلى تاريخ صحيح
        let reviewDate = new Date()
        if (review.date) {
          // معالجة تواريخ مختلفة مثل "2 years ago", "8 years ago"
          const dateText = review.date.toLowerCase()
          if (dateText.includes('year')) {
            const years = parseInt(dateText.match(/\d+/)?.[0] || '0')
            reviewDate = new Date()
            reviewDate.setFullYear(reviewDate.getFullYear() - years)
          } else if (dateText.includes('month')) {
            const months = parseInt(dateText.match(/\d+/)?.[0] || '0')
            reviewDate = new Date()
            reviewDate.setMonth(reviewDate.getMonth() - months)
          } else if (dateText.includes('day')) {
            const days = parseInt(dateText.match(/\d+/)?.[0] || '0')
            reviewDate = new Date()
            reviewDate.setDate(reviewDate.getDate() - days)
          } else {
            // محاولة تحويل التاريخ مباشرة
            const parsedDate = new Date(review.date)
            if (!isNaN(parsedDate.getTime())) {
              reviewDate = parsedDate
            }
          }
        }

        // التأكد من صحة التقييم
        let rating = 5
        if (review.rating && typeof review.rating === 'number' && review.rating >= 1 && review.rating <= 5) {
          rating = Math.round(review.rating)
        }

        // إنشاء عنوان من النص إذا لم يكن موجوداً
        const title = review.title || (review.text ? review.text.substring(0, 50) + '...' : 'مراجعة عامة')

        await prisma.review.create({
          data: {
            companyId,
            userName: review.author || 'مجهول',
            rating,
            title,
            comment: review.text || '',
            isApproved: true,
            isVerified: false,
            createdAt: reviewDate
          }
        })
      } catch (error) {
        console.error('فشل في إضافة المراجعة:', error)
      }
    }

    // تحديث متوسط التقييم وعدد المراجعات للشركة
    const reviewsStats = await prisma.review.aggregate({
      where: { companyId },
      _avg: { rating: true },
      _count: { id: true }
    })

    await prisma.company.update({
      where: { id: companyId },
      data: {
        rating: reviewsStats._avg.rating || 0,
        reviewsCount: reviewsStats._count.id || 0
      }
    })
  }

  private async processTags(companyId: string, tags: string[]) {
    for (const tag of tags.slice(0, 10)) { // حد أقصى 10 علامات
      try {
        await prisma.companyTag.create({
          data: {
            companyId,
            tagName: tag.trim()
          }
        })
      } catch (error) {
        console.error('فشل في إضافة العلامة:', error)
      }
    }
  }
}
