const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'https://catalunya-english.com';
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');

// Static routes
const staticRoutes = [
  '',
  '/home',
  '/login',
  '/register',
  '/my-courses',
  '/vocabulary-review',
  '/vocabulary-notebook',
];

// In a real scenario, you would fetch these from your API
const dynamicRoutes = [
  // '/course/1',
  // '/course/2',
];

const generateSitemap = () => {
  const allRoutes = [...staticRoutes, ...dynamicRoutes];
  
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route === '' ? 'daily' : 'monthly'}</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  try {
    if (!fs.existsSync(PUBLIC_DIR)) {
      fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }
    fs.writeFileSync(SITEMAP_PATH, sitemapContent);
    console.log(`✅ Sitemap generated successfully at: ${SITEMAP_PATH}`);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
  }
};

generateSitemap();
