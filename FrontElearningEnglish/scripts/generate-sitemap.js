const fs = require('fs');
const path = require('path');

// --- CẤU HÌNH ---
const BASE_URL = 'https://learning-eng.hocnghiepvu.com';
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');

// 1. Các trang tĩnh (Luôn luôn có)
const staticRoutes = [
  '',
  '/home',
  '/login',
  '/register',
  '/my-courses',
  '/vocabulary-review',
  '/vocabulary-notebook',
  '/search',
  '/pricing'
];

// 2. Các trang động (Khóa học, Bài viết...)
// Sau này bạn có thể viết code ở đây để fetch dữ liệu từ Database/API
const dynamicRoutes = [
  // Ví dụ: '/course/1', '/course/2', ...
];

const generateSitemap = () => {
  const allRoutes = [...staticRoutes, ...dynamicRoutes];
  const lastMod = new Date().toISOString().split('T')[0];
  
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>${route === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${route === '' ? '1.0' : route.includes('/course/') ? '0.9' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  try {
    if (!fs.existsSync(PUBLIC_DIR)) {
      fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }
    fs.writeFileSync(SITEMAP_PATH, sitemapContent);
    console.log(`✅ [Sitemap] Đã tạo thành công tại: ${SITEMAP_PATH}`);
    console.log(`🔗 URL: ${BASE_URL}/sitemap.xml`);
  } catch (error) {
    console.error('❌ [Sitemap] Lỗi khi tạo file:', error);
  }
};

generateSitemap();
