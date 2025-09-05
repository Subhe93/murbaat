export const dynamic = "force-dynamic";
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { ServicesCategories } from '@/components/services-categories';

export const metadata: Metadata = {
  title: 'جميع الخدمات | مربعات',
  description: 'اكتشف جميع الخدمات والمهن المتاحة في مربعات',
};

async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        icon: true,
        description: true,
        _count: {
          select: {
            companies: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return categories.map(cat => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      icon: cat.icon,
      description: cat.description,
      companiesCount: cat._count.companies
    }));
  } catch (error) {
    console.error('خطأ في جلب الفئات:', error);
    return [];
  }
}

export default async function ServicesPage() {
  const categories = await getCategories();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          جميع الخدمات والمهن
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          اكتشف جميع الخدمات والمهن المتاحة في منطقتك
        </p>
      </div>
      
      <ServicesCategories categories={categories} />
    </div>
  );
}