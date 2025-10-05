import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSubAreaSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET - جلب منطقة فرعية محددة
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول' }, { status: 401 });
    }
    const subArea = await prisma.subArea.findUnique({
      where: { id: params.id },
      include: {
        city: true,
        country: true,
        _count: {
          select: {
            companies: true,
          },
        },
      },
    });

    if (!subArea) {
      return NextResponse.json(
        { error: 'المنطقة الفرعية غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json(subArea);
  } catch (error) {
    console.error('خطأ في جلب المنطقة الفرعية:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب المنطقة الفرعية' },
      { status: 500 }
    );
  }
}

// PUT - تحديث منطقة فرعية
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول' }, { status: 401 });
    }
    const body = await request.json();
    const validatedData = updateSubAreaSchema.parse(body);

    // التحقق من وجود المنطقة الفرعية
    const existingSubArea = await prisma.subArea.findUnique({
      where: { id: params.id },
    });

    if (!existingSubArea) {
      return NextResponse.json(
        { error: 'المنطقة الفرعية غير موجودة' },
        { status: 404 }
      );
    }

    // التحقق من عدم وجود اسم مكرر إذا تم تغيير الاسم
    if (validatedData.name && validatedData.name !== existingSubArea.name) {
      const duplicateName = await prisma.subArea.findFirst({
        where: {
          name: validatedData.name,
          cityId: existingSubArea.cityId,
          id: { not: params.id },
          isActive: true,
        },
      });

      if (duplicateName) {
        return NextResponse.json(
          { error: 'يوجد منطقة فرعية بنفس الاسم في هذه المدينة' },
          { status: 400 }
        );
      }
    }

    // التحقق من عدم وجود slug مكرر إذا تم تغيير الـ slug
    if (validatedData.slug && validatedData.slug !== existingSubArea.slug) {
      const duplicateSlug = await prisma.subArea.findUnique({
        where: { slug: validatedData.slug },
      });

      if (duplicateSlug) {
        return NextResponse.json(
          { error: 'معرف المنطقة الفرعية مستخدم بالفعل' },
          { status: 400 }
        );
      }
    }

    const updatedSubArea = await prisma.subArea.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        city: true,
        country: true,
        _count: {
          select: {
            companies: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSubArea);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }

    console.error('خطأ في تحديث المنطقة الفرعية:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث المنطقة الفرعية' },
      { status: 500 }
    );
  }
}

// DELETE - حذف منطقة فرعية (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول' }, { status: 401 });
    }
    // التحقق من وجود المنطقة الفرعية
    const existingSubArea = await prisma.subArea.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            companies: true,
          },
        },
      },
    });

    if (!existingSubArea) {
      return NextResponse.json(
        { error: 'المنطقة الفرعية غير موجودة' },
        { status: 404 }
      );
    }

    // التحقق من وجود شركات مرتبطة بالمنطقة الفرعية
    if (existingSubArea._count.companies > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف المنطقة الفرعية لوجود شركات مرتبطة بها' },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.subArea.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'تم حذف المنطقة الفرعية بنجاح' });
  } catch (error) {
    console.error('خطأ في حذف المنطقة الفرعية:', error);
    return NextResponse.json(
      { error: 'خطأ في حذف المنطقة الفرعية' },
      { status: 500 }
    );
  }
}
