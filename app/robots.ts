import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/student/', '/auth/'],
    },
    sitemap: 'https://www.iseeict.lk/sitemap.xml',
  }
}
