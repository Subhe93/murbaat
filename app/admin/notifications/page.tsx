'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock,
  Building2,
  MessageSquare,
  Users,
  AlertTriangle,
  Trash2,
  MarkAsUnread,
  Filter
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

interface Notification {
  id: string
  type: 'company_request' | 'review_pending' | 'user_registered' | 'system'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  data?: any
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const { data: session, status } = useSession()
  const router = useRouter()

  // محاكاة البيانات - في التطبيق الحقيقي ستأتي من API
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'company_request',
      title: 'طلب شركة جديد',
      message: 'شركة "مطعم الأصالة" تطلب الانضمام للمنصة',
      isRead: false,
      createdAt: new Date().toISOString(),
      data: { companyName: 'مطعم الأصالة', requestId: 'req_1' }
    },
    {
      id: '2',
      type: 'review_pending',
      title: 'مراجعة تحتاج موافقة',
      message: 'مراجعة جديدة من أحمد محمد لشركة "فندق النخيل"',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      data: { reviewId: 'rev_1', companyName: 'فندق النخيل' }
    },
    {
      id: '3',
      type: 'user_registered',
      title: 'مستخدم جديد',
      message: 'انضم مستخدم جديد: سارة أحمد',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      data: { userId: 'user_1', userName: 'سارة أحمد' }
    },
    {
      id: '4',
      type: 'system',
      title: 'تحديث النظام',
      message: 'تم تحديث النظام إلى الإصدار 2.1.0 بنجاح',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      data: { version: '2.1.0' }
    }
  ]

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

  useEffect(() => {
    if (session) {
      // محاكاة تحميل الإشعارات
      setTimeout(() => {
        setNotifications(mockNotifications)
        setIsLoading(false)
      }, 1000)
    }
  }, [session])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'company_request':
        return <Building2 className="h-5 w-5 text-blue-600" />
      case 'review_pending':
        return <MessageSquare className="h-5 w-5 text-green-600" />
      case 'user_registered':
        return <Users className="h-5 w-5 text-purple-600" />
      case 'system':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getNotificationTypeText = (type: string) => {
    switch (type) {
      case 'company_request':
        return 'طلب شركة'
      case 'review_pending':
        return 'مراجعة معلقة'
      case 'user_registered':
        return 'مستخدم جديد'
      case 'system':
        return 'نظام'
      default:
        return 'إشعار'
    }
  }

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    )
  }

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    )
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.isRead
    if (filter === 'read') return notif.isRead
    if (filter && filter !== 'all') return notif.type === filter
    return true
  })

  const unreadCount = notifications.filter(notif => !notif.isRead).length

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            الإشعارات
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            متابعة جميع الأنشطة والتحديثات ({unreadCount} غير مقروء)
          </p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="تصفية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="unread">غير مقروء</SelectItem>
              <SelectItem value="read">مقروء</SelectItem>
              <SelectItem value="company_request">طلبات الشركات</SelectItem>
              <SelectItem value="review_pending">مراجعات معلقة</SelectItem>
              <SelectItem value="user_registered">مستخدمين جدد</SelectItem>
              <SelectItem value="system">النظام</SelectItem>
            </SelectContent>
          </Select>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCircle className="h-4 w-4 ml-2" />
              تعليم الكل كمقروء
            </Button>
          )}
        </div>
      </div>

      {/* قائمة الإشعارات */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الإشعارات</CardTitle>
          <CardDescription>
            عرض {filteredNotifications.length} من إجمالي {notifications.length} إشعار
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`flex items-start space-x-4 space-x-reverse p-4 rounded-lg border transition-colors ${
                    notification.isRead 
                      ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.isRead 
                      ? 'bg-gray-100 dark:bg-gray-700' 
                      : 'bg-blue-100 dark:bg-blue-900'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 space-x-reverse mb-1">
                          <h4 className={`font-medium ${
                            notification.isRead 
                              ? 'text-gray-900 dark:text-gray-300' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {notification.title}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {getNotificationTypeText(notification.type)}
                          </Badge>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <p className={`text-sm ${
                          notification.isRead 
                            ? 'text-gray-600 dark:text-gray-400' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString('ar-SA')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف الإشعار</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف هذا الإشعار؟ لن يمكن استرجاعه.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                لا توجد إشعارات
              </h3>
              <p className="text-gray-500">
                لم يتم العثور على إشعارات تطابق الفلتر المحدد
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* إحصائيات الإشعارات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Bell className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {notifications.length}
                </p>
                <p className="text-sm text-gray-600">إجمالي الإشعارات</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {unreadCount}
                </p>
                <p className="text-sm text-gray-600">غير مقروء</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Building2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {notifications.filter(n => n.type === 'company_request').length}
                </p>
                <p className="text-sm text-gray-600">طلبات شركات</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <MessageSquare className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {notifications.filter(n => n.type === 'review_pending').length}
                </p>
                <p className="text-sm text-gray-600">مراجعات معلقة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}