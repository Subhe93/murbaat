import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // يمكن إضافة منطق إضافي هنا إذا لزم الأمر
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // حماية مسارات لوحة تحكم المدير
        if (pathname.startsWith('/admin')) {
          return token?.role === 'SUPER_ADMIN' || token?.role === 'ADMIN'
        }

        // حماية مسارات لوحة تحكم الشركة
        if (pathname.startsWith('/company-dashboard')) {
          return token?.role === 'COMPANY_OWNER' || token?.role === 'SUPER_ADMIN'
        }

        // السماح بالوصول للمسارات الأخرى
        return true
      },
    },
    pages: {
      signIn: '/auth/signin',
    }
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/company-dashboard/:path*'
  ]
}
