import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export interface Notification {
  id: string
  type: 'review' | 'message' | 'system' | 'award'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  data?: {
    reviewId?: string
    companyId?: string
    userId?: string
  }
}

export interface NotificationStats {
  unreadCount: number
  totalCount: number
  byType: {
    review: number
    message: number
    system: number
    award: number
  }
}

export function useNotifications() {
  const { data: session, status } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats>({
    unreadCount: 0,
    totalCount: 0,
    byType: { review: 0, message: 0, system: 0, award: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // جلب الإشعارات
  const fetchNotifications = async () => {
    if (!session?.user?.id || status === 'loading') return

    try {
      setLoading(true)
      const response = await fetch('/api/notifications')
      if (!response.ok) throw new Error('فشل في جلب الإشعارات')
      
      const data = await response.json()
      setNotifications(data.notifications)
      setStats(data.stats)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  // تحديث حالة الإشعار
  const markAsRead = async (notificationId: string) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        )
        
        // تحديث الإحصائيات
        setStats(prev => ({
          ...prev,
          unreadCount: Math.max(0, prev.unreadCount - 1)
        }))
      }
    } catch (err) {
      console.error('خطأ في تحديث حالة الإشعار:', err)
    }
  }

  // تحديث جميع الإشعارات كمقروءة
  const markAllAsRead = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH'
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        )
        setStats(prev => ({ ...prev, unreadCount: 0 }))
      }
    } catch (err) {
      console.error('خطأ في تحديث جميع الإشعارات:', err)
    }
  }

  // إعادة جلب الإشعارات
  const refetch = () => {
    if (session?.user?.id) {
      fetchNotifications()
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchNotifications()
      
      // تحديث الإشعارات كل دقيقة
      const interval = setInterval(fetchNotifications, 60000)
      return () => clearInterval(interval)
    } else if (status === 'unauthenticated') {
      setLoading(false)
      setNotifications([])
      setStats({
        unreadCount: 0,
        totalCount: 0,
        byType: { review: 0, message: 0, system: 0, award: 0 }
      })
    }
  }, [session?.user?.id, status])

  return {
    notifications,
    stats,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch
  }
}
