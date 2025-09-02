'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Building2, 
  Save, 
  ArrowLeft,
  Plus,
  X,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { DAYS_OF_WEEK_ARABIC, ALL_DAYS_OF_WEEK } from '@/lib/types/working-hours'
import { WorkingHoursEditor, WorkingHourData } from '@/components/working-hours-editor'

interface Country {
  id: string
  code: string
  name: string
  flag?: string
}

interface City {
  id: string
  name: string
  slug: string
}

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
}

interface CompanyDetails {
  id: string
  name: string
  slug: string
  description?: string
  shortDescription?: string
  longDescription?: string
  mainImage?: string
  rating: number
  reviewsCount: number
  isActive: boolean
  isVerified: boolean
  isFeatured: boolean
  phone?: string
  email?: string
  website?: string
  address?: string
  latitude?: number
  longitude?: number
  services: string[]
  specialties: string[]
  createdAt: string
  updatedAt: string
  country: { id: string; name: string; code: string; flag?: string }
  city: { id: string; name: string; slug: string }
  category: { id: string; name: string; slug: string; icon?: string }
  workingHours: Array<{
    dayOfWeek: string
    openTime?: string
    closeTime?: string
    isClosed: boolean
  }>
  socialMedia: Array<{
    platform: string
    url: string
  }>
}

export default function EditCompanyPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [company, setCompany] = useState<CompanyDetails | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    longDescription: '',
    categoryId: '',
    countryId: '',
    cityId: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    mainImage: '',
    logoImage: '',
    latitude: '',
    longitude: '',
    services: [] as string[],
    specialties: [] as string[],
    isVerified: false,
    isFeatured: false,
    isActive: true,
  })

  const [workingHours, setWorkingHours] = useState<Record<string, { openTime: string; closeTime: string; isClosed: boolean }>>({
    // الأحد: { openTime: '09:00', closeTime: '17:00', isClosed: false },
    // الاثنين: { openTime: '09:00', closeTime: '17:00', isClosed: false },
    // الثلاثاء: { openTime: '09:00', closeTime: '17:00', isClosed: false },
    // الأربعاء: { openTime: '09:00', closeTime: '17:00', isClosed: false },
    // الخميس: { openTime: '09:00', closeTime: '17:00', isClosed: false },
    // الجمعة: { openTime: '', closeTime: '', isClosed: true },
    // السبت: { openTime: '09:00', closeTime: '17:00', isClosed: false },
  })

  const [socialMedia, setSocialMedia] = useState({
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    youtube: '',
    tiktok: '',
  })

  const [newService, setNewService] = useState('')
  const [newSpecialty, setNewSpecialty] = useState('')
  const [additionalImages, setAdditionalImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)

  // دالة رفع الصور
  const uploadImage = async (file: File, imageType: string): Promise<string> => {
    setUploadingImage(imageType)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('type', imageType)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData
      })
      
      if (!response.ok) {
        throw new Error('فشل في رفع الصورة')
      }
      
      const result = await response.json()
      console.log('نتيجة رفع الصورة:', result)
      toast.success('تم رفع الصورة بنجاح', {
        description: `تم رفع ${imageType === 'main' ? 'الصورة الرئيسية' : imageType === 'logo' ? 'اللوغو' : 'الصورة'} بنجاح.`,
        duration: 3000,
      })
      return result.url
    } catch (error) {
      console.error('خطأ في رفع الصورة:', error)
      toast.error('فشل في رفع الصورة', {
        description: `تعذر رفع ${imageType === 'main' ? 'الصورة الرئيسية' : imageType === 'logo' ? 'اللوغو' : 'الصورة'}. يرجى التحقق من حجم الصورة والمحاولة مرة أخرى.`,
        duration: 4000,
      })
      throw error
    } finally {
      setUploadingImage(null)
    }
  }

  // دالة تحديث الصورة في formData
  const updateImageField = (imageType: 'main' | 'logo', imageUrl: string) => {
    console.log(`تحديث ${imageType} بالرابط:`, imageUrl)
    if (imageType === 'main') {
      setFormData(prev => ({ ...prev, mainImage: imageUrl }))
      toast.success('تم تحديث الصورة الرئيسية', {
        description: 'تم تحديث رابط الصورة الرئيسية في الحقل النصي.',
        duration: 2000,
      })
    } else if (imageType === 'logo') {
      setFormData(prev => ({ ...prev, logoImage: imageUrl }))
      toast.success('تم تحديث اللوغو', {
        description: 'تم تحديث رابط اللوغو في الحقل النصي.',
        duration: 2000,
      })
    }
  }

  // جلب بيانات الشركة
  useEffect(() => {
    const fetchCompany = async () => {
      if (!params.id) return

      try {
        setIsLoading(true)
        const response = await fetch(`/api/admin/companies/${params.id}`)
        
        if (!response.ok) {
          throw new Error('فشل في جلب بيانات الشركة')
        }

        const companyData = await response.json()
        setCompany(companyData)

        // ملء النموذج بالبيانات الحالية
        setFormData({
          name: companyData.name || '',
          description: companyData.description || '',
          shortDescription: companyData.shortDescription || '',
          longDescription: companyData.longDescription || '',
          categoryId: companyData.category?.id || '',
          countryId: companyData.country?.id || '',
          cityId: companyData.city?.id || '',
          address: companyData.address || '',
          phone: companyData.phone || '',
          email: companyData.email || '',
          website: companyData.website || '',
          mainImage: companyData.mainImage || '',
          logoImage: companyData.logoImage || '',
          latitude: companyData.latitude?.toString() || '',
          longitude: companyData.longitude?.toString() || '',
          services: companyData.services || [],
          specialties: companyData.specialties || [],
          isVerified: companyData.isVerified ?? false,
          isFeatured: companyData.isFeatured ?? false,
          isActive: companyData.isActive ?? true,
        })

        // ملء ساعات العمل
        const hoursMap = Object.fromEntries(
          companyData.workingHours.map((hours: any) => [
            hours.dayOfWeek,
            {
              openTime: hours.openTime || '',
              closeTime: hours.closeTime || '',
              isClosed: hours.isClosed
            }
          ])
        )
        setWorkingHours(prev => ({ ...prev, ...hoursMap }))

        // ملء وسائل التواصل
        const socialMap = Object.fromEntries(
          companyData.socialMedia?.map((social: any) => [social.platform, social.url]) || []
        )
        setSocialMedia(prev => ({ ...prev, ...socialMap }))

        // ملء الصور الإضافية
        if (companyData.images && Array.isArray(companyData.images)) {
          const imageUrls = companyData.images.map((img: any) => img.imageUrl)
          setAdditionalImages(imageUrls)
        }

      } catch (error) {
        console.error('خطأ في جلب بيانات الشركة:', error)
        toast.error('خطأ في جلب بيانات الشركة')
      } finally {
        setIsLoading(false)
      }
    }

    if (session) {
      fetchCompany()
    }
  }, [session, params.id])

  // جلب البيانات المساعدة
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('جلب البلدان والفئات...')
        const [countriesRes, categoriesRes] = await Promise.all([
          fetch('/api/admin/countries?activeOnly=true'),
          fetch('/api/admin/categories?activeOnly=true')
        ])

        if (countriesRes.ok) {
          const countriesData = await countriesRes.json()
          console.log('البلدان المحملة:', countriesData?.countries?.length || 0)
          setCountries(countriesData.countries || [])
        } else {
          console.error('فشل في جلب البلدان:', countriesRes.status)
          toast.error('فشل في جلب البلدان')
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          console.log('الفئات المحملة:', categoriesData?.categories?.length || 0)
          setCategories(categoriesData.categories || [])
        } else {
          console.error('فشل في جلب الفئات:', categoriesRes.status)
          toast.error('فشل في جلب الفئات')
        }
      } catch (error) {
        console.error('خطأ في جلب البيانات:', error)
        toast.error('خطأ في جلب البيانات')
      }
    }

    if (session) {
      fetchData()
    }
  }, [session])

  // جلب المدن عند تغيير البلد
  useEffect(() => {
    const fetchCities = async () => {
      if (formData.countryId) {
        try {
          console.log('جلب المدن للبلد:', formData.countryId)
          const response = await fetch(`/api/admin/countries/${formData.countryId}/cities`)
          if (response.ok) {
            const citiesData = await response.json()
            console.log('المدن المحملة:', citiesData?.length || 0)
            setCities(Array.isArray(citiesData) ? citiesData : [])
          } else {
            console.error('فشل في جلب المدن:', response.status)
            toast.error('فشل في جلب المدن')
            setCities([])
          }
        } catch (error) {
          console.error('خطأ في جلب المدن:', error)
          toast.error('خطأ في جلب المدن')
          setCities([])
        }
      } else {
        setCities([])
      }
    }

    fetchCities()
  }, [formData.countryId])

  // دوال المساعدة
  const addService = () => {
    if (newService.trim() && !formData.services.includes(newService.trim())) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, newService.trim()]
      }))
      setNewService('')
    }
  }

  const removeService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(s => s !== service)
    }))
  }

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }))
      setNewSpecialty('')
    }
  }

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // التحقق من البيانات المطلوبة
      if (!formData.name || !formData.categoryId || !formData.countryId || !formData.cityId) {
        toast.error('يرجى ملء جميع الحقول المطلوبة')
        return
      }

      console.log('بيانات التحديث:', {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        additionalImages,
      })

      const response = await fetch(`/api/admin/companies/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
          longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
          additionalImages,
        }),
      })

      console.log('استجابة التحديث:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'خطأ غير معروف' }))
        console.error('تفاصيل الخطأ:', errorData)
        throw new Error(errorData.error || `خطأ في الخادم: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('نتيجة التحديث:', result)

      // تحديث ساعات العمل - فقط بالانجليزية
      // نفترض أن مفاتيح workingHours هي بالإنجليزية (مثلاً: 'monday', 'tuesday', ...)
      // إذا كانت هناك مفاتيح بالعربية يجب تحويلها هنا
      const englishDays = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday'
      ]

      console.log('workingHours:', workingHours)

      // تحويل الأيام إلى الصيغة الصحيحة وإضافة التحقق من الأوقات
      const workingHoursData = Object.entries(workingHours)
        .filter(([day, hours]) => 
          englishDays.includes(day.toLowerCase())
        )
        .map(([day, hours]) => {
          // تحويل أول حرف إلى كبير
          const formattedDay = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()
          
          // التحقق من صحة الأوقات
          if (!hours.isClosed) {
            if (!hours.openTime || !hours.closeTime) {
              throw new Error(`يجب تحديد وقت الفتح والإغلاق ليوم ${formattedDay}`)
            }
            if (hours.openTime >= hours.closeTime) {
              throw new Error(`يجب أن يكون وقت الفتح قبل وقت الإغلاق ليوم ${formattedDay}`)
            }
          }

          return {
            dayOfWeek: formattedDay,
            openTime: hours.isClosed ? null : hours.openTime,
            closeTime: hours.isClosed ? null : hours.closeTime,
          isClosed: hours.isClosed
          }
        })

      console.log('بيانات ساعات العمل (بالانجليزية فقط):', workingHoursData)

      const workingHoursResponse = await fetch(`/api/admin/companies/${params.id}/working-hours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workingHoursData)
      })

      if (!workingHoursResponse.ok) {
        console.warn('تحذير: فشل في تحديث ساعات العمل')
        toast.warning('تم تحديث الشركة ولكن فشل في تحديث ساعات العمل')
      }

      // تحديث وسائل التواصل الاجتماعي
      const socialMediaData = Object.entries(socialMedia)
        .filter(([platform, url]) => url.trim())
        .map(([platform, url]) => ({ platform, url }))

      console.log('بيانات وسائل التواصل:', socialMediaData)

      const socialMediaResponse = await fetch(`/api/admin/companies/${params.id}/social-media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(socialMediaData)
      })

      if (!socialMediaResponse.ok) {
        console.warn('تحذير: فشل في تحديث وسائل التواصل الاجتماعي')
        toast.warning('تم تحديث الشركة ولكن فشل في تحديث وسائل التواصل الاجتماعي')
      }

      toast.success('تم تحديث الشركة بنجاح')
      router.push(`/admin/companies/${params.id}`)
    } catch (error) {
      console.error('خطأ في تحديث الشركة:', error)
      
      // معالجة أنواع مختلفة من الأخطاء
      let errorMessage = 'خطأ في تحديث الشركة'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      // عرض رسالة خطأ مفصلة
      toast.error(`فشل في تحديث الشركة: ${errorMessage}`, {
        description: 'يرجى التحقق من البيانات المدخلة والمحاولة مرة أخرى',
        duration: 5000
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
    return null
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          الشركة غير موجودة
        </h3>
        <Button asChild>
          <Link href="/admin/companies">
            العودة إلى قائمة الشركات
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* الرأس */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/companies/${company.id}`}>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4 rotate-180" />
            العودة
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            تعديل {company.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            تحديث بيانات الشركة
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* المعلومات الأساسية */}
            <Card>
              <CardHeader>
                <CardTitle>المعلومات الأساسية</CardTitle>
                <CardDescription>البيانات الأساسية للشركة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم الشركة *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="شركة ABC للتقنية"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">وصف مختصر *</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف مختصر عن الشركة..."
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longDescription">وصف مفصل</Label>
                  <Textarea
                    id="longDescription"
                    value={formData.longDescription || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, longDescription: e.target.value }))}
                    placeholder="وصف مفصل عن الشركة وخدماتها..."
                    rows={5}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">الفئة *</Label>
                    <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories && categories.length > 0 ? (
                          categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-gray-500">
                            جاري تحميل الفئات...
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">البلد *</Label>
                    <Select value={formData.countryId} onValueChange={(value) => setFormData(prev => ({ ...prev, countryId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر البلد" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries && countries.length > 0 ? (
                          countries.map((country) => (
                            <SelectItem key={country.id} value={country.id}>
                              {country.flag && `${country.flag} `}{country.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-gray-500">
                            جاري تحميل البلدان...
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">المدينة *</Label>
                  <Select 
                    value={formData.cityId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, cityId: value }))}
                    disabled={!formData.countryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.countryId ? "اختر المدينة" : "اختر البلد أولاً"} />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.countryId ? (
                        cities && cities.length > 0 ? (
                          cities.map((city) => (
                            <SelectItem key={city.id} value={city.id}>
                              {city.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-gray-500">
                            جاري تحميل المدن...
                          </div>
                        )
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-gray-500">
                          اختر البلد أولاً
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* معلومات التواصل */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات التواصل</CardTitle>
                <CardDescription>بيانات التواصل مع الشركة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">العنوان</Label>
                  <Input
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="الشارع، الحي، المدينة"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+963-11-1234567"
                      className="text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="info@company.com"
                      className="text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">الموقع الإلكتروني</Label>
                  <Input
                    id="website"
                    value={formData.website || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://company.com"
                    className="text-left"
                    dir="ltr"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">خط العرض</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                      placeholder="33.5138"
                      className="text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longitude">خط الطول</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                      placeholder="36.2765"
                      className="text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* الصور */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  صور الشركة
                </CardTitle>
                <CardDescription>قم بتحديث الصور أو رفع صور جديدة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                
                {/* الصورة الرئيسية */}
                <div className="border rounded-lg p-4 bg-gray-50/50 dark:bg-gray-800/50">
                  <h4 className="font-medium text-lg mb-4 flex items-center gap-2">
                    📸 الصورة الرئيسية
                    <span className="text-sm text-red-500">*</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="mainImageUrl">رابط الصورة</Label>
                      <Input
                        id="mainImageUrl"
                        value={formData.mainImage || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, mainImage: e.target.value }))}
                        placeholder="https://example.com/main-image.jpg"
                        className="text-left"
                        dir="ltr"
                      />
                      
                      <div className="text-center">
                        <div className="text-sm text-gray-500 mb-2 font-medium">أو</div>
                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                console.log('بدء رفع الصورة الرئيسية:', file.name)
                                try {
                                  const imageUrl = await uploadImage(file, 'main')
                                  console.log('تم رفع الصورة الرئيسية:', imageUrl)
                                  updateImageField('main', imageUrl)
                                } catch (error) {
                                  console.error('خطأ في رفع الصورة:', error)
                                }
                              }
                            }}
                            className="w-full"
                            disabled={uploadingImage === 'main'}
                          />
                          {uploadingImage === 'main' && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded">
                              <div className="text-blue-600 text-sm font-medium">جاري الرفع...</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center">
                      {formData.mainImage ? (
                        <div className="relative">
                          <img
                            src={formData.mainImage}
                            alt="معاينة الصورة الرئيسية"
                            className="w-40 h-40 object-cover rounded-lg border-2 border-dashed border-gray-300"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -left-2 h-6 w-6 p-0 rounded-full"
                            onClick={() => setFormData(prev => ({ ...prev, mainImage: '' }))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500">
                          <div className="text-center">
                            <Building2 className="h-8 w-8 mx-auto mb-2" />
                            <div className="text-sm">الصورة الرئيسية</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* لوغو الشركة */}
                <div className="border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-900/20">
                  <h4 className="font-medium text-lg mb-4 flex items-center gap-2">
                    🏢 لوغو الشركة
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="logoImageUrl">رابط اللوغو</Label>
                      <Input
                        id="logoImageUrl"
                        value={formData.logoImage || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, logoImage: e.target.value }))}
                        placeholder="https://example.com/logo.png"
                        className="text-left"
                        dir="ltr"
                      />
                      
                      <div className="text-center">
                        <div className="text-sm text-gray-500 mb-2 font-medium">أو</div>
                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/*,.svg"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                console.log('بدء رفع اللوغو:', file.name)
                                try {
                                  const imageUrl = await uploadImage(file, 'logo')
                                  console.log('تم رفع اللوغو:', imageUrl)
                                  updateImageField('logo', imageUrl)
                                } catch (error) {
                                  console.error('خطأ في رفع اللوغو:', error)
                                }
                              }
                            }}
                            className="w-full"
                            disabled={uploadingImage === 'logo'}
                          />
                          {uploadingImage === 'logo' && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded">
                              <div className="text-blue-600 text-sm font-medium">جاري رفع اللوغو...</div>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          يُفضل ملفات SVG أو PNG شفافة
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center">
                      {formData.logoImage ? (
                        <div className="relative">
                          <div className="w-32 h-32 bg-white rounded-lg border-2 border-dashed border-blue-300 p-3 flex items-center justify-center">
                            <img
                              src={formData.logoImage}
                              alt="معاينة اللوغو"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -left-2 h-6 w-6 p-0 rounded-full"
                            onClick={() => setFormData(prev => ({ ...prev, logoImage: '' }))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-32 h-32 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center text-gray-500 bg-white">
                          <div className="text-center">
                            <Building2 className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                            <div className="text-sm">اللوغو</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* معرض الصور الإضافية */}
                <div className="border rounded-lg p-4 bg-green-50/50 dark:bg-green-900/20">
                  <h4 className="font-medium text-lg mb-4 flex items-center gap-2">
                    🖼️ معرض الصور
                    <Badge variant="secondary" className="text-xs">
                      {additionalImages.length} صورة
                    </Badge>
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="relative inline-block w-full max-w-md">
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={async (e) => {
                            const files = e.target.files
                            if (files && files.length > 0) {
                              for (let i = 0; i < files.length; i++) {
                                try {
                                  const imageUrl = await uploadImage(files[i], 'gallery')
                                  setAdditionalImages(prev => [...prev, imageUrl])
                                } catch (error) {
                                  console.error(`خطأ في رفع الصورة ${i + 1}:`, error)
                                }
                              }
                            }
                          }}
                          className="w-full"
                          disabled={uploadingImage === 'gallery'}
                        />
                        {uploadingImage === 'gallery' && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded">
                            <div className="text-green-600 text-sm font-medium">جاري رفع الصور...</div>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        يمكنك اختيار عدة صور معاً • الحد الأقصى: 5MB لكل صورة
                      </p>
                    </div>
                    
                    {additionalImages.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {additionalImages.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-green-400 transition-colors">
                              <img
                                src={imageUrl}
                                alt={`صورة ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full"
                                onClick={() => setAdditionalImages(prev => prev.filter((_, i) => i !== index))}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                        
                        {/* زر إضافة المزيد */}
                        <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-green-400 transition-colors cursor-pointer"
                             onClick={() => document.getElementById('additional-images-input-edit')?.click()}>
                          <div className="text-center text-gray-500">
                            <Plus className="h-8 w-8 mx-auto mb-1" />
                            <div className="text-xs">إضافة المزيد</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <input
                      id="additional-images-input-edit"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = e.target.files
                        if (files && files.length > 0) {
                          for (let i = 0; i < files.length; i++) {
                            try {
                              const imageUrl = await uploadImage(files[i], 'gallery')
                              setAdditionalImages(prev => [...prev, imageUrl])
                            } catch (error) {
                              console.error(`خطأ في رفع الصورة ${i + 1}:`, error)
                            }
                          }
                        }
                      }}
                      disabled={uploadingImage === 'gallery'}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* الخدمات والتخصصات */}
            <Card>
              <CardHeader>
                <CardTitle>الخدمات والتخصصات</CardTitle>
                <CardDescription>قائمة بالخدمات والتخصصات التي تقدمها الشركة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* الخدمات */}
                <div className="space-y-3">
                  <Label>الخدمات</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      placeholder="أدخل خدمة جديدة"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addService()
                        }
                      }}
                    />
                    <Button type="button" onClick={addService} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.services.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.services.map((service, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {service}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeService(service)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* التخصصات */}
                <div className="space-y-3">
                  <Label>التخصصات</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      placeholder="أدخل تخصص جديد"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSpecialty()
                        }
                      }}
                    />
                    <Button type="button" onClick={addSpecialty} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          {specialty}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeSpecialty(specialty)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ساعات العمل */}
            <WorkingHoursEditor
              initialHours={company?.workingHours}
              onSave={async (hours: WorkingHourData[]) => {
                try {
                  const response = await fetch(`/api/admin/companies/${params.id}/working-hours`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ workingHours: hours })
                  });

                  if (!response.ok) {
                    throw new Error('فشل في تحديث ساعات العمل');
                  }

                  const data = await response.json();
                  setWorkingHours(data.workingHours);
                  toast.success('تم تحديث ساعات العمل بنجاح');
                } catch (error) {
                  console.error('خطأ في تحديث ساعات العمل:', error);
                  toast.error('فشل في تحديث ساعات العمل');
                }
              }}
              isLoading={isSaving}
            />

            {/* وسائل التواصل الاجتماعي */}
            <Card>
              <CardHeader>
                <CardTitle>وسائل التواصل الاجتماعي</CardTitle>
                <CardDescription>روابط صفحات الشركة على وسائل التواصل الاجتماعي</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook">فيسبوك</Label>
                    <Input
                      id="facebook"
                      value={socialMedia.facebook || ''}
                      onChange={(e) => setSocialMedia(prev => ({ ...prev, facebook: e.target.value }))}
                      placeholder="https://facebook.com/company"
                      className="text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter">تويتر</Label>
                    <Input
                      id="twitter"
                      value={socialMedia.twitter || ''}
                      onChange={(e) => setSocialMedia(prev => ({ ...prev, twitter: e.target.value }))}
                      placeholder="https://twitter.com/company"
                      className="text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">إنستغرام</Label>
                    <Input
                      id="instagram"
                      value={socialMedia.instagram || ''}
                      onChange={(e) => setSocialMedia(prev => ({ ...prev, instagram: e.target.value }))}
                      placeholder="https://instagram.com/company"
                      className="text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin">لينكدإن</Label>
                    <Input
                      id="linkedin"
                      value={socialMedia.linkedin || ''}
                      onChange={(e) => setSocialMedia(prev => ({ ...prev, linkedin: e.target.value }))}
                      placeholder="https://linkedin.com/company/company"
                      className="text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtube">يوتيوب</Label>
                    <Input
                      id="youtube"
                      value={socialMedia.youtube || ''}
                      onChange={(e) => setSocialMedia(prev => ({ ...prev, youtube: e.target.value }))}
                      placeholder="https://youtube.com/@company"
                      className="text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tiktok">تيك توك</Label>
                    <Input
                      id="tiktok"
                      value={socialMedia.tiktok || ''}
                      onChange={(e) => setSocialMedia(prev => ({ ...prev, tiktok: e.target.value }))}
                      placeholder="https://tiktok.com/@company"
                      className="text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* الشريط الجانبي */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إجراءات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>جاري الحفظ...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      <span>حفظ التغييرات</span>
                    </div>
                  )}
                </Button>

                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href={`/admin/companies/${company.id}`}>
                    إلغاء
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>خيارات متقدمة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
                  />
                  <Label htmlFor="isActive" className="text-sm">
                    شركة نشطة
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isVerified"
                    checked={formData.isVerified}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVerified: checked as boolean }))}
                  />
                  <Label htmlFor="isVerified" className="text-sm">
                    شركة موثقة
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked as boolean }))}
                  />
                  <Label htmlFor="isFeatured" className="text-sm">
                    شركة مميزة
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>معلومات الشركة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p><strong>المعرف:</strong> {company.id}</p>
                <p><strong>الرابط:</strong> {company.slug}</p>
                <p><strong>تاريخ الإنشاء:</strong> {new Date(company.createdAt).toLocaleDateString('ar')}</p>
                <p><strong>آخر تحديث:</strong> {new Date(company.updatedAt).toLocaleDateString('ar')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
