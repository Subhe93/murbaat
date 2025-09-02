import { Metadata } from 'next';
import { ServicesCategories } from '@/components/services-categories';

export const metadata: Metadata = {
  title: 'جميع الخدمات | مربعات',
  description: 'اكتشف جميع الخدمات والمهن المتاحة في مربعات',
};

export default function ServicesPage() {
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
      
      <ServicesCategories />
    </div>
  );
}