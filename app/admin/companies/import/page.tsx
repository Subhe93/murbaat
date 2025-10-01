'use client'

import { useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  X,
  Download,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Info
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { AvailableCategories } from '@/components/admin/available-categories'
import { AvailableLocations } from '@/components/admin/available-locations'

interface ImportStats {
  totalRows: number
  processedRows: number
  successfulImports: number
  failedImports: number
  skippedRows: number
  downloadedImages: number
  failedImages: number
}

interface ImportError {
  row: number
  companyName: string
  error: string
  data?: any
}

interface SkippedCompany {
  row: number
  companyName: string
  reason: string
  data?: any
}

interface ImportSettings {
  downloadImages: boolean
  createMissingCategories: boolean
  createMissingCities: boolean
  skipDuplicates: boolean
  validateEmails: boolean
  validatePhones: boolean
  batchSize: number
}

export default function ImportCompaniesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStats, setImportStats] = useState<ImportStats>({
    totalRows: 0,
    processedRows: 0,
    successfulImports: 0,
    failedImports: 0,
    skippedRows: 0,
    downloadedImages: 0,
    failedImages: 0
  })
  const [importErrors, setImportErrors] = useState<ImportError[]>([])
  const [skippedCompanies, setSkippedCompanies] = useState<SkippedCompany[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])
  const [importId, setImportId] = useState<string | null>(null)
  const [settings, setSettings] = useState<ImportSettings>({
    downloadImages: true,
    createMissingCategories: true,
    createMissingCities: true,
    skipDuplicates: true,
    validateEmails: true,
    validatePhones: true,
    batchSize: 10
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: session } = useSession()
  const router = useRouter()

  // رفع الملف
  const handleFileUpload = useCallback(async (selectedFile: File) => {
    if (!selectedFile) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await fetch('/api/admin/companies/import/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('فشل في رفع الملف')
      }

      const data = await response.json()
      setPreviewData(data.preview)
      setImportStats(prev => ({ ...prev, totalRows: data.totalRows }))
      toast.success(`تم رفع الملف بنجاح. تم العثور على ${data.totalRows} صف`)
    } catch (error) {
      console.error('خطأ في رفع الملف:', error)
      toast.error('حدث خطأ في رفع الملف')
    } finally {
      setIsUploading(false)
    }
  }, [])

  // بدء عملية الاستيراد
  const startImport = useCallback(async () => {
    if (!file) return

    setIsImporting(true)
    setIsPaused(false)
    setImportProgress(0)
    setImportErrors([])

    const formData = new FormData()
    formData.append('file', file)
    formData.append('downloadImages', settings.downloadImages.toString())
    formData.append('skipDuplicates', settings.skipDuplicates.toString())
    formData.append('validateEmails', settings.validateEmails.toString())
    formData.append('validatePhones', settings.validatePhones.toString())
    formData.append('createMissingCategories', settings.createMissingCategories.toString())
    formData.append('createMissingCities', settings.createMissingCities.toString())
    formData.append('settings', JSON.stringify(settings))

    try {
      const response = await fetch('/api/admin/companies/import/start', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('فشل في بدء عملية الاستيراد')
      }

      const data = await response.json()
      setImportId(data.importId)
      
      // بدء تتبع التقدم
      pollImportProgress(data.importId)
      
      toast.success('تم بدء عملية الاستيراد')
    } catch (error) {
      console.error('خطأ في بدء الاستيراد:', error)
      toast.error('حدث خطأ في بدء عملية الاستيراد')
      setIsImporting(false)
    }
  }, [file, settings])

  // تتبع تقدم الاستيراد
  const pollImportProgress = useCallback(async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/admin/companies/import/progress/${id}`)
        if (!response.ok) {
          clearInterval(interval)
          return
        }

        const data = await response.json()
        setImportStats(data.stats)
        setImportErrors(data.errors)
        setSkippedCompanies(data.skippedCompanies || [])
        
        const progress = data.stats.totalRows > 0 
          ? (data.stats.processedRows / data.stats.totalRows) * 100 
          : 0
        setImportProgress(progress)

        // إذا انتهت العملية
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval)
          setIsImporting(false)
          
          if (data.status === 'completed') {
            toast.success(`تم الانتهاء من الاستيراد! تم استيراد ${data.stats.successfulImports} شركة بنجاح`)
          } else {
            toast.error('فشلت عملية الاستيراد')
          }
        }
      } catch (error) {
        console.error('خطأ في تتبع التقدم:', error)
        clearInterval(interval)
      }
    }, 2000) // تحديث كل ثانيتين

    return () => clearInterval(interval)
  }, [])

  // إيقاف/استكمال الاستيراد
  const toggleImport = useCallback(async () => {
    if (!importId) return

    try {
      const action = isPaused ? 'resume' : 'pause'
      const response = await fetch(`/api/admin/companies/import/${action}/${importId}`, {
        method: 'POST'
      })

      if (response.ok) {
        setIsPaused(!isPaused)
        toast.success(isPaused ? 'تم استكمال الاستيراد' : 'تم إيقاف الاستيراد مؤقتاً')
      }
    } catch (error) {
      console.error('خطأ في إيقاف/استكمال الاستيراد:', error)
    }
  }, [importId, isPaused])

  // إلغاء الاستيراد
  const cancelImport = useCallback(async () => {
    if (!importId) return

    try {
      const response = await fetch(`/api/admin/companies/import/cancel/${importId}`, {
        method: 'POST'
      })

      if (response.ok) {
        setIsImporting(false)
        setIsPaused(false)
        setImportProgress(0)
        toast.success('تم إلغاء عملية الاستيراد')
      }
    } catch (error) {
      console.error('خطأ في إلغاء الاستيراد:', error)
    }
  }, [importId])

  // تنزيل تقرير الأخطاء
  const downloadErrorReport = useCallback(() => {
    if (importErrors.length === 0) return

    const csvContent = [
      'رقم الصف,اسم الشركة,الخطأ',
      ...importErrors.map(error => 
        `${error.row},"${error.companyName}","${error.error}"`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'import-errors.csv'
    link.click()
  }, [importErrors])

  // تنزيل تقرير الشركات المتخطاة
  const downloadSkippedReport = useCallback(() => {
    if (skippedCompanies.length === 0) return

    const csvContent = [
      'رقم الصف,اسم الشركة,سبب التخطي',
      ...skippedCompanies.map(company => 
        `${company.row},"${company.companyName}","${company.reason}"`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'skipped-companies.csv'
    link.click()
  }, [skippedCompanies])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = Array.from(e.dataTransfer.files)
    const csvFile = files.find(file => file.name.endsWith('.csv'))
    
    if (csvFile) {
      setFile(csvFile)
      handleFileUpload(csvFile)
    } else {
      toast.error('يرجى رفع ملف CSV فقط')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile)
      handleFileUpload(selectedFile)
    } else {
      toast.error('يرجى اختيار ملف CSV')
    }
  }

  return (
    <div className="space-y-6">
      {/* الرأس */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          استيراد الشركات من ملف CSV
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          قم برفع ملف CSV لاستيراد الشركات بشكل احترافي مع تحميل الصور ومعالجة البيانات
        </p>
      </div>

      {/* الفئات المتاحة */}
      <AvailableCategories />

      {/* المواقع المتاحة */}
      <AvailableLocations />

      {/* إعدادات الاستيراد */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            إعدادات الاستيراد
          </CardTitle>
          <CardDescription>
            قم بتخصيص عملية الاستيراد حسب احتياجاتك
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="downloadImages">تحميل الصور</Label>
                <Switch
                  id="downloadImages"
                  checked={settings.downloadImages}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, downloadImages: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="createCategories">إنشاء الفئات المفقودة</Label>
                <Switch
                  id="createCategories"
                  checked={settings.createMissingCategories}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, createMissingCategories: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="createCities">إنشاء المدن المفقودة</Label>
                <Switch
                  id="createCities"
                  checked={settings.createMissingCities}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, createMissingCities: checked }))
                  }
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="skipDuplicates">تخطي الشركات المكررة</Label>
                <Switch
                  id="skipDuplicates"
                  checked={settings.skipDuplicates}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, skipDuplicates: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="validateEmails">التحقق من صحة البريد الإلكتروني</Label>
                <Switch
                  id="validateEmails"
                  checked={settings.validateEmails}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, validateEmails: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="validatePhones">التحقق من صحة أرقام الهاتف</Label>
                <Switch
                  id="validatePhones"
                  checked={settings.validatePhones}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, validatePhones: checked }))
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* رفع الملف */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            رفع ملف CSV
          </CardTitle>
          <CardDescription>
            قم برفع ملف CSV الذي يحتوي على بيانات الشركات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {file ? (
              <div className="space-y-4">
                <FileText className="h-12 w-12 text-green-500 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    اختيار ملف آخر
                  </Button>
                  {previewData.length > 0 && (
                    <Button
                      onClick={startImport}
                      disabled={isImporting}
                    >
                      بدء الاستيراد
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    اسحب وأفلت ملف CSV هنا
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    أو انقر لاختيار ملف من جهازك
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? 'جاري الرفع...' : 'اختيار ملف'}
                </Button>
              </div>
            )}
          </div>

          {/* تنسيق الملف المتوقع */}
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>تنسيق الملف المتوقع:</strong> يجب أن يحتوي ملف CSV على الأعمدة التالية:
              Nom, Note, Catégorie, Adresse, Téléphone, SiteWeb, Images, Reviews
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* معاينة البيانات والتقدم */}
      {(previewData.length > 0 || isImporting) && (
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="preview">معاينة البيانات</TabsTrigger>
            <TabsTrigger value="progress">تقدم الاستيراد</TabsTrigger>
            <TabsTrigger value="errors">الأخطاء والتحذيرات</TabsTrigger>
            <TabsTrigger value="skipped">الشركات المتخطاة</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>معاينة البيانات</CardTitle>
                <CardDescription>
                  عرض أول 5 صفوف من البيانات المرفوعة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">اسم الشركة</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الفئة</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">العنوان</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الهاتف</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">التقييم</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.slice(0, 5).map((row, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.Nom}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.Catégorie}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.Adresse}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.Téléphone}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.Note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isImporting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  حالة الاستيراد
                </CardTitle>
                <CardDescription>
                  تتبع تقدم عملية استيراد الشركات
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* شريط التقدم */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>التقدم العام</span>
                    <span>{Math.round(importProgress)}%</span>
                  </div>
                  <Progress value={importProgress} className="w-full" />
                </div>

                {/* إحصائيات */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {importStats.processedRows}
                    </div>
                    <div className="text-sm text-gray-500">تم معالجتها</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {importStats.successfulImports}
                    </div>
                    <div className="text-sm text-gray-500">نجحت</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {importStats.failedImports}
                    </div>
                    <div className="text-sm text-gray-500">فشلت</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {importStats.skippedRows}
                    </div>
                    <div className="text-sm text-gray-500">تم تخطيها</div>
                  </div>
                </div>

                {/* تحميل الصور */}
                {settings.downloadImages && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">تحميل الصور</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">
                          {importStats.downloadedImages}
                        </div>
                        <div className="text-sm text-gray-500">تم تحميلها</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-red-600">
                          {importStats.failedImages}
                        </div>
                        <div className="text-sm text-gray-500">فشل تحميلها</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* أزرار التحكم */}
                {isImporting && (
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      onClick={toggleImport}
                      className="flex items-center gap-2"
                    >
                      {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      {isPaused ? 'استكمال' : 'إيقاف مؤقت'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={cancelImport}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      إلغاء
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  الأخطاء والتحذيرات
                </CardTitle>
                <CardDescription>
                  قائمة بالأخطاء التي حدثت أثناء عملية الاستيراد
                </CardDescription>
                {importErrors.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={downloadErrorReport}
                    className="flex items-center gap-2 mt-2"
                  >
                    <Download className="h-4 w-4" />
                    تنزيل تقرير الأخطاء
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {importErrors.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد أخطاء حتى الآن
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {importErrors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>الصف {error.row}:</strong> {error.companyName} - {error.error}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skipped" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-yellow-500" />
                  الشركات المتخطاة
                </CardTitle>
                <CardDescription>
                  قائمة بالشركات التي تم تخطيها أثناء عملية الاستيراد مع أسباب التخطي
                </CardDescription>
                {skippedCompanies.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={downloadSkippedReport}
                    className="flex items-center gap-2 mt-2"
                  >
                    <Download className="h-4 w-4" />
                    تنزيل تقرير الشركات المتخطاة
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {skippedCompanies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لم يتم تخطي أي شركات حتى الآن
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {skippedCompanies.map((company, index) => (
                      <Alert key={index} className="border-yellow-200 bg-yellow-50">
                        <Info className="h-4 w-4 text-yellow-600" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <div className="font-medium text-yellow-800">
                              <strong>الصف {company.row}:</strong> {company.companyName}
                            </div>
                            <div className="text-sm text-yellow-700">
                              <strong>سبب التخطي:</strong> {company.reason}
                            </div>
                            {company.data && (
                              <div className="text-xs text-yellow-600 mt-2">
                                <strong>البيانات:</strong> الفئة: {company.data.Catégorie}, العنوان: {company.data.Adresse}
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
