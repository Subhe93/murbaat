import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Schema للتحقق من البيانات
const companyRequestSchema = z.object({
  // المعلومات الأساسية
  companyName: z.string().min(2, 'اسم الشركة مطلوب'),
  description: z.string().min(10, 'وصف الشركة مطلوب'),
  categoryId: z.string().min(1, 'فئة الشركة مطلوبة'),
  countryId: z.string().min(1, 'البلد مطلوب'),
  cityId: z.string().min(1, 'المدينة مطلوبة'),
  address: z.string().optional(),
  
  // معلومات التواصل
  phone: z.string().min(1, 'رقم الهاتف مطلوب'),
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة'),
  website: z.string().url().optional().or(z.literal('')),
  
  // تفاصيل الشركة
  foundedYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  companySize: z.string().optional(),
  services: z.string().min(10, 'وصف الخدمات مطلوب'),
  
  // معلومات المسؤول
  ownerName: z.string().min(2, 'اسم المسؤول مطلوب'),
  ownerEmail: z.string().email('صيغة البريد الإلكتروني للمسؤول غير صحيحة'),
  ownerPhone: z.string().min(1, 'رقم هاتف المسؤول مطلوب'),
  
  // وسائل التواصل الاجتماعي (اختيارية)
  socialMediaLinks: z.object({
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // التحقق من صحة البيانات
    const validatedData = companyRequestSchema.parse(body)
    
    // التحقق من وجود البلد والمدينة والفئة
    const [country, city, category] = await Promise.all([
      prisma.country.findUnique({ where: { id: validatedData.countryId } }),
      prisma.city.findUnique({ where: { id: validatedData.cityId } }),
      prisma.category.findUnique({ where: { id: validatedData.categoryId } })
    ])

    if (!country) {
      return NextResponse.json(
        { error: 'البلد المحدد غير موجود' },
        { status: 400 }
      )
    }

    if (!city) {
      return NextResponse.json(
        { error: 'المدينة المحددة غير موجودة' },
        { status: 400 }
      )
    }

    if (!category) {
      return NextResponse.json(
        { error: 'الفئة المحددة غير موجودة' },
        { status: 400 }
      )
    }
    
    // التحقق من عدم وجود طلب مماثل
    const existingRequest = await prisma.companyRequest.findFirst({
      where: {
        OR: [
          { companyName: validatedData.companyName },
          { ownerEmail: validatedData.ownerEmail },
          { email: validatedData.email }
        ],
        status: {
          in: ['PENDING', 'APPROVED']
        }
      }
    })
    
    if (existingRequest) {
      return NextResponse.json(
        { 
          error: 'يوجد طلب مماثل مسبقاً',
          details: 'يوجد طلب لنفس الشركة أو البريد الإلكتروني قيد المراجعة أو تم قبوله مسبقاً'
        },
        { status: 409 }
      )
    }
    
    // إنشاء طلب الشركة الجديد
    const companyRequest = await prisma.companyRequest.create({
      data: {
        companyName: validatedData.companyName,
        description: validatedData.description,
        category: category.name, // حفظ اسم الفئة
        country: country.name,   // حفظ اسم البلد
        city: city.name,         // حفظ اسم المدينة
        address: validatedData.address,
        phone: validatedData.phone,
        email: validatedData.email,
        website: validatedData.website || null,
        foundedYear: validatedData.foundedYear,
        companySize: validatedData.companySize,
        services: validatedData.services,
        ownerName: validatedData.ownerName,
        ownerEmail: validatedData.ownerEmail,
        ownerPhone: validatedData.ownerPhone,
        socialMedia: validatedData.socialMediaLinks || null,
        status: 'PENDING'
      }
    })
    
    return NextResponse.json(
      { 
        success: true,
        message: 'تم إرسال طلب إضافة الشركة بنجاح',
        requestId: companyRequest.id
      },
      { status: 201 }
    )
    
  } catch (error) {
    console.error('خطأ في إنشاء طلب الشركة:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'بيانات غير صحيحة',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم أثناء معالجة الطلب' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مطلوب للاستعلام' },
        { status: 400 }
      )
    }
    
    // البحث عن الطلبات بالبريد الإلكتروني
    const requests = await prisma.companyRequest.findMany({
      where: {
        OR: [
          { email: email },
          { ownerEmail: email }
        ]
      },
      select: {
        id: true,
        companyName: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        adminNotes: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ requests })
    
  } catch (error) {
    console.error('خطأ في جلب طلبات الشركة:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
