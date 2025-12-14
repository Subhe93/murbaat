'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  RefreshCw, 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowRight,
  Search,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'

interface Replacement {
  old: string
  new: string
}

interface PreviewItem {
  id: string
  name: string
  oldSlug: string
  newSlug: string
  selected?: boolean
}

interface Stats {
  totalCompanies: number
  toBeUpdated: number
  unchanged: number
}

interface UpdateResult {
  success: { id: string; name: string; oldSlug: string; newSlug: string }[]
  errors: { id: string; name: string; error: string }[]
  skipped: { id: string; name: string; reason: string }[]
}

export default function SlugUpdaterPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // States
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [replacements, setReplacements] = useState<Replacement[]>([])
  const [preview, setPreview] = useState<PreviewItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showReplacements, setShowReplacements] = useState(false)
  const [selectAll, setSelectAll] = useState(true)
  const [updateResult, setUpdateResult] = useState<UpdateResult | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Auth check
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      router.push('/admin')
    }
  }, [session, status, router])

  // جلب المعاينة
  const fetchPreview = async () => {
    setIsLoading(true)
    setError(null)
    setUpdateResult(null)
    
    try {
      const response = await fetch('/api/admin/slug-updater')
      const result = await response.json()
      
      if (result.success) {
        setReplacements(result.data.replacements)
        setPreview(result.data.preview.map((item: PreviewItem) => ({ ...item, selected: true })))
        setStats(result.data.stats)
      } else {
        setError(result.error || 'حدث خطأ في جلب البيانات')
      }
    } catch (err) {
      setError('فشل الاتصال بالخادم')
    } finally {
      setIsLoading(false)
    }
  }

  // تنفيذ التحديث
  const executeUpdate = async () => {
    const selectedItems = preview.filter(item => item.selected)
    
    if (selectedItems.length === 0) {
      setError('يرجى اختيار شركة واحدة على الأقل')
      return
    }
    
    setIsUpdating(true)
    setError(null)
    setProgress(0)
    
    try {
      // محاكاة التقدم
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)
      
      const response = await fetch('/api/admin/slug-updater', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyIds: selectedItems.map(item => item.id)
        })
      })
      
      clearInterval(progressInterval)
      setProgress(100)
      
      const result = await response.json()
      
      if (result.success) {
        setUpdateResult(result.data.results)
        // إزالة العناصر المحدثة من المعاينة
        setPreview(prev => prev.filter(item => 
          !result.data.results.success.find((s: any) => s.id === item.id)
        ))
        // تحديث الإحصائيات
        if (stats) {
          setStats({
            ...stats,
            toBeUpdated: stats.toBeUpdated - result.data.results.success.length
          })
        }
      } else {
        setError(result.error || 'حدث خطأ أثناء التحديث')
      }
    } catch (err) {
      setError('فشل الاتصال بالخادم')
    } finally {
      setIsUpdating(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  // تحديد/إلغاء تحديد الكل
  const toggleSelectAll = () => {
    const newValue = !selectAll
    setSelectAll(newValue)
    setPreview(prev => prev.map(item => ({ ...item, selected: newValue })))
  }

  // تحديد/إلغاء تحديد عنصر
  const toggleItem = (id: string) => {
    setPreview(prev => prev.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ))
  }

  // فلترة العناصر
  const filteredPreview = preview.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.oldSlug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.newSlug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedCount = preview.filter(item => item.selected).length

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/admin/settings" className="hover:text-blue-600">الإعدادات</Link>
            <ArrowRight className="h-4 w-4" />
            <span>تحديث Slugs الشركات</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            تحديث Slugs الشركات
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            استبدال الكلمات في روابط الشركات بناءً على ملف الاستبدالات
          </p>
        </div>
        
        <Button onClick={fetchPreview} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 ml-2" />
          )}
          {isLoading ? 'جاري التحميل...' : 'تحميل المعاينة'}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-700 dark:text-red-400">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">إجمالي الشركات</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.totalCompanies.toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">ستُحدَّث</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {stats.toBeUpdated.toLocaleString()}
                  </p>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">بدون تغيير</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.unchanged.toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Replacements List */}
      {replacements.length > 0 && (
        <Card>
          <CardHeader 
            className="cursor-pointer"
            onClick={() => setShowReplacements(!showReplacements)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  قائمة الاستبدالات ({replacements.length})
                </CardTitle>
                <CardDescription>الكلمات التي سيتم استبدالها</CardDescription>
              </div>
              {showReplacements ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </div>
          </CardHeader>
          
          {showReplacements && (
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {replacements.map((r, i) => (
                  <div 
                    key={i} 
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-sm flex items-center justify-between"
                  >
                    <span className="text-red-600 line-through">{r.old}</span>
                    <ArrowRight className="h-3 w-3 text-gray-400 mx-1" />
                    <span className="text-green-600 font-medium">{r.new}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Update Result */}
      {updateResult && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              نتيجة التحديث
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{updateResult.success.length}</p>
                <p className="text-sm text-green-600">تم بنجاح</p>
              </div>
              <div className="text-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <p className="text-2xl font-bold text-red-700">{updateResult.errors.length}</p>
                <p className="text-sm text-red-600">أخطاء</p>
              </div>
              <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-2xl font-bold text-gray-700">{updateResult.skipped.length}</p>
                <p className="text-sm text-gray-600">تم تخطيها</p>
              </div>
            </div>
            
            {updateResult.success.length > 0 && (
              <div className="mt-4">
                <p className="font-medium text-green-700 mb-2">التحديثات الناجحة:</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {updateResult.success.slice(0, 10).map((item, i) => (
                    <div key={i} className="text-sm flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="font-medium">{item.name}:</span>
                      <span className="text-red-500 line-through">{item.oldSlug}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="text-green-600">{item.newSlug}</span>
                    </div>
                  ))}
                  {updateResult.success.length > 10 && (
                    <p className="text-gray-500 text-sm">و {updateResult.success.length - 10} آخرين...</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Table */}
      {preview.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>معاينة التغييرات</CardTitle>
                <CardDescription>
                  {selectedCount} من {preview.length} شركة محددة للتحديث
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="بحث..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 w-64"
                  />
                </div>
                
                <Button
                  onClick={executeUpdate}
                  disabled={isUpdating || selectedCount === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 ml-2" />
                  )}
                  {isUpdating ? 'جاري التحديث...' : `تنفيذ التحديث (${selectedCount})`}
                </Button>
              </div>
            </div>
            
            {/* Progress Bar */}
            {isUpdating && (
              <div className="mt-4">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-500 mt-1 text-center">{progress}%</p>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="p-3 text-right w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="p-3 text-right font-medium">الشركة</th>
                    <th className="p-3 text-right font-medium">Slug الحالي</th>
                    <th className="p-3 text-right font-medium">Slug الجديد</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPreview.map((item) => (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        item.selected ? '' : 'opacity-50'
                      }`}
                    >
                      <td className="p-3">
                        <Checkbox
                          checked={item.selected}
                          onCheckedChange={() => toggleItem(item.id)}
                        />
                      </td>
                      <td className="p-3">
                        <span className="font-medium">{item.name}</span>
                      </td>
                      <td className="p-3">
                        <code className="bg-red-50 dark:bg-red-900/20 text-red-600 px-2 py-1 rounded text-sm">
                          {item.oldSlug}
                        </code>
                      </td>
                      <td className="p-3">
                        <code className="bg-green-50 dark:bg-green-900/20 text-green-600 px-2 py-1 rounded text-sm">
                          {item.newSlug}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredPreview.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  {searchTerm ? 'لا توجد نتائج مطابقة' : 'لا توجد تغييرات'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !stats && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              ابدأ بتحميل المعاينة
            </h3>
            <p className="text-gray-500 mb-6">
              اضغط على زر "تحميل المعاينة" لعرض التغييرات المقترحة على slugs الشركات
            </p>
            <Button onClick={fetchPreview}>
              <RefreshCw className="h-4 w-4 ml-2" />
              تحميل المعاينة
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

