import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://sub.hieunt-vogue.online'; // Cập nhật URL production

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/', // Chặn bot cào API backend
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
