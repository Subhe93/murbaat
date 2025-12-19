import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import Papa from 'papaparse'

const prisma = new PrismaClient()

interface Replacement {
  old: string
  new: string
}

interface PreviewItem {
  id: string
  name: string
  oldSlug: string
  newSlug: string
}

// قراءة ملف CSV
function readReplacementsFromCSV(): Replacement[] {
  const csvPath = path.join(process.cwd(), 'docs', 'Sheet4.csv')
  
  if (!fs.existsSync(csvPath)) {
    throw new Error('ملف الاستبدالات غير موجود: docs/Sheet4.csv')
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  
  const result = Papa.parse<{ old: string; new: string }>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  })
  
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
    const patterns = [
      new RegExp(`^${replacement.old}-`, 'g'),
      new RegExp(`-${replacement.old}$`, 'g'),
      new RegExp(`-${replacement.old}-`, 'g'),
      new RegExp(`^${replacement.old}$`, 'g'),
    ]
    
    const replacementValues = [
      `${replacement.new}-`,
      `-${replacement.new}`,
      `-${replacement.new}-`,
      `${replacement.new}`,
    ]
    
    for (let i = 0; i < patterns.length; i++) {
      newSlug = newSlug.replace(patterns[i], replacementValues[i])
    }
  }
  
  return newSlug
}

// GET - معاينة التغييرات
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    
    // قراءة الاستبدالات
    const replacements = readReplacementsFromCSV()
    
    // جلب الشركات
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        slug: true,
        name: true
      }
    })
    
    // حساب التغييرات
    const preview: PreviewItem[] = []
    
    for (const company of companies) {
      const newSlug = replaceInSlug(company.slug, replacements)
      
      if (newSlug !== company.slug) {
        preview.push({
          id: company.id,
          name: company.name,
          oldSlug: company.slug,
          newSlug: newSlug
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        replacements,
        preview,
        stats: {
          totalCompanies: companies.length,
          toBeUpdated: preview.length,
          unchanged: companies.length - preview.length
        }
      }
    })
    
  } catch (error) {
    console.error('خطأ في معاينة التغييرات:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'حدث خطأ' },
      { status: 500 }
    )
  }
}

// POST - تنفيذ التحديث
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    
    const body = await request.json()
    const { companyIds } = body // قائمة IDs للشركات المراد تحديثها (اختياري)
    
    // قراءة الاستبدالات
    const replacements = readReplacementsFromCSV()
    
    // جلب الشركات
    const whereClause = companyIds && companyIds.length > 0 
      ? { id: { in: companyIds } }
      : {}
    
    const companies = await prisma.company.findMany({
      where: whereClause,
      select: {
        id: true,
        slug: true,
        name: true
      }
    })
    
    const results: {
      success: { id: string; name: string; oldSlug: string; newSlug: string }[]
      errors: { id: string; name: string; error: string }[]
      skipped: { id: string; name: string; reason: string }[]
    } = {
      success: [],
      errors: [],
      skipped: []
    }
    
    for (const company of companies) {
      const newSlug = replaceInSlug(company.slug, replacements)
      
      if (newSlug === company.slug) {
        results.skipped.push({
          id: company.id,
          name: company.name,
          reason: 'لا يوجد تغيير'
        })
        continue
      }
      
      try {
        // التحقق من عدم وجود slug مكرر
        let uniqueSlug = newSlug
        let counter = 1
        
        while (true) {
          const existing = await prisma.company.findFirst({
            where: {
              slug: uniqueSlug,
              id: { not: company.id }
            }
          })
          
          if (!existing) break
          
          uniqueSlug = `${newSlug}-${counter}`
          counter++
        }
        
        // تحديث الشركة
        await prisma.company.update({
          where: { id: company.id },
          data: { slug: uniqueSlug }
        })
        
        results.success.push({
          id: company.id,
          name: company.name,
          oldSlug: company.slug,
          newSlug: uniqueSlug
        })
        
      } catch (error) {
        results.errors.push({
          id: company.id,
          name: company.name,
          error: error instanceof Error ? error.message : 'خطأ غير معروف'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        results,
        stats: {
          total: companies.length,
          updated: results.success.length,
          errors: results.errors.length,
          skipped: results.skipped.length
        }
      }
    })
    
  } catch (error) {
    console.error('خطأ في تنفيذ التحديث:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'حدث خطأ' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}



