# دليل التشغيل السريع 🚀

## 📋 المتطلبات الأساسية

تأكد من وجود:
- Node.js (v18 أو أحدث)
- Yarn أو npm

## 🔧 خطوات الإعداد

### 1. تثبيت التبعيات
```bash
yarn install
# أو
npm install

# تثبيت تبعيات المصادقة وقاعدة البيانات
yarn add next-auth bcryptjs nodemailer @types/bcryptjs @types/nodemailer
```

### 2. إعداد متغيرات البيئة
```bash
# نسخ ملف البيئة المثال
cp env.example .env

# تعديل الملف حسب الحاجة
nano .env
```

**محتوى `.env` الأساسي:**
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
```

### 3. إعداد قاعدة البيانات
```bash
# إعداد شامل (إنشاء، دفع، ملء البيانات)
yarn db:setup

# أو خطوة بخطوة:
yarn db:generate  # إنشاء Prisma Client
yarn db:push      # تطبيق المخطط على قاعدة البيانات
yarn db:seed      # ملء البيانات التجريبية
```

### 4. تشغيل التطبيق
```bash
yarn dev
```

## 🔑 بيانات تسجيل الدخول

**مدير النظام:**
- البريد الإلكتروني: `admin@morabbat.com`
- كلمة المرور: `admin123`

## 🌐 الروابط المهمة

- **الصفحة الرئيسية:** http://localhost:3000
- **تسجيل الدخول:** http://localhost:3000/auth/signin
- **إنشاء حساب:** http://localhost:3000/auth/signup
- **لوحة تحكم المدير:** http://localhost:3000/admin
- **لوحة تحكم الشركة:** http://localhost:3000/company-dashboard

## 🛠️ أدوات التطوير

```bash
# عرض قاعدة البيانات في المتصفح
yarn db:studio

# إعادة تعيين قاعدة البيانات
yarn db:reset

# إنشاء Prisma Client جديد
yarn db:generate
```

## 🎯 اختبار النظام

1. **تسجيل الدخول كمدير:**
   - اذهب إلى `/auth/signin`
   - استخدم `admin@morabbat.com` / `admin123`
   - ستُوجه إلى `/admin`

2. **تصفح لوحة تحكم المدير:**
   - عرض الإحصائيات
   - إدارة الشركات
   - إدارة المراجعات
   - إدارة المستخدمين

3. **إنشاء حساب جديد:**
   - اذهب إلى `/auth/signup`
   - أنشئ حساب مستخدم عادي
   - سجل الدخول بالحساب الجديد

## ⚠️ ملاحظات مهمة

- تأكد من إنشاء ملف `.env` قبل التشغيل
- تأكد من تشغيل `yarn db:setup` قبل بدء التطوير
- استخدم `yarn db:studio` لاستكشاف قاعدة البيانات
- جميع كلمات المرور مشفرة باستخدام bcryptjs

## 🚨 حل المشاكل الشائعة

### مشكلة Prisma Client
```bash
yarn db:generate
```

### مشكلة قاعدة البيانات
```bash
yarn db:reset
```

### مشكلة NextAuth
تأكد من وجود `NEXTAUTH_SECRET` في `.env`

---

**النظام جاهز للاستخدام! 🎉**

