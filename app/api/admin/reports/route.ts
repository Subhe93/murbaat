import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/reports - Get all review reports for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // 'pending', 'approved', 'rejected', 'all'

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    const [reports, total] = await Promise.all([
      prisma.reviewReport.findMany({
        where,
        include: {
          review: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              },
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.reviewReport.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: reports,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('خطأ في جلب البلاغات للإدارة:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'حدث خطأ أثناء جلب البلاغات',
          code: 'FETCH_ADMIN_REPORTS_ERROR'
        }
      },
      { status: 500 }
    );
  }
}
