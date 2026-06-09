import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://autocsr.ai'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: APP_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${APP_URL}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/terms`,
      lastModified: new Date('2026-06-08'),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${APP_URL}/privacy`,
      lastModified: new Date('2026-06-08'),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${APP_URL}/refund`,
      lastModified: new Date('2026-06-08'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
