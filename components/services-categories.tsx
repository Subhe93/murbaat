import Link from 'next/link';
import { 
  Laptop, 
  Heart, 
  GraduationCap, 
  Banknote, 
  Utensils, 
  ShoppingBag,
  Car,
  Home,
  Briefcase,
  Scissors,
  Wrench,
  Camera
} from 'lucide-react';

interface ServiceCategory {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  description: string | null;
  companiesCount: number;
}

interface ServiceCategoriesProps {
  categories: ServiceCategory[];
}

// خريطة الأيقونات
const iconMap: { [key: string]: any } = {
  'laptop': Laptop,
  'heart': Heart,
  'graduation-cap': GraduationCap,
  'banknote': Banknote,
  'utensils': Utensils,
  'shopping-bag': ShoppingBag,
  'car': Car,
  'home': Home,
  'briefcase': Briefcase,
  'scissors': Scissors,
  'wrench': Wrench,
  'camera': Camera,
};

// ألوان افتراضية للفئات
const colorOptions = [
  'bg-blue-500',
  'bg-red-500', 
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-emerald-500',
  'bg-rose-500',
];

const fallbackCategories: ServiceCategory[] = [
  {
    slug: 'technology',
    name: 'التكنولوجيا',
    icon: Laptop,
    description: 'تطوير المواقع والتطبيقات',
    color: 'bg-blue-500',
    count: 120,
  },
  {
    slug: 'healthcare',
    name: 'الرعاية الصحية',
    icon: Heart,
    description: 'المستشفيات والعيادات',
    color: 'bg-red-500',
    count: 85,
  },
  {
    slug: 'education',
    name: 'التعليم',
    icon: GraduationCap,
    description: 'المدارس ومراكز التدريب',
    color: 'bg-green-500',
    count: 95,
  },
  {
    slug: 'finance',
    name: 'المالية',
    icon: Banknote,
    description: 'البنوك والاستثمار',
    color: 'bg-yellow-500',
    count: 65,
  },
  {
    slug: 'food',
    name: 'الأغذية',
    icon: Utensils,
    description: 'المطاعم والكافيهات',
    color: 'bg-orange-500',
    count: 150,
  },
  {
    slug: 'retail',
    name: 'التجارة',
    icon: ShoppingBag,
    description: 'المتاجر والتسوق',
    color: 'bg-purple-500',
    count: 110,
  },
  {
    slug: 'automotive',
    name: 'السيارات',
    icon: Car,
    description: 'صيانة وبيع السيارات',
    color: 'bg-gray-600',
    count: 75,
  },
  {
    slug: 'real-estate',
    name: 'العقارات',
    icon: Home,
    description: 'بيع وإيجار العقارات',
    color: 'bg-indigo-500',
    count: 90,
  },
  {
    slug: 'business',
    name: 'الأعمال',
    icon: Briefcase,
    description: 'الاستشارات والخدمات',
    color: 'bg-teal-500',
    count: 80,
  },
  {
    slug: 'beauty',
    name: 'التجميل',
    icon: Scissors,
    description: 'صالونات ومراكز التجميل',
    color: 'bg-pink-500',
    count: 60,
  },
  {
    slug: 'maintenance',
    name: 'الصيانة',
    icon: Wrench,
    description: 'خدمات الصيانة والإصلاح',
    color: 'bg-amber-600',
    count: 70,
  },
  {
    slug: 'photography',
    name: 'التصوير',
    icon: Camera,
    description: 'استوديوهات التصوير',
    color: 'bg-violet-500',
    count: 45,
  },
];

export function ServicesCategories({ categories }: ServiceCategoriesProps) {
  // استخدام البيانات المرسلة أو البيانات الافتراضية
  const displayCategories = categories.length > 0 ? categories.map((cat, index) => ({
    ...cat,
    IconComponent: iconMap[cat.icon || 'briefcase'] || Briefcase,
    color: colorOptions[index % colorOptions.length],
  })) : fallbackCategories.slice(0, 8).map((cat, index) => ({
    ...cat,
    IconComponent: cat.icon,
    color: cat.color,
  }));
  return (
    <section className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          المهن والخدمات
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          اكتشف جميع الخدمات والمهن المتاحة في منطقتك
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {displayCategories.map((category) => {
          const IconComponent = category.IconComponent;
          return (
            <Link
              key={category.slug}
              href={`/country/sy/category/${category.slug}`}
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:rotate-1 p-6 text-center animate-fade-in-up"
              style={{ animationDelay: `${displayCategories.indexOf(category) * 100}ms` }}
            >
              <div className={`w-16 h-16 ${category.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg group-hover:shadow-xl`}>
                <IconComponent className="h-8 w-8 text-white transform group-hover:scale-110 transition-transform duration-300" />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-brand-green dark:group-hover:text-brand-green transition-all duration-300 transform group-hover:translate-y-1">
                {category.name}
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                {category.description}
              </p>
              
              <div className="text-xs text-gray-500 dark:text-gray-500 transform group-hover:scale-110 transition-transform duration-300">
                {category.count} خدمة
              </div>
            </Link>
          );
        })}
      </div>


    </section>
  );
}