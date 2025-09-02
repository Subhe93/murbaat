import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/reviews - Get all reviews for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // 'pending', 'approved', 'all'
    const rating = searchParams.get('rating');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status === 'pending') {
      where.isApproved = false;
    } else if (status === 'approved') {
      where.isApproved = true;
    }

    if (rating && rating !== 'all') {
      where.rating = parseInt(rating);
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { comment: { contains: search, mode: 'insensitive' } },
        { userName: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
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
          },
          images: {
            select: {
              id: true,
              imageUrl: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.review.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: reviews,
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
    console.error('خطأ في جلب التقييمات للإدارة:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'حدث خطأ أثناء جلب التقييمات',
          code: 'FETCH_ADMIN_REVIEWS_ERROR'
        }
      },
      { status: 500 }
    );
  }
}