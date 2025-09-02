'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  MessageSquare, 
  Star, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Filter,
  Search
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Review {
  id: string
  title: string
  comment: string
  rating: number
  isApproved: boolean
  isVerified: boolean
  createdAt: string
  userName?: string
  userEmail?: string
  company: {
    name: string
    slug: string
  }
  user?: {
    name: string
    avatar?: string
    email: string
  } | null
  images: Array<{
    id: string
    url: string
  }>
}

interface ReviewsResponse {
  reviews: Review[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }
  }, [session, status, router])

  const fetchReviews = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter && { status: statusFilter })
      })

      const response = await fetch(`/api/admin/reviews?${params}`)
      if (!response.ok) {
        throw new Error('فشل في جلب المراجعات')
      }

      const data = await response.json()
      
      if (data.success) {
        // التحقق من بنية الاستجابة الجديدة
        setReviews(data.data || [])
        setTotalPages(data.meta?.pagination?.totalPages || 1)
      } else {
        console.error('خطأ في API:', data.error)
        setError(data.error?.message || 'حدث خطأ في تحميل البيانات')
        setReviews([])
      }
    } catch (error) {
      console.error('خطأ في جلب المراجعات:', error)
      setError('حدث خطأ في الاتصال بالخادم')
      setReviews([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchReviews()
    }
  }, [session, currentPage, statusFilter])

  const handleApproveReview = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve' })
      })

      const result = await response.json()

      if (result.success) {
        // تحديث حالة المراجعة في القائمة
        setReviews(prev => 
          prev.map(review => 
            review.id === reviewId 
              ? { ...review, isApproved: true }
              : review
          )
        )
        // إشعار النجاح
        toast({
          title: "تم بنجاح",
          description: result.message || 'تم الموافقة على المراجعة بنجاح',
          variant: "success",
        })
      } else {
        toast({
          title: "خطأ في الموافقة",
          description: result.error?.message || 'حدث خطأ أثناء الموافقة',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('خطأ في الموافقة على المراجعة:', error)
      toast({
        title: "خطأ في الاتصال",
        description: 'حدث خطأ أثناء الموافقة على المراجعة',
        variant: "destructive",
      })
    }
  }

  const handleRejectReview = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' })
      })

      const result = await response.json()

      if (result.success) {
        // إزالة المراجعة من القائمة
        setReviews(prev => prev.filter(review => review.id !== reviewId))
        // إشعار النجاح
        toast({
          title: "تم الرفض",
          description: result.message || 'تم رفض المراجعة بنجاح',
          variant: "success",
        })
      } else {
        toast({
          title: "خطأ في الرفض",
          description: result.error?.message || 'حدث خطأ أثناء رفض المراجعة',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('خطأ في رفض المراجعة:', error)
      toast({
        title: "خطأ في الاتصال",
        description: 'حدث خطأ أثناء رفض المراجعة',
        variant: "destructive",
      })
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* الرأس */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          إدارة المراجعات
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          مراجعة والموافقة على تقييمات المستخدمين
        </p>
      </div>

      {/* الفلاتر */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في المراجعات..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('')}
              >
                الكل
              </Button>
              <Button
                variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('PENDING')}
              >
                <Clock className="h-4 w-4 ml-1" />
                معلقة
              </Button>
              <Button
                variant={statusFilter === 'APPROVED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('APPROVED')}
              >
                <CheckCircle className="h-4 w-4 ml-1" />
                موافق عليها
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول المراجعات */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المراجعات</CardTitle>
          <CardDescription>
            {reviews?.length || 0} مراجعة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 space-x-reverse text-red-600 dark:text-red-400">
                <XCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchReviews()}
                className="mt-3"
              >
                إعادة المحاولة
              </Button>
            </div>
          )}
          
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : !error && reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 space-x-reverse flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.user?.avatar || undefined} />
                        <AvatarFallback>
                          {(review.user?.name || review.userName || 'زائر')
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 space-x-reverse mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {review.title}
                          </h4>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${
                                  i < review.rating 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                          <Badge 
                            variant={review.isApproved ? 'default' : 'secondary'}
                          >
                            {review.isApproved ? 'موافق عليها' : 'معلقة'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {review.comment}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            بواسطة {review.user?.name || review.userName || 'زائر'} • {review.company.name} • {new Date(review.createdAt).toLocaleDateString('ar-SA')}
                          </div>
                          {review.images.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {review.images.length} صورة
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse ml-4">
                      {!review.isApproved && (
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>الموافقة على المراجعة</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من الموافقة على مراجعة "{review.title}"؟ 
                                  ستظهر المراجعة للجمهور وستؤثر على تقييم الشركة.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleApproveReview(review.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  موافقة
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>رفض المراجعة</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من رفض مراجعة "{review.title}"؟ 
                                  سيتم حذف المراجعة نهائياً ولن يمكن استرجاعها.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRejectReview(review.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  رفض ونحذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                لا توجد مراجعات
              </h3>
              <p className="text-gray-500">
                لم يتم العثور على مراجعات تطابق الفلاتر المحددة
              </p>
            </div>
          )}

          {/* التنقل بين الصفحات */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-gray-500">
                صفحة {currentPage} من {totalPages}
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
