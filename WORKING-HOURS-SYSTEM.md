# نظام ساعات العمل الموحد

## نظرة عامة
تم توحيد نظام ساعات العمل في جميع أنحاء التطبيق لضمان التناسق والموثوقية.

## الملفات الرئيسية

### `lib/types/working-hours.ts`
يحتوي على:
- **الأنواع (Types):** `WorkingHour`, `WorkingHoursFormatted`
- **الثوابت (Constants):** `DAYS_OF_WEEK`, `DAYS_OF_WEEK_ARABIC`, `ALL_DAYS_OF_WEEK`
- **الدوال المساعدة (Helper Functions):** `ensureCompleteWorkingHours`, `formatWorkingHoursForDisplay`, `getCurrentDayStatus`

### `components/working-hours.tsx`
مكون موحد لعرض ساعات العمل في صفحة الشركة.

### `app/(frontend)/company-dashboard/working-hours/page.tsx`
صفحة إدارة ساعات العمل في داشبورد الشركة.

### `app/api/company/working-hours/route.ts`
API موحد لساعات العمل.

## هيكل البيانات

### WorkingHour Interface
```typescript
interface WorkingHour {
  id?: string | null
  dayOfWeek: string
  openTime: string | null
  closeTime: string | null
  isClosed: boolean
  companyId?: string
}
```

### WorkingHoursFormatted Interface
```typescript
interface WorkingHoursFormatted {
  [key: string]: {
    open: string
    close: string
    closed: boolean
  }
}
```

## الدوال المساعدة

### `ensureCompleteWorkingHours(workingHours, companyId?)`
تضمن وجود جميع الأيام السبعة في المصفوفة.

### `formatWorkingHoursForDisplay(workingHours)`
تحول البيانات إلى الشكل المطلوب للعرض.

### `getCurrentDayStatus(workingHours)`
تحسب حالة الشركة الحالية (مفتوح/مغلق).

## الاستخدام

### في داشبورد الشركة
```typescript
import { WorkingHour, ensureCompleteWorkingHours, getCurrentDayStatus } from '@/lib/types/working-hours'

const [workingHours, setWorkingHours] = useState<WorkingHour[]>([])
const status = getCurrentDayStatus(workingHours)
```

### في صفحة الشركة
```typescript
import { formatWorkingHoursForDisplay } from '@/lib/types/working-hours'

const workingHoursFormatted = formatWorkingHoursForDisplay(company.workingHours)
```

### في مكون WorkingHours
```typescript
import { WorkingHoursFormatted } from '@/lib/types/working-hours'

interface WorkingHoursProps {
  hours: WorkingHoursFormatted
}
```

## المزايا

1. **التناسق:** نفس هيكل البيانات في جميع أنحاء التطبيق
2. **الموثوقية:** ضمان وجود جميع الأيام السبعة
3. **سهولة الصيانة:** مركزية المنطق في ملف واحد
4. **Type Safety:** استخدام TypeScript للتحقق من الأنواع
5. **إعادة الاستخدام:** دوال مساعدة قابلة لإعادة الاستخدام

## الأيام المدعومة

- **الإنجليزية:** Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
- **العربية:** الأحد, الاثنين, الثلاثاء, الأربعاء, الخميس, الجمعة, السبت

## القيم الافتراضية

- **الأيام العادية:** 09:00 - 17:00
- **يوم الجمعة:** مغلق افتراضياً
- **الأيام المفقودة:** يتم إنشاؤها تلقائياً
