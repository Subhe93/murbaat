import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import Papa from 'papaparse'

const prisma = new PrismaClient()

interface Replacement {
  old: string
  new: string
}

// قراءة ملف CSV
function readReplacementsFromCSV(): Replacement[] {
  const csvPath = path.join(process.cwd(), 'docs', 'Sheet4.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  
  const result = Papa.parse<{ old: string; new: string }>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  })
  
  // ترتيب الاستبدالات حسب طول الكلمة القديمة (الأطول أولاً)
  // لتجنب استبدال جزئي خاطئ
  const replacements = result.data
    .filter(row => row.old && row.new)
    .map(row => ({
      old: row.old.trim(),
      new: row.new.trim()
    }))
    .sort((a, b) => b.old.length - a.old.length)
  
  return replacements
}

// استبدال الكلمات في الـ slug
function replaceInSlug(slug: string, replacements: Replacement[]): string {
  let newSlug = slug
  
  for (const replacement of replacements) {
    // البحث عن الكلمة كجزء من الـ slug
    // يمكن أن تكون في البداية أو النهاية أو بين شرطتين
    const patterns = [
      new RegExp(`^${replacement.old}-`, 'g'),      // في البداية: kafyh-xxx
      new RegExp(`-${replacement.old}$`, 'g'),      // في النهاية: xxx-kafyh
      new RegExp(`-${replacement.old}-`, 'g'),      // في الوسط: xxx-kafyh-xxx
      new RegExp(`^${replacement.old}$`, 'g'),      // الكلمة بالكامل: kafyh
    ]
    
    const replacementValues = [
      `${replacement.new}-`,      // في البداية
      `-${replacement.new}`,      // في النهاية
      `-${replacement.new}-`,     // في الوسط
      `${replacement.new}`,       // الكلمة بالكامل
    ]
    
    for (let i = 0; i < patterns.length; i++) {
      newSlug = newSlug.replace(patterns[i], replacementValues[i])
    }
  }
  
  return newSlug
}

// التحقق من وجود slug مكرر وإنشاء slug فريد
async function getUniqueSlug(newSlug: string, currentId: string): Promise<string> {
  let uniqueSlug = newSlug
  let counter = 1
  
  while (true) {
    const existing = await prisma.company.findFirst({
      where: {
        slug: uniqueSlug,
        id: { not: currentId }
      }
    })
    
    if (!existing) {
      return uniqueSlug
    }
    
    // إضافة رقم للـ slug
    uniqueSlug = `${newSlug}-${counter}`
    counter++
  }
}

async function updateCompanySlugs() {
  // التحقق من وضع المعاينة
  const isDryRun = process.argv.includes('--dry-run')
  
  console.log('═'.repeat(60))
  console.log(isDryRun ? '🔍 وضع المعاينة (Dry Run) - لن يتم تنفيذ أي تغييرات' : '🚀 وضع التنفيذ الفعلي')
  console.log('═'.repeat(60))
  console.log('')
  
  try {
    // 1. قراءة ملف الاستبدالات
    console.log('📖 قراءة ملف الاستبدالات...')
    const replacements = readReplacementsFromCSV()
    console.log(`✅ تم تحميل ${replacements.length} كلمة للاستبدال`)
    console.log('')
    
    // عرض الكلمات
    console.log('📋 قائمة الاستبدالات:')
    console.log('-'.repeat(40))
    replacements.forEach((r, i) => {
      console.log(`   ${(i + 1).toString().padStart(2, '0')}. ${r.old} → ${r.new}`)
    })
    console.log('')
    
    // 2. جلب جميع الشركات
    console.log('🔍 جلب الشركات من قاعدة البيانات...')
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        slug: true,
        name: true
      }
    })
    console.log(`✅ تم العثور على ${companies.length} شركة`)
    console.log('')
    
    // 3. معالجة الشركات
    console.log('🔄 بدء المعالجة...')
    console.log('═'.repeat(60))
    
    let updatedCount = 0
    let unchangedCount = 0
    let errorCount = 0
    const changes: { name: string; oldSlug: string; newSlug: string }[] = []
    
    for (const company of companies) {
      const oldSlug = company.slug
      let newSlug = replaceInSlug(oldSlug, replacements)
      
      // إذا تغير الـ slug
      if (newSlug !== oldSlug) {
        try {
          // التحقق من عدم التكرار
          if (!isDryRun) {
            newSlug = await getUniqueSlug(newSlug, company.id)
            
            // تحديث الشركة
            await prisma.company.update({
              where: { id: company.id },
              data: { slug: newSlug }
            })
          }
          
          changes.push({
            name: company.name,
            oldSlug: oldSlug,
            newSlug: newSlug
          })
          
          updatedCount++
          
          console.log(`[${updatedCount}] ${company.name}`)
          console.log(`    📍 القديم: ${oldSlug}`)
          console.log(`    ✨ الجديد: ${newSlug}`)
          console.log(`    ${isDryRun ? '⏸️  سيتم التحديث' : '✅ تم التحديث'}`)
          console.log('')
          
        } catch (error) {
          errorCount++
          console.log(`[خطأ] ${company.name}`)
          console.log(`    ❌ فشل التحديث: ${error}`)
          console.log('')
        }
      } else {
        unchangedCount++
      }
    }
    
    // 4. عرض الإحصائيات
    console.log('═'.repeat(60))
    console.log('📊 الإحصائيات النهائية:')
    console.log('-'.repeat(40))
    console.log(`   📦 إجمالي الشركات: ${companies.length}`)
    console.log(`   ✏️  ${isDryRun ? 'ستُعدّل' : 'تم تعديلها'}: ${updatedCount}`)
    console.log(`   ⏭️  بدون تغيير: ${unchangedCount}`)
    console.log(`   ❌ أخطاء: ${errorCount}`)
    console.log('')
    
    if (isDryRun && updatedCount > 0) {
      console.log('═'.repeat(60))
      console.log('💡 لتنفيذ التغييرات، شغّل الأمر بدون --dry-run:')
      console.log('   npx tsx scripts/update-company-slugs.ts')
      console.log('═'.repeat(60))
    }
    
    // 5. حفظ سجل التغييرات في ملف
    if (changes.length > 0) {
      const logPath = path.join(process.cwd(), 'docs', `slug-changes-${Date.now()}.json`)
      fs.writeFileSync(logPath, JSON.stringify(changes, null, 2), 'utf-8')
      console.log(`📝 تم حفظ سجل التغييرات في: ${logPath}`)
    }
    
    console.log('')
    console.log(isDryRun ? '🔍 انتهت المعاينة!' : '✅ اكتملت العملية بنجاح!')
    
  } catch (error) {
    console.error('❌ خطأ عام:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل السكريبت
updateCompanySlugs()

