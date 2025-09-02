import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://morabaat.com'
  
  const robotsTxt = `User-agent: *
Allow: /

# Specific crawling rules
Allow: /api/homepage
Allow: /_next/static/

# Disallow admin and API routes
Disallow: /admin
Disallow: /api/admin
Disallow: /api/auth
Disallow: /company-dashboard
Disallow: /_next/
Disallow: /uploads/

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for better server performance
Crawl-delay: 1`

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // 24 hours
    },
  })
}
