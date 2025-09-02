import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'

const resetPasswordSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صحيح')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = resetPasswordSchema.parse(body)

    // البحث عن المستخدم
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'لم يتم العثور على حساب بهذا البريد الإلكتروني' 
      }, { status: 404 })
    }

    // إنشاء كلمة مرور مؤقتة جديدة
    const tempPassword = Math.random().toString(36).slice(-8)
    
    // تحديث المستخدم
    await prisma.user.update({
      where: { id: user.id },
      data: { tempPassword }
    })

    // إرسال كلمة المرور المؤقتة (مؤقتاً في console)
    console.log('كلمة المرور المؤقتة الجديدة:', {
      email: user.email,
      name: user.name,
      tempPassword,
      resetAt: new Date().toISOString()
    })

    // هنا يمكن إضافة خدمة البريد الإلكتروني لإرسال كلمة المرور
    // await sendPasswordResetEmail(user.email, user.name, tempPassword)

    return NextResponse.json({
      success: true,
      message: 'تم إرسال كلمة المرور المؤقتة إلى بريدك الإلكتروني',
      // في البيئة التطويرية، نرسل كلمة المرور في الاستجابة
      ...(process.env.NODE_ENV === 'development' && { tempPassword })
    })

  } catch (error) {
    console.error('خطأ في إعادة تعيين كلمة المرور:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
