'use client'

import { useState } from 'react'
import { Bell, Check, Filter } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useNotifications } from '@/hooks/use-notifications'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const { notifications, stats, loading, markAsRead, markAllAsRead } = useNotifications()
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // إذا كان المستخدم غير مسجل الدخول، عرض رسالة تحميل
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 mr-3">جاري التحميل...</p>
      </div>
    )
  }

  // إذا لم يكن المستخدم مسجل الدخول، عرض رسالة خطأ
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            يجب تسجيل الدخول
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            يجب تسجيل الدخول لعرض الإشعارات
          </p>
        </div>
      </div>
    )
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'review':
        return '⭐'
      case 'message':
        return '💬'
      case 'system':
        return '🔔'
      case 'award':
        return '🏆'
      default:
        return '📢'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'message':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'system':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
      case 'award':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'الآن'
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`
    return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`
  }

  const filteredNotifications = notifications.filter(notification => {
    const typeMatch = filterType === 'all' || notification.type === filterType
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'unread' && !notification.isRead) ||
      (filterStatus === 'read' && notification.isRead)
    return typeMatch && statusMatch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الإشعارات</h1>
          <p className="text-gray-600 dark:text-gray-400">
            إدارة إشعارات شركتك والتفاعل معها
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          {stats.unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <Check className="h-4 w-4 ml-2" />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الإشعارات</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <Bell className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">غير مقروءة</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <span className="text-lg">⭐</span>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">مراجعات</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.byType.review}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <span className="text-lg">💬</span>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">رسائل</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.byType.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">تصفية:</span>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="review">المراجعات</SelectItem>
                <SelectItem value="message">الرسائل</SelectItem>
                <SelectItem value="system">النظام</SelectItem>
                <SelectItem value="award">الجوائز</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="unread">غير مقروءة</SelectItem>
                <SelectItem value="read">مقروءة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الإشعارات</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">جاري التحميل...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start space-x-4 space-x-reverse p-4 rounded-lg border transition-colors",
                    !notification.isRead 
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  )}
                >
                  <div className="text-2xl mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 space-x-reverse mb-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </h3>
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs", getNotificationColor(notification.type))}
                          >
                            {notification.type === 'review' && 'مراجعة'}
                            {notification.type === 'message' && 'رسالة'}
                            {notification.type === 'system' && 'نظام'}
                            {notification.type === 'award' && 'جائزة'}
                          </Badge>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
