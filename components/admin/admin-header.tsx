'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Search, Menu, User, LogOut, Settings, Home } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AdminHeader() {
  const { data: session, status } = useSession()
  const [notifications] = useState([
    { id: 1, title: 'طلب شركة جديد', message: 'شركة ABC تطلب الانضمام', type: 'request' },
    { id: 2, title: 'مراجعة جديدة', message: 'مراجعة جديدة لشركة XYZ', type: 'review' },
    { id: 3, title: 'تحديث النظام', message: 'تحديث النظام متاح', type: 'system' },
  ])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          
          <Link href="/admin" className="flex items-center space-x-3 space-x-reverse">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">م</span>
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">مربعات</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">لوحة تحكم المدير</p>
            </div>
          </Link>
        </div>

        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="بحث في الشركات، المراجعات، المستخدمين..."
              className="w-full pr-10 pl-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4 space-x-reverse">
          {/* الإشعارات */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -left-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3">
                  <div className="font-medium text-sm">{notification.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{notification.message}</div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/admin/notifications" className="w-full text-center text-sm">
                  عرض جميع الإشعارات
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* زر العودة للموقع */}
          <Button variant="outline" size="sm" asChild>
            <Link href="/" className="hidden md:flex items-center">
              <Home className="h-4 w-4 mr-2" />
              عرض الموقع
            </Link>
          </Button>

          {/* قائمة المستخدم */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/admin-avatar.png" alt="المدير" />
                  <AvatarFallback>مد</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {session && (
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session?.user.name}</p>
                    <p className="text-xs text-gray-500">{session?.user.email}</p>
                  </div>
                ) && (
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session?.user.name}</p>
                    <p className="text-xs text-gray-500">{session?.user.email}</p>
                  </div>
                )}
             
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* <DropdownMenuItem>
                <User className="ml-2 h-4 w-4" />
                الملف الشخصي
              </DropdownMenuItem> */}
              {/* <DropdownMenuItem>
                <Settings className="ml-2 h-4 w-4" />
                الإعدادات
              </DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 cursor-pointer"
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              >
                <LogOut className="ml-2 h-4 w-4" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
