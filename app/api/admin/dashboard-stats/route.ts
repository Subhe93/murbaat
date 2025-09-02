import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: { message: 'غير مصرح' } },
        { status: 401 }
      )
    }

    // جلب الإحصائيات الحقيقية
    const [
      pendingReviews,
      totalCompanies,
      totalUsers,
      pendingRequests,
      reportedReviews,
      notifications
    ] = await Promise.all([
      // المراجعات المعلقة
      prisma.review.count({
        where: { isApproved: false }
      }),
      
      // إجمالي الشركات
      prisma.company.count({
        where: { isActive: true }
      }),
      
      // إجمالي المستخدمين
      prisma.user.count(),
      
      // طلبات الانضمام المعلقة
      prisma.companyRequest.count({
        where: { status: 'PENDING' }
      }),
      
      // المراجعات المبلغ عنها (إذا كان لديك نظام بلاغات)
      // prisma.reportedReview.count({
      //   where: { status: 'PENDING' }
      // }),
      Promise.resolve(5), // قيمة افتراضية مؤقتة
      
      // الإشعارات (إذا كان لديك جدول إشعارات)
      // prisma.notification.count({
      //   where: { isRead: false, userId: session.user.id }
      // })
      Promise.resolve(7) // قيمة افتراضية مؤقتة
    ])

    const stats = {
      pendingReviews,
      totalCompanies,
      totalUsers,
      pendingRequests,
      reportedReviews,
      notifications
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('خطأ في جلب إحصائيات الداشبورد:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { message: 'حدث خطأ في الخادم' } 
      },
      { status: 500 }
    )
  }
}
