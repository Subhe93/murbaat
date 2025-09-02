import './globals.css';
import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { NextAuthProvider } from '@/components/providers/session-provider';

const cairo = Cairo({ subsets: ['arabic'] });

export const metadata: Metadata = {
  title: 'مربعات | دليل الشركات والخدمات',
  description: 'دليل شامل للشركات والخدمات العربية والعالمية. اكتشف الشركات والخدمات في جميع أنحاء العالم',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={cairo.className}>
        <NextAuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <div className="min-h-screen">
              {children}
            </div>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}