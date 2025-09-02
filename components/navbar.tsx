'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Search, Menu, X, Moon, Sun, User, LogOut, Settings } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SearchDialog } from '@/components/search-dialog';
import { NotificationBell } from '@/components/notifications/notification-bell';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 space-x-reverse">
              <div className="w-8 h-8 bg-gradient-to-r from-brand-green to-brand-yellow rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">دش</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">مربعات</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6 space-x-reverse">
              <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                الرئيسية
              </Link>
              <Link href="/search" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                البحث المتقدم
              </Link>
              <Link href="/sy" className="text-gray-700 dark:text-gray-300 hover:text-brand-green dark:hover:text-brand-green transition-colors">
                سوريا
              </Link>
              <Link href="/lb" className="text-gray-700 dark:text-gray-300 hover:text-brand-orange dark:hover:text-brand-orange transition-colors">
                لبنان
              </Link>
              <Link href="/jo" className="text-gray-700 dark:text-gray-300 hover:text-brand-yellow dark:hover:text-brand-yellow transition-colors">
                الأردن
              </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
              
              {/* إشعارات للشركات */}
              {session?.user?.role === 'COMPANY_OWNER' && (
                <NotificationBell />
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {/* قائمة المستخدم */}
              {status === 'loading' ? (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              ) : session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={session.user.image || undefined} />
                        <AvatarFallback>
                          {session.user.name?.charAt(0) || session.user.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{session.user.name}</p>
                        <p className="text-xs text-gray-500">{session.user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {(session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN') && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <Settings className="h-4 w-4 ml-2" />
                          لوحة تحكم المدير
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    {session.user.role === 'COMPANY_OWNER' && (
                      <DropdownMenuItem asChild>
                        <Link href="/company-dashboard">
                          <Settings className="h-4 w-4 ml-2" />
                          لوحة تحكم الشركة
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    {/* <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="h-4 w-4 ml-2" />
                        الملف الشخصي
                      </Link>
                    </DropdownMenuItem> */}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="h-4 w-4 ml-2" />
                      تسجيل الخروج
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button variant="ghost" asChild>
                    <Link href="/auth/signin">
                      تسجيل الدخول
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/add-company">
                      إضافة شركة
                    </Link>
                  </Button>
                </div>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4">
              <div className="space-y-3">
                <Link 
                  href="/" 
                  className="block text-gray-700 dark:text-gray-300 hover:text-brand-green dark:hover:text-brand-green"
                  onClick={() => setIsMenuOpen(false)}
                >
                  الرئيسية
                </Link>
                <Link 
                  href="/search" 
                  className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => setIsMenuOpen(false)}
                >
                  البحث المتقدم
                </Link>
                <Link 
                  href="/sy" 
                  className="block text-gray-700 dark:text-gray-300 hover:text-brand-green dark:hover:text-brand-green"
                  onClick={() => setIsMenuOpen(false)}
                >
                  سوريا
                </Link>
                <Link 
                  href="/lb" 
                  className="block text-gray-700 dark:text-gray-300 hover:text-brand-orange dark:hover:text-brand-orange"
                  onClick={() => setIsMenuOpen(false)}
                >
                  لبنان
                </Link>
                <Link 
                  href="/jo" 
                  className="block text-gray-700 dark:text-gray-300 hover:text-brand-yellow dark:hover:text-brand-yellow"
                  onClick={() => setIsMenuOpen(false)}
                >
                  الأردن
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}